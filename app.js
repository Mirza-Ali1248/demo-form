/* LOCAL DEMO ONLY — do not use for real accounts or sensitive information.
   Change this demo password before testing: it is NOT secure authentication. */
const DEMO_ADMIN_PASSWORD = "Admin123!";
const STORAGE_KEY = "signupPortalDemoUsersV1";

const $ = (id) => document.getElementById(id);
const form = $("signupForm");
const message = $("formMessage");
const modal = $("adminModal");
const dashboard = $("dashboard");
let isAdmin = false;
let selectedUserId = null;

function getUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}
function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch],
  );
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const user = {
    id: crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
    fullName: String(data.get("fullName") || "").trim(),
    email: String(data.get("email") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    dob: String(data.get("dob") || ""),
    gender: String(data.get("gender") || ""),
    city: String(data.get("city") || "").trim(),
    address: String(data.get("address") || "").trim(),
    createdAt: new Date().toISOString(),
  };
  if (!user.fullName || !user.email || !user.phone) {
    message.textContent = "Please fill in all required fields.";
    message.classList.add("error");
    return;
  }
  const users = getUsers();
  users.unshift(user);
  try {
    saveUsers(users);
  } catch {
    message.textContent =
      "Could not save. Browser storage may be full or disabled.";
    message.classList.add("error");
    return;
  }
  form.reset();
  message.classList.remove("error");
  message.textContent =
    "Signup saved in this browser. Admin can view it after login.";
  if (isAdmin) renderDashboard();
});

$("adminOpen").addEventListener("click", () => {
  modal.classList.remove("hidden");
  $("adminPassword").focus();
});
$("adminClose").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});
function closeModal() {
  modal.classList.add("hidden");
}

$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const supplied = $("adminPassword").value;
  if (supplied !== DEMO_ADMIN_PASSWORD) {
    $("loginMessage").textContent = "Incorrect password. Try again.";
    $("loginMessage").classList.add("error");
    return;
  }
  isAdmin = true;
  $("loginMessage").textContent = "";
  $("adminPassword").value = "";
  closeModal();
  dashboard.classList.remove("hidden");
  renderDashboard();
  dashboard.scrollIntoView({ behavior: "smooth", block: "start" });
});
$("logout").addEventListener("click", () => {
  isAdmin = false;
  selectedUserId = null;
  dashboard.classList.add("hidden");
  $("detailBox").classList.add("hidden");
});
$("searchInput").addEventListener("input", renderDashboard);

function renderDashboard() {
  if (!isAdmin) return;
  const query = $("searchInput").value.trim().toLowerCase();
  const users = getUsers();
  const filtered = users.filter((user) =>
    [user.fullName, user.email, user.phone, user.city].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(query),
    ),
  );
  $("userCount").textContent = String(users.length);
  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
  $("usersTable").classList.toggle("hidden", filtered.length === 0);
  $("usersBody").innerHTML = filtered
    .map(
      (user) => `
    <tr>
      <td>${escapeHtml(user.fullName)}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.phone)}</td>
      <td>${escapeHtml(user.city || "—")}</td>
      <td>${escapeHtml(formatDate(user.createdAt))}</td>
      <td><div class="row-actions">
        <button class="mini-button" data-action="view" data-id="${escapeHtml(user.id)}">View</button>
        <button class="mini-button" data-action="delete" data-id="${escapeHtml(user.id)}">Delete</button>
      </div></td>
    </tr>`,
    )
    .join("");
}
$("usersBody").addEventListener("click", (event) => {
  if (!isAdmin) return;
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  if (button.dataset.action === "view") showDetails(id);
  if (button.dataset.action === "delete") {
    const user = getUsers().find((item) => item.id === id);
    if (user && confirm(`Delete registration for ${user.fullName}?`)) {
      saveUsers(getUsers().filter((item) => item.id !== id));
      if (selectedUserId === id) $("detailBox").classList.add("hidden");
      renderDashboard();
    }
  }
});
function showDetails(id) {
  const user = getUsers().find((item) => item.id === id);
  if (!user) return;
  selectedUserId = id;
  const fields = [
    ["Full name", user.fullName],
    ["Email", user.email],
    ["Mobile", user.phone],
    ["Date of birth", user.dob],
    ["Gender", user.gender],
    ["City", user.city],
    ["Address", user.address],
    ["Submitted", formatDate(user.createdAt)],
  ];
  $("detailBox").innerHTML = fields
    .map(
      ([label, value]) =>
        `<div class="detail-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "—")}</strong></div>`,
    )
    .join("");
  $("detailBox").classList.remove("hidden");
  $("detailBox").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
$("exportBtn").addEventListener("click", () => {
  if (!isAdmin) return;
  const users = getUsers();
  if (!users.length) {
    alert("There are no registrations to export.");
    return;
  }
  const headers = [
    "Full name",
    "Email",
    "Mobile",
    "Date of birth",
    "Gender",
    "City",
    "Address",
    "Submitted",
  ];
  const keys = [
    "fullName",
    "email",
    "phone",
    "dob",
    "gender",
    "city",
    "address",
    "createdAt",
  ];
  const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers,
    ...users.map((user) => keys.map((key) => user[key] || "")),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "signup-registrations.csv";
  a.click();
  URL.revokeObjectURL(url);
});
$("clearBtn").addEventListener("click", () => {
  if (!isAdmin) return;
  if (
    confirm(
      "Permanently delete ALL demo registrations from this browser? This cannot be undone.",
    )
  ) {
    saveUsers([]);
    $("detailBox").classList.add("hidden");
    renderDashboard();
  }
});
