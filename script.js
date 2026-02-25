const STORAGE_KEY = "miniTodoApp.tasks";
const FILTER_STORAGE_KEY = "miniTodoApp.filter";

const APP_VERSION = "0.2.1";
const RELEASE_DATE = "2026-02-25 11:35"; // bei Änderungen manuell anpassen

const FILTER_LABELS = {
  all: "Alle",
  open: "Offen",
  done: "Erledigt",
};

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const progressText = document.getElementById("progress-text");
const emptyState = document.getElementById("empty-state");
const errorMessage = document.getElementById("error-message");
const clearDoneBtn = document.getElementById("clear-done-btn");
const versionInfo = document.getElementById("app-version-info");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = loadTasks();
let currentFilter = loadFilter();

render();
renderVersionInfo();

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = taskInput.value.trim();

  if (!text) {
    showError("Bitte gib eine Aufgabe ein.");
    return;
  }

  const newTask = {
    id: createId(),
    text,
    done: false,
    createdAt: Date.now(),
  };

  tasks.unshift(newTask);
  saveTasks();
  render();

  taskInput.value = "";
  taskInput.focus();
  showError("");
});

taskList.addEventListener("click", (event) => {
  const target = event.target;
  const taskItem = target.closest("[data-task-id]");
  if (!taskItem) return;

  const taskId = taskItem.dataset.taskId;

  if (target.classList.contains("delete-btn")) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    render();
  }
});

taskList.addEventListener("change", (event) => {
  const target = event.target;
  if (!target.classList.contains("task-checkbox")) return;

  const taskItem = target.closest("[data-task-id]");
  if (!taskItem) return;

  const taskId = taskItem.dataset.taskId;
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  task.done = target.checked;
  saveTasks();
  render();
});

clearDoneBtn.addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextFilter = button.dataset.filter;
    if (!isValidFilter(nextFilter)) return;

    currentFilter = nextFilter;
    saveFilter();
    render();
  });
});

function render() {
  taskList.innerHTML = "";

  const visibleTasks = getVisibleTasks();

  if (visibleTasks.length === 0) {
    emptyState.classList.remove("hidden");
    emptyState.textContent = getEmptyStateText();
  } else {
    emptyState.classList.add("hidden");
  }

  for (const task of visibleTasks) {
    const li = document.createElement("li");
    li.className = `task-item ${task.done ? "done" : ""}`;
    li.dataset.taskId = task.id;

    li.innerHTML = `
      <input
        class="task-checkbox"
        type="checkbox"
        ${task.done ? "checked" : ""}
        aria-label="Aufgabe erledigt markieren"
      />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="delete-btn" type="button" aria-label="Aufgabe löschen">🗑️</button>
    `;

    taskList.appendChild(li);
  }

  updateProgress();
  updateFilterButtons();
}

function getVisibleTasks() {
  if (currentFilter === "open") {
    return tasks.filter((task) => !task.done);
  }

  if (currentFilter === "done") {
    return tasks.filter((task) => task.done);
  }

  return tasks;
}

function getEmptyStateText() {
  if (tasks.length === 0) {
    return "Noch keine Aufgaben. Starte mit deiner ersten ✨";
  }

  if (currentFilter === "open") {
    return "Keine offenen Aufgaben 🎉";
  }

  if (currentFilter === "done") {
    return "Noch keine erledigten Aufgaben.";
  }

  return "Keine Aufgaben gefunden.";
}

function updateFilterButtons() {
  const doneCount = tasks.filter((task) => task.done).length;
  const openCount = tasks.length - doneCount;

  const counts = {
    all: tasks.length,
    open: openCount,
    done: doneCount,
  };

  filterButtons.forEach((button) => {
    const filter = button.dataset.filter;
    const isActive = filter === currentFilter;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));

    const label = FILTER_LABELS[filter] ?? filter;
    const count = counts[filter] ?? 0;
    button.textContent = `${label} (${count})`;
  });
}

function updateProgress() {
  const doneCount = tasks.filter((task) => task.done).length;
  progressText.textContent = `${doneCount} von ${tasks.length} erledigt`;
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (task) =>
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.done === "boolean"
    );
  } catch {
    return [];
  }
}

function saveFilter() {
  localStorage.setItem(FILTER_STORAGE_KEY, currentFilter);
}

function loadFilter() {
  const raw = localStorage.getItem(FILTER_STORAGE_KEY);
  return isValidFilter(raw) ? raw : "all";
}

function isValidFilter(value) {
  return value === "all" || value === "open" || value === "done";
}

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now() + Math.random());
}

function showError(message) {
  errorMessage.textContent = message;
}

function renderVersionInfo() {
  if (!versionInfo) return;
  versionInfo.textContent = `Version ${APP_VERSION} · Stand: ${RELEASE_DATE}`;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}