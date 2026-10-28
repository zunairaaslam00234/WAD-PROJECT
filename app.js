
"use strict";


function getElement(id) {
  return document.getElementById(id);
}

function showMessage(element, message, type = "info") {
  if (!element) return;

  element.textContent = message;
  element.className = "form-message " + type;
}

function normalise(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getCellText(row) {
  return normalise(row.textContent);
}

function visibleRows(rows) {
  return rows.filter((row) => !row.hidden);
}

function updateCount(element, count, singular, plural = singular + "s") {
  if (!element) return;

  element.textContent =
    count + " " + (count === 1 ? singular : plural);
}

/* ---------- 2. MOBILE NAVIGATION ---------- */

function initNavigation() {
  const toggle = getElement("menu-toggle");
  const nav = getElement("nav-links");

  if (!toggle || !nav) return;

  toggle.setAttribute("aria-expanded", "false");

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Toggle navigation"
    );
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Toggle navigation");
      toggle.textContent = "☰";
    });
  });

  // Close the mobile navigation when clicking outside it.
  document.addEventListener("click", (event) => {
    if (
      nav.classList.contains("open") &&
      !nav.contains(event.target) &&
      !toggle.contains(event.target)
    ) {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
      toggle.setAttribute("aria-label", "Toggle navigation");
    }
  });
}

/* ---------- 3. GENERIC SEARCH AND FILTERING ---------- */

function filterRows({
  rows,
  searchInput,
  filters = [],
  emptyElement,
  countElement,
  singular = "record",
  plural = "records"
}) {
  const update = () => {
    const search = normalise(searchInput?.value);

    rows.forEach((row) => {
      let matches = !search || getCellText(row).includes(search);

      filters.forEach(({ input, getValue, getRowValue }) => {
        if (!input) return;

        const selected = normalise(getValue(input));

        if (selected) {
          const rowValue = normalise(getRowValue(row));

          if (rowValue !== selected) {
            matches = false;
          }
        }
      });

      row.hidden = !matches;
    });

    const count = visibleRows(rows).length;

    if (emptyElement) {
      emptyElement.hidden = count !== 0;
    }

    updateCount(countElement, count, singular, plural);
  };

  searchInput?.addEventListener("input", update);

  filters.forEach(({ input }) => {
    input?.addEventListener("change", update);
  });

  update();

  return update;
}

/* ---------- 4. PUBLIC EVENT SEARCH ---------- */

function initPublicEvents() {
  const search =
    getElement("event-search") ||
    getElement("search-events");

  const category =
    getElement("event-category-filter") ||
    getElement("category-filter");

  const eventRows = Array.from(
    document.querySelectorAll("[data-event-card]")
  );

  if (!eventRows.length) return;

  filterRows({
    rows: eventRows,
    searchInput: search,
    filters: [
      {
        input: category,
        getValue: (input) => input.value,
        getRowValue: (row) =>
          row.dataset.category ||
          row.querySelector("[data-category]")?.dataset.category ||
          ""
      }
    ],
    emptyElement: getElement("events-empty"),
    countElement: getElement("events-count"),
    singular: "event",
    plural: "events"
  });
}

/* ---------- 5. EVENT REGISTRATION FORM ---------- */

function initEventRegistration() {
  const form = getElement("event-registration-form");
  const eventSelect = getElement("registration-event");
  const eventId = getElement("registration-event-id");
  const message = getElement("registration-message");

  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const requestedEvent = params.get("event");

  // Allow event-details.html to pass an event ID in the URL.
  if (eventSelect && requestedEvent) {
    const matchingOption = Array.from(eventSelect.options).find(
      (option) =>
        option.value === requestedEvent ||
        normalise(option.textContent) === normalise(requestedEvent)
    );

    if (matchingOption) {
      eventSelect.value = matchingOption.value;
    }
  }

  const updateEventId = () => {
    if (eventId && eventSelect) {
      eventId.value = eventSelect.value;
    }

    if (eventSelect) {
      const heading = getElement("registration-heading");

      if (heading) {
        heading.textContent =
          "Register for " +
          eventSelect.options[eventSelect.selectedIndex].textContent;
      }
    }
  };

  eventSelect?.addEventListener("change", updateEventId);
  updateEventId();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    showMessage(
      message,
      "Your form is valid, but this demo has not saved your registration. Connect the form to PHP/MySQL to submit and store it.",
      "info"
    );
  });
}

/* ---------- 6. MEMBERSHIP APPLICATION FORM ---------- */

function initMembershipForm() {
  const form = getElement("membership-form");
  const message = getElement("membership-message");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const email = getElement("email");
    const sapId = getElement("sap-id");

    if (email && !email.validity.valid) {
      email.reportValidity();
      return;
    }

    if (sapId && !sapId.value.trim()) {
      sapId.focus();
      showMessage(message, "Please enter your student ID.", "error");
      return;
    }

    showMessage(
      message,
      "Validation successful. This prototype does not save applications yet; a PHP/MySQL backend is needed to submit your membership application.",
      "info"
    );
  });
}

/* ---------- 7. ADMIN LOGIN FORM ---------- */

function initAdminLogin() {
  const form = getElement("admin-login-form");
  const message = getElement("admin-login-message");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    showMessage(
      message,
      "The login interface is ready, but authentication is not connected. Implement server-side password verification before granting admin access.",
      "info"
    );
  });
}

/* ---------- 8. ADMIN MEMBER DIRECTORY ---------- */

function initAdminMembers() {
  const table = getElement("admin-members-table");
  if (!table) return;

  const search = getElement("member-search");
  const department = getElement("member-department-filter");
  const empty = getElement("members-no-results");
  const count = getElement("member-count");
  const message = getElement("members-message");

  const getRows = () =>
    Array.from(table.querySelectorAll(".admin-member-row"));

  const update = () => {
    filterRows({
      rows: getRows(),
      searchInput: search,
      filters: [
        {
          input: department,
          getValue: (input) => input.value,
          getRowValue: (row) => row.dataset.department
        }
      ],
      emptyElement: empty,
      countElement: count,
      singular: "member",
      plural: "members"
    });
  };

  search?.addEventListener("input", update);
  department?.addEventListener("change", update);

  table.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const row = button.closest(".admin-member-row");
    if (!row) return;

    if (button.classList.contains("delete-member")) {
      const name = row.cells[1]?.textContent.trim() || "this member";

      if (!window.confirm(`Remove ${name} from this demo table?`)) {
        return;
      }

      row.remove();
      update();

      showMessage(
        message,
        "The row was removed from this page only. A backend is required to delete a database record.",
        "info"
      );
    }

    if (button.classList.contains("edit-member")) {
      const nameCell = row.cells[1];
      const emailCell = row.cells[3];
      const departmentCell = row.cells[4];
      const semesterCell = row.cells[5];

      const newName = window.prompt("Edit student name:", nameCell.textContent);
      if (newName === null) return;

      const newEmail = window.prompt("Edit email:", emailCell.textContent);
      if (newEmail === null) return;

      const newDepartment = window.prompt(
        "Edit department:",
        departmentCell.textContent
      );
      if (newDepartment === null) return;

      const newSemester = window.prompt(
        "Edit semester:",
        semesterCell.textContent
      );
      if (newSemester === null) return;

      if (!newName.trim() || !newEmail.trim() || !newDepartment.trim()) {
        showMessage(
          message,
          "Name, email and department cannot be empty.",
          "error"
        );
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
        showMessage(message, "Enter a valid email address.", "error");
        return;
      }

      nameCell.textContent = newName.trim();
      emailCell.textContent = newEmail.trim();
      departmentCell.textContent = newDepartment.trim();
      semesterCell.textContent = newSemester.trim();
      row.dataset.department = newDepartment.trim();

      update();

      showMessage(
        message,
        "The sample row was edited on this page only; changes are not saved to a database.",
        "info"
      );
    }
  });

  update();
}

/* ---------- 9. ADMIN EVENT MANAGEMENT ---------- */

function initAdminEvents() {
  const form = getElement("admin-event-form");
  const table = getElement("admin-events-table");
  const formMessage = getElement("admin-event-message");
  const tableMessage = getElement("admin-events-message");

  if (form && table) {
    const titleInput = getElement("new-event-title");
    const categoryInput = getElement("new-event-category");
    const dateInput = getElement("new-event-date");
    const timeInput = getElement("new-event-time");
    const venueInput = getElement("new-event-venue");
    const descriptionInput = getElement("new-event-description");

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      if (!form.reportValidity()) return;

      const title = titleInput.value.trim();
      const category = categoryInput.value.trim();
      const date = dateInput.value;
      const time = timeInput.value;
      const venue = venueInput.value.trim();
      const description = descriptionInput.value.trim();

      if (!title || !category || !date || !time || !venue || !description) {
        showMessage(
          formMessage,
          "Please complete all required event fields.",
          "error"
        );
        return;
      }

      const id =
        Math.max(
          0,
          ...Array.from(table.querySelectorAll("tr")).map((row) =>
            Number(row.cells[0]?.textContent) || 0
          )
        ) + 1;

      const row = document.createElement("tr");
      row.className = "admin-event-row";

      // Use textContent rather than inserting user-entered HTML.
      const values = [
        String(id),
        title,
        category,
        date,
        venue
      ];

      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actions = document.createElement("td");

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "table-action edit-event";
      edit.textContent = "Edit";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "table-action danger delete-event";
      remove.textContent = "Delete";

      actions.append(edit, document.createTextNode(" "), remove);
      row.appendChild(actions);

      // Keep the description available for editing within this page.
      row.dataset.description = description;
      row.dataset.time = time;

      table.appendChild(row);
      form.reset();

      showMessage(
        formMessage,
        "Event added to the current page. It will not appear on other pages or survive a reload until a backend is connected.",
        "info"
      );
    });
  }

  if (!table) return;

  table.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;

    const row = button.closest(".admin-event-row");
    if (!row) return;

    if (button.classList.contains("delete-event")) {
      const title = row.cells[1]?.textContent.trim() || "this event";

      if (!window.confirm(`Delete "${title}" from this demo table?`)) {
        return;
      }

      row.remove();

      showMessage(
        tableMessage,
        "The event row was removed from this page only. No database record was deleted.",
        "info"
      );
    }

    if (button.classList.contains("edit-event")) {
      const titleCell = row.cells[1];
      const categoryCell = row.cells[2];
      const dateCell = row.cells[3];
      const venueCell = row.cells[4];

      const newTitle = window.prompt("Edit event title:", titleCell.textContent);
      if (newTitle === null) return;

      const newCategory = window.prompt(
        "Edit category:",
        categoryCell.textContent
      );
      if (newCategory === null) return;

      const newDate = window.prompt(
        "Edit date (YYYY-MM-DD):",
        dateCell.textContent
      );
      if (newDate === null) return;

      const newVenue = window.prompt("Edit venue:", venueCell.textContent);
      if (newVenue === null) return;

      if (
        !newTitle.trim() ||
        !newCategory.trim() ||
        !newDate.trim() ||
        !newVenue.trim()
      ) {
        showMessage(
          tableMessage,
          "Event title, category, date and venue cannot be empty.",
          "error"
        );
        return;
      }

      titleCell.textContent = newTitle.trim();
      categoryCell.textContent = newCategory.trim();
      dateCell.textContent = newDate.trim();
      venueCell.textContent = newVenue.trim();

      showMessage(
        tableMessage,
        "The event was edited on this page only. Connect the backend to save changes permanently.",
        "info"
      );
    }
  });
}

/* ---------- 10. ADMIN REGISTRATION DIRECTORY ---------- */

function initAdminRegistrations() {
  const table = getElement("admin-registrations-table");
  if (!table) return;

  const search = getElement("registration-search");
  const eventFilter = getElement("registration-event-filter");
  const statusFilter = getElement("registration-status-filter");
  const empty = getElement("registrations-empty");
  const message = getElement("registrations-message");

  const getRows = () =>
    Array.from(table.querySelectorAll(".registration-row"));

  const update = () => {
    const rows = getRows();

    filterRows({
      rows,
      searchInput: search,
      filters: [
        {
          input: eventFilter,
          getValue: (input) => input.value,
          getRowValue: (row) => row.dataset.event
        },
        {
          input: statusFilter,
          getValue: (input) => input.value,
          getRowValue: (row) => row.dataset.status
        }
      ],
      emptyElement: empty
    });

    const visible = visibleRows(rows);

    const total = getElement("registration-total");
    const confirmed = getElement("registration-confirmed");
    const pending = getElement("registration-pending");

    if (total) total.textContent = visible.length;

    if (confirmed) {
      confirmed.textContent = visible.filter(
        (row) => row.dataset.status === "Confirmed"
      ).length;
    }

    if (pending) {
      pending.textContent = visible.filter(
        (row) => row.dataset.status === "Pending"
      ).length;
    }
  };

  search?.addEventListener("input", update);
  eventFilter?.addEventListener("change", update);
  statusFilter?.addEventListener("change", update);

  table.addEventListener("click", (event) => {
    const button = event.target.closest(".delete-registration");
    if (!button) return;

    const row = button.closest(".registration-row");
    if (!row) return;

    const student = row.cells[1]?.textContent.trim() || "this registration";

    if (!window.confirm(`Remove ${student}'s registration from this demo?`)) {
      return;
    }

    row.remove();
    update();

    showMessage(
      message,
      "The registration was removed from this page only; the database has not been changed.",
      "info"
    );
  });

  update();
}

/* ---------- 11. PUBLIC MEMBER SEARCH (OPTIONAL) ---------- */

function initSimpleMemberSearch() {
  const search = getElement("search");
  const department = getElement("department");

  // Avoid using these generic IDs on the admin directory.
  if (!search || !department || getElement("admin-members-table")) return;

  const table = document.querySelector(".table-box table");
  if (!table) return;

  const rows = Array.from(table.querySelectorAll("tbody tr"));

  const update = () => {
    const term = normalise(search.value);
    const selectedDepartment = normalise(department.value);

    rows.forEach((row) => {
      const matchesSearch = getCellText(row).includes(term);
      const departmentCell = normalise(row.cells[3]?.textContent);
      const matchesDepartment =
        !selectedDepartment || departmentCell === selectedDepartment;

      row.hidden = !(matchesSearch && matchesDepartment);
    });
  };

  search.addEventListener("input", update);
  department.addEventListener("change", update);
}

/* ---------- 12. CONTACT FORM (OPTIONAL) ---------- */

function initContactForm() {
  const form = getElement("contact-form");
  const message = getElement("contact-message");

  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    showMessage(
      message,
      "Your message passed frontend validation, but it has not been sent. Configure a server-side contact endpoint to deliver messages.",
      "info"
    );
  });
}

/* ---------- 13. START APPLICATION ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initPublicEvents();
  initEventRegistration();
  initMembershipForm();
  initAdminLogin();
  initAdminMembers();
  initAdminEvents();
  initAdminRegistrations();
  initSimpleMemberSearch();
  initContactForm();
});