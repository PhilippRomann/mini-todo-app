const STORAGE_KEY = "miniTodoApp.tasks";

const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const progressText = document.getElementById("progress-text");
const emptyState = document.getElementById("empty-state");
const errorMessage = document.getElementById("error-message");
const clearDoneBtn = document.getElementById("clear-done-btn");

let tasks = loadTasks();

render();

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

  // Löschen
  if (target.classList.contains("delete-btn")) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    render();
    return;
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

function render() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
  }

  for (const task of tasks) {
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

function createId() {
  if (window.crypto && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return String(Date.now() + Math.random());
}

function showError(message) {
  errorMessage.textContent = message;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}