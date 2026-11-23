const STORAGE_KEY = "clouddesk.tickets.v1";

const DEFAULT_TICKETS = [
  {
    id: "HD-1048",
    title: "Laptop not connecting to office Wi-Fi",
    requester: "Chika Eze",
    email: "chika.eze@company.com",
    category: "Network",
    priority: "High",
    status: "Open",
    createdAt: "2026-11-23T08:30:00Z"
  },
  {
    id: "HD-1047",
    title: "VPN access request for remote work",
    requester: "Daniel Okafor",
    email: "daniel.okafor@company.com",
    category: "Access",
    priority: "Medium",
    status: "In progress",
    createdAt: "2026-11-22T14:15:00Z"
  },
  {
    id: "HD-1046",
    title: "Email client crashing on attachment preview",
    requester: "Amina Bello",
    email: "amina.bello@company.com",
    category: "Software",
    priority: "Low",
    status: "Resolved",
    createdAt: "2026-11-21T11:00:00Z"
  },
  {
    id: "HD-1045",
    title: "New monitor setup for finance desk",
    requester: "Tunde Adeyemi",
    email: "tunde.adeyemi@company.com",
    category: "Hardware",
    priority: "Low",
    status: "Open",
    createdAt: "2026-11-20T09:45:00Z"
  },
  {
    id: "HD-1044",
    title: "SSO login timeout on internal portal",
    requester: "Ngozi Nwosu",
    email: "ngozi.nwosu@company.com",
    category: "Security",
    priority: "High",
    status: "In progress",
    createdAt: "2026-11-19T16:20:00Z"
  }
];

const $ = (selector) => document.querySelector(selector);
const tableBody = $("#ticketTableBody");
const modal = $("#ticketModal");
const form = $("#ticketForm");

let tickets = [];
let backendStats = null;
let activeView = "dashboard";
let activeStatusFilter = "All";

function normalizeApiTicket(item) {
  return {
    dbId: item.id,
    id: item.ticket_code,
    title: item.title,
    requester: item.requester_name,
    email: item.requester_email,
    category: item.category,
    priority: item.priority,
    status: item.status,
    createdAt: item.created_at || new Date().toISOString()
  };
}

function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (error) {
    console.error("Could not cache tickets locally:", error);
  }
}

function loadLocalTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_TICKETS];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [...DEFAULT_TICKETS];
  } catch (error) {
    return [...DEFAULT_TICKETS];
  }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function formatDate(isoDate) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return String(isoDate || "");
  return new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

async function fetchTicketsFromApi() {
  try {
    const res = await fetch("/api/tickets");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    tickets = Array.isArray(data.tickets) ? data.tickets.map(normalizeApiTicket) : [];
    backendStats = data.stats || null;
    saveTickets();
  } catch (error) {
    console.warn("Falling back to local tickets:", error);
    tickets = loadLocalTickets();
    backendStats = null;
  }
}

function updateStats() {
  const total = backendStats ? backendStats.total : tickets.length;
  const open = backendStats ? backendStats.open : tickets.filter(t => t.status === "Open").length;
  const inProgress = backendStats ? backendStats.in_progress : tickets.filter(t => t.status === "In progress").length;
  const resolved = backendStats ? backendStats.resolved : tickets.filter(t => t.status === "Resolved").length;

  if ($("#statTotal")) $("#statTotal").textContent = total;
  if ($("#statOpen")) $("#statOpen").textContent = open;
  if ($("#statInProgress")) $("#statInProgress").textContent = inProgress;
  if ($("#statResolved")) $("#statResolved").textContent = resolved;
  if ($("#allTicketsCount")) $("#allTicketsCount").textContent = total;
}

function getFilteredTickets() {
  const query = ($("#searchInput")?.value || "").trim().toLowerCase();
  const priority = $("#priorityFilter")?.value || "All";

  return tickets.filter(ticket => {
    const matchesStatus = activeStatusFilter === "All" || ticket.status === activeStatusFilter;
    const matchesPriority = priority === "All" || ticket.priority === priority;
    const matchesQuery =
      !query ||
      ticket.id.toLowerCase().includes(query) ||
      ticket.title.toLowerCase().includes(query) ||
      ticket.requester.toLowerCase().includes(query) ||
      ticket.email.toLowerCase().includes(query) ||
      ticket.category.toLowerCase().includes(query);
    return matchesStatus && matchesPriority && matchesQuery;
  });
}

function renderTickets() {
  const visible = getFilteredTickets();

  if (tableBody) {
    tableBody.innerHTML = visible.map(ticket => `
      <tr>
        <td>
          <div class="ticket-id">${escapeHTML(ticket.id)}</div>
          <div class="ticket-title">${escapeHTML(ticket.title)}</div>
        </td>
        <td>
          <div class="requester-name">${escapeHTML(ticket.requester)}</div>
          <div class="requester-email">${escapeHTML(ticket.email)}</div>
        </td>
        <td>${escapeHTML(ticket.category)}</td>
        <td><span class="priority priority-${escapeHTML(ticket.priority.toLowerCase())}">• ${escapeHTML(ticket.priority)}</span></td>
        <td><span class="status-pill status-${escapeHTML(statusClass(ticket.status))}">• ${escapeHTML(ticket.status)}</span></td>
        <td>${escapeHTML(formatDate(ticket.createdAt))}</td>
        <td>
          <select class="status-select" data-ticket-id="${escapeHTML(ticket.id)}" aria-label="Status for ${escapeHTML(ticket.id)}">
            <option value="Open" ${ticket.status === "Open" ? "selected" : ""}>Open</option>
            <option value="In progress" ${ticket.status === "In progress" ? "selected" : ""}>In progress</option>
            <option value="Resolved" ${ticket.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
      </tr>
    `).join("");
  }

  const emptyState = $("#emptyState");
  if (emptyState) emptyState.hidden = visible.length > 0;
  if (tableBody?.closest("table")) {
    tableBody.closest("table").style.display = visible.length ? "table" : "none";
  }
  if ($("#resultCount")) {
    $("#resultCount").textContent = `Showing ${visible.length} of ${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`;
  }
  updateStats();
}

function setView(view, status = "All") {
  activeView = view;
  activeStatusFilter = status;
  document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
  const active = document.querySelector(`[data-view="${view}"]`) || document.querySelector(`[data-filter="${status}"]`);
  if (active) active.classList.add("active");

  const title = status !== "All" ? `${status} tickets` : view === "tickets" ? "All tickets" : "Good morning, Admin ✦";
  if ($("#breadcrumbCurrent")) $("#breadcrumbCurrent").textContent = status !== "All" ? status : view === "tickets" ? "All tickets" : "Overview";
  if ($("#pageTitle")) $("#pageTitle").textContent = title;
  if ($("#pageSubtitle")) {
    $("#pageSubtitle").textContent = status !== "All"
      ? `Review and update all ${status.toLowerCase()} support requests.`
      : view === "tickets" ? "View, search, and manage every support request." : "Here’s what’s happening with your support desk today.";
  }
  if ($("#tableTitle")) $("#tableTitle").textContent = status !== "All" ? `${status} tickets` : view === "tickets" ? "All tickets" : "Recent tickets";
  if ($("#tableDescription")) {
    $("#tableDescription").textContent = status !== "All" ? "Update a ticket’s status as work progresses." : "Track and manage the latest support requests.";
  }
  renderTickets();
}

function openModal() {
  if (!form || !modal) return;
  form.reset();
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => form.elements.title?.focus(), 0);
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
}

$("#openCreateModal")?.addEventListener("click", openModal);
$("#emptyCreateButton")?.addEventListener("click", openModal);
$("#closeModal")?.addEventListener("click", closeModal);
$("#cancelModal")?.addEventListener("click", closeModal);
modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = {
    title: form.elements.title?.value?.trim() || "",
    requester_name: form.elements.requester?.value?.trim() || "",
    requester_email: form.elements.email?.value?.trim() || "",
    category: form.elements.category?.value?.trim() || "General",
    priority: form.elements.priority?.value || "Medium",
    status: form.elements.status?.value || "Open"
  };

  try {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create ticket");

    await fetchTicketsFromApi();
    closeModal();
    renderTickets();
    showToast(`Created ticket ${data.ticket.ticket_code}.`);
  } catch (error) {
    console.error("Create ticket error:", error);
    showToast(error.message || "Could not create ticket.");
  }
});

tableBody?.addEventListener("change", async (event) => {
  const select = event.target.closest(".status-select");
  if (!select) return;

  const ticketCode = select.dataset.ticketId;
  const ticket = tickets.find(item => item.id === ticketCode);
  if (!ticket) return;

  const previousStatus = ticket.status;
  const nextStatus = select.value;

  try {
    if (ticket.dbId) {
      const res = await fetch(`/api/tickets/${ticket.dbId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      await fetchTicketsFromApi();
    } else {
      ticket.status = nextStatus;
      saveTickets();
    }
    renderTickets();
    showToast(`${ticket.id} status updated to ${nextStatus}.`);
  } catch (error) {
    select.value = previousStatus;
    console.error("Status update error:", error);
    showToast(error.message || "Could not update ticket status.");
  }
});

$("#searchInput")?.addEventListener("input", renderTickets);
$("#priorityFilter")?.addEventListener("change", renderTickets);

document.querySelectorAll("[data-view]").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view, "All"));
});
document.querySelectorAll("[data-filter]").forEach(button => {
  button.addEventListener("click", () => setView("tickets", button.dataset.filter));
});

$("#mobileMenu")?.addEventListener("click", () => $("#sidebar")?.classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(button => {
  button.addEventListener("click", () => $("#sidebar")?.classList.remove("open"));
});
$("#notificationButton")?.addEventListener("click", () => showToast("You’re all caught up."));

if ($("#todayLabel")) {
  $("#todayLabel").textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase();
}

(async function init() {
  await fetchTicketsFromApi();
  setView("dashboard", "All");
})();
