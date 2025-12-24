// File System Access API
let directoryHandle = null;
let kanbanFileHandle = null;
let currentKanbanContent = "";
let tasks = [];
let config = {};
let activeFilters = []; // Array of {type: 'tag'|'category'|'user', value: string}
let globalSearchTerm = ""; // Global search term for searching in title, description, and notes
let isEditMode = false;
let currentDetailTask = null;
let formSubtasks = [];
let archivedTasks = [];
let archiveFileHandle = null;

// ===== TRANSLATION SYSTEM =====
let currentLanguage = "en"; // Default language

const priorityIconClasses = {
  // Color circles
  "🟢": "Green",
  "🟡": "Yellow",
  "🟠": "Orange",
  "🔴": "Red",
  "🔵": "Blue",
  "🟣": "Purple",
  "⚪": "White",
  "⚫": "Black",
  // Hearts
  "❤️": "Red",
  "🧡": "Orange",
  "💛": "Yellow",
  "💚": "Green",
  "💙": "Blue",
  "💜": "Purple",
  "🤍": "White",
  "🖤": "Black",
  // Squares
  "🟥": "Red",
  "🟧": "Orange",
  "🟨": "Yellow",
  "🟩": "Green",
  "🟦": "Blue",
  "🟪": "Purple",
  // Diamonds
  "🔶": "Orange",
  "🔷": "Blue",
  "🔸": "Orange",
  "🔹": "Blue",
  // Stars
  "⭐": "Yellow",
  "🌟": "Yellow",
  // Flags
  "🚩": "Red",
  "🏴": "Black",
  "🏳️": "White",
  // Alert symbols
  "⚠️": "Yellow",
  "🔥": "Orange",
  "💥": "Red",
  "⚡": "Yellow",
  // Arrows
  "⬆️": "Red",
  "➡️": "Blue",
  "⬇️": "Green",
  // Exclamation/Question
  "❗": "Red",
  "❓": "Blue",
  "❕": "Red",
  "❔": "Blue",
};

// Translation function
function t(key, params = {}) {
  let text =
    translations[currentLanguage]?.[key] || translations["en"][key] || key;

  // Replace parameters in text
  Object.keys(params).forEach((param) => {
    text = text.replace(`{${param}}`, params[param]);
  });

  return text;
}

// Clean function
function clean(text) {
  // Remove any non-alphanumeric characters (emojis, symbols, etc.)
  return text.replace(/[^\w\s]+/, "").trim();
}

// Get first emoji from text
function getFirstEmoji(text) {
  const matches = text.match(/[^\w\s]+/);
  if (!matches) {
    return "";
  }

  // Take matched emojis, expand to array, take first element
  // This method is required to handle double byte characters
  return [...matches[0]][0] || "";
}

// Translate priority default values
function displayPriority(priority) {
  if (!priority || currentLanguage === "en") return priority;

  const emoji = getFirstEmoji(priority);
  const text = clean(priority);

  // Map default English priorities to translation keys
  const keyMap = {
    Critical: "taskForm.priorityCritical",
    High: "taskForm.priorityHigh",
    Medium: "taskForm.priorityMedium",
    Low: "taskForm.priorityLow",
  };

  // If it's a default priority, translate it
  if (keyMap[text]) {
    const translatedText = t(keyMap[text]);
    return emoji + (emoji ? " " : "") + translatedText;
  }

  // Custom priority - return as-is
  return priority;
}

// Update all static text elements in the UI
function updateStaticTexts() {
  // Update page title
  document.title = t("page.title");

  // Update header
  document.getElementById("headerTitle").textContent = t("header.title");
  document.getElementById("renameProjectBtn").title = t("header.renameProject");
  document.getElementById("deleteProjectBtn").title = t("header.deleteProject");
  document.getElementById("selectFolderBtn").innerHTML = t("header.folder");
  document.getElementById("newTaskBtn").innerHTML = t("header.newTask");
  document.getElementById("archiveBtn").innerHTML = t("header.archives");
  document.getElementById("manageColsBtn").innerHTML = t("header.columns");

  // Update language selector to match current language
  document.getElementById("languageSelector").value = currentLanguage;

  // Update welcome screen
  renderWelcomeScreen();

  // Update modals
  renderTaskDetailModal();
  updateTaskFormLabels();
  renderColumnsModal();
  renderArchivesModal();

  // Update filters
  updateFilterLabels();
}

// Render welcome screen with translations
function renderWelcomeScreen() {
  const welcomeScreen = document.getElementById("welcomeScreen");
  if (welcomeScreen) {
    welcomeScreen.innerHTML = `
            <h2>${t("welcome.title")}</h2>
            <p>${t("welcome.description")}</p>
            <button onclick="document.getElementById('selectFolderBtn').click()" class="btn btn-primary" style="font-size: 1.1rem; padding: 0.8rem 2rem;">
                ${t("welcome.start")}
            </button>
            <div style="margin-top: 2rem; padding: 1.5rem; background: white; border-radius: 8px; max-width: 600px; margin-left: auto; margin-right: auto; text-align: left;">
                <h3 style="margin-bottom: 1rem;">${t("welcome.howItWorks")}</h3>
                <ol style="margin-left: 1.5rem; color: var(--text-secondary);">
                    <li>${t("welcome.step1")}</li>
                    <li>${t("welcome.step2")}</li>
                    <li>${t("welcome.step3")}</li>
                    <li>${t("welcome.step4")}</li>
                    <li>${t("welcome.step5")}</li>
                </ol>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                    ${t("welcome.browserWarning")}
                </p>
            </div>
                `;
  }
}

// Render task detail modal structure with translations
function renderTaskDetailModal() {
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) {
    modalTitle.textContent = t("taskDetail.title");
  }

  // Update buttons in task detail modal
  const taskModal = document.getElementById("taskModal");
  if (taskModal) {
    const actions = taskModal.querySelector(".actions");
    if (actions) {
      actions.innerHTML = `
                        <button class="btn btn-secondary" onclick="closeModal()">${t(
                          "taskDetail.close"
                        )}</button>
                        <button class="btn btn-secondary" onclick="deleteCurrentTask()" style="background: #ef4444; color: white;">${t(
                          "taskDetail.delete"
                        )}</button>
                        <button class="btn btn-secondary" onclick="archiveCurrentTask()" style="background: #f59e0b; color: white;">${t(
                          "taskDetail.archive"
                        )}</button>
                        <button class="btn btn-primary" id="editTaskBtn" onclick="editCurrentTask()">${t(
                          "taskDetail.edit"
                        )}</button>
                    `;
    }
  }
}

// Update task form labels and placeholders
function updateTaskFormLabels() {
  const formLabels = {
    taskTitle: { prev: "label", text: t("taskForm.titleLabel") },
    taskStatus: { prev: "label", text: t("taskForm.columnLabel") },
    taskPriority: { prev: "label", text: t("taskForm.priorityLabel") },
    taskCategory: {
      prev: "label",
      text: t("taskForm.categoryLabel"),
      placeholder: t("taskForm.categoryPlaceholder"),
    },
    taskAssignee: {
      prev: "label",
      text: t("taskForm.assignedLabel"),
      placeholder: t("taskForm.assignedPlaceholder"),
    },
    taskCreated: { prev: "label", text: t("taskForm.createdLabel") },
    taskStarted: { prev: "label", text: t("taskForm.startedLabel") },
    taskDue: { prev: "label", text: t("taskForm.dueLabel") },
    taskCompleted: { prev: "label", text: t("taskForm.completedLabel") },
    taskTags: {
      prev: "label",
      text: t("taskForm.tagsLabel"),
      placeholder: t("taskForm.tagsPlaceholder"),
    },
    taskDescription: { prev: "label", text: t("taskForm.descriptionLabel") },
    taskNotes: {
      prev: "label",
      text: t("taskForm.notesLabel"),
      placeholder: t("taskForm.notesPlaceholder"),
    },
    formSubtaskInput: { placeholder: t("taskForm.subtaskPlaceholder") },
  };

  // Update all labels and placeholders
  Object.keys(formLabels).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;

    const config = formLabels[id];

    // Update label
    if (config.prev === "label") {
      const label = el.previousElementSibling;
      if (label && label.tagName === "LABEL") {
        label.textContent = config.text;
      } else {
        // Try to find label by for attribute
        const labelEl = document.querySelector(`label[for="${id}"]`);
        if (labelEl) labelEl.textContent = config.text;
      }
    }

    // Update placeholder
    if (config.placeholder) {
      el.placeholder = config.placeholder;
    }
  });

  // Update priority options - use language-independent keys
  const prioritySelect = document.getElementById("taskPriority");
  if (prioritySelect) {
    prioritySelect.innerHTML = `
                    <option value="">${t("taskForm.priorityNone")}</option>
                    <option value="Critical">${t(
                      "taskForm.priorityCritical"
                    )}</option>
                    <option value="High">${t("taskForm.priorityHigh")}</option>
                    <option value="Medium">${t(
                      "taskForm.priorityMedium"
                    )}</option>
                    <option value="Low">${t("taskForm.priorityLow")}</option>
                `;
  }

  // Update form help texts
  const tagsHelp = document.querySelector(
    'label[for="taskTags"] + input + small'
  );
  if (tagsHelp) tagsHelp.textContent = t("taskForm.tagsHelp");

  const notesHelp = document.querySelector("#taskNotes + small");
  if (notesHelp) notesHelp.textContent = t("taskForm.notesHelp");

  // Update subtasks label
  const subtasksLabel =
    document.querySelector("#formSubtasksList").previousElementSibling;
  if (subtasksLabel) subtasksLabel.textContent = t("taskForm.subtasksLabel");

  // Update subtask add button
  const subtaskBtn = document.querySelector("#formSubtaskInput + button");
  if (subtaskBtn) subtaskBtn.textContent = t("taskForm.subtaskAdd");

  // Update cancel button
  const cancelBtn = document.querySelector(
    '#newTaskForm .actions button[type="button"]'
  );
  if (cancelBtn) cancelBtn.textContent = t("taskForm.cancel");
}

// Update filter bar labels
function updateFilterLabels() {
  const filterBar = document.getElementById("filterBar");
  if (!filterBar) return;

  // Update global search placeholder
  const searchInput = document.getElementById("globalSearchInput");
  if (searchInput) searchInput.placeholder = t("filters.search");

  // Update filter labels
  const labels = filterBar.querySelectorAll("label");
  if (labels[0]) labels[0].textContent = t("filters.tags");
  if (labels[1]) labels[1].textContent = t("filters.category");
  if (labels[2]) labels[2].textContent = t("filters.user");
  if (labels[3]) labels[3].textContent = t("filters.priority");

  // Update select options
  const selects = filterBar.querySelectorAll('select option[value=""]');
  selects.forEach((opt) => (opt.textContent = t("filters.select")));

  // Update clear button
  const clearBtn = filterBar.querySelector('button[onclick="clearFilters()"]');
  if (clearBtn) clearBtn.textContent = t("filters.clearAll");
}

// Render columns modal structure with translations
function renderColumnsModal() {
  const modalTitle = document.getElementById("columnsModalTitle");
  if (modalTitle) modalTitle.textContent = t("columns.title");

  const addBtn = document.getElementById("addColumnBtn");
  if (addBtn) addBtn.textContent = t("columns.add");
}

// Render archives modal structure with translations
function renderArchivesModal() {
  const modalTitle = document.getElementById("archiveModalTitle");
  if (modalTitle) modalTitle.textContent = t("archives.title");

  const searchInput = document.getElementById("archiveSearch");
  if (searchInput) searchInput.placeholder = t("archives.search");
}

// Set language and save to localStorage
function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language "${lang}" not available, falling back to English`);
    lang = "en";
  }

  currentLanguage = lang;
  localStorage.setItem("preferredLanguage", lang);

  // Update static text elements
  updateStaticTexts();

  // Update filter dropdowns (including priorities)
  updateAutocomplete();

  // Re-render the interface
  renderKanban();
  updateProjectSelector();
  updateArchivesModal();

  console.log(`Language changed to: ${lang}`);
}

// Initialize language based on saved preference or browser language
function initLanguage() {
  // Check for saved preference first
  const savedLang = localStorage.getItem("preferredLanguage");
  if (savedLang) {
    currentLanguage = savedLang;
    return;
  }

  // Detect browser language
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.toLowerCase().split("-")[0]; // e.g., "en-US" -> "en"

  // Check if we support this language, otherwise fallback to English
  if (translations[langCode]) {
    currentLanguage = langCode;
  } else {
    currentLanguage = "en"; // Default fallback
  }

  // Save the detected/default language
  localStorage.setItem("preferredLanguage", currentLanguage);

  console.log(`Language initialized to: ${currentLanguage}`);
}

// Initialize language on page load
initLanguage();
// Update static texts after DOM loads
document.addEventListener("DOMContentLoaded", updateStaticTexts);

// Check if File System Access API is supported
if (!("showDirectoryPicker" in window)) {
  alert(t("alert.browserNotSupported"));
}

// IndexedDB for persisting directory handles (multiple projects)
const DB_NAME = "TaskManagerDB";
const DB_VERSION = 2; // Increment version for schema change
const STORE_NAME = "settings";
const PROJECTS_KEY = "recentProjects";
const MAX_RECENT_PROJECTS = 10;

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function saveDirectoryHandle(handle, customName = null) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Get existing projects
    const getRequest = store.get(PROJECTS_KEY);
    const projects = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result || []);
      getRequest.onerror = () => reject(getRequest.error);
    });

    // Get project name (directory name)
    const projectName = handle.name;

    // Check if project already exists
    const existingIndex = projects.findIndex((p) => p.name === projectName);
    const isNewProject = existingIndex < 0;

    // Ask for custom name for new projects if not provided
    let finalCustomName = customName;
    if (isNewProject && !customName) {
      finalCustomName =
        prompt(t("prompt.projectName", { name: projectName })) || "";
    }

    const projectData = {
      handle: handle,
      name: projectName,
      customName:
        finalCustomName ||
        (existingIndex >= 0 ? projects[existingIndex].customName : ""),
      lastAccessed: Date.now(),
    };

    if (existingIndex >= 0) {
      // Update existing project (keep custom name if not changing)
      projectData.customName =
        customName !== null ? customName : projects[existingIndex].customName;
      projects[existingIndex] = projectData;
    } else {
      // Add new project at the beginning
      projects.unshift(projectData);
    }

    // Keep only MAX_RECENT_PROJECTS
    const recentProjects = projects.slice(0, MAX_RECENT_PROJECTS);

    // Save updated list
    store.put(recentProjects, PROJECTS_KEY);

    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });

    console.log(
      "Project saved to recent list:",
      projectData.customName || projectName
    );
    updateProjectSelector();
  } catch (error) {
    console.error("Failed to save directory handle:", error);
  }
}

async function loadRecentProjects() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(PROJECTS_KEY);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load recent projects:", error);
    return [];
  }
}

async function loadDirectoryHandle() {
  try {
    const projects = await loadRecentProjects();
    // Return the most recent project (first in list)
    return projects.length > 0 ? projects[0].handle : null;
  } catch (error) {
    console.error("Failed to load directory handle:", error);
    return null;
  }
}

async function verifyPermission(handle) {
  const options = { mode: "readwrite" };
  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }
  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }
  return false;
}

// Update project selector dropdown
async function updateProjectSelector() {
  const projects = await loadRecentProjects();
  const selector = document.getElementById("projectSelector");
  const renameBtn = document.getElementById("renameProjectBtn");
  const deleteBtn = document.getElementById("deleteProjectBtn");

  if (projects.length > 0) {
    selector.style.display = "block";

    // Only mark as selected if kanban is actually loaded
    const isKanbanLoaded =
      document.getElementById("kanbanView").style.display !== "none";
    const currentProject =
      isKanbanLoaded && directoryHandle ? directoryHandle.name : "";

    // Show/hide rename and delete buttons
    if (isKanbanLoaded) {
      renameBtn.style.display = "inline-flex";
      deleteBtn.style.display = "inline-flex";
    } else {
      renameBtn.style.display = "none";
      deleteBtn.style.display = "none";
    }

    // Add empty option if no project is loaded
    let html = "";
    if (!isKanbanLoaded) {
      html = `<option value="" selected>${t("projects.select")}</option>`;
    }

    html += projects
      .map((p, idx) => {
        const selected =
          isKanbanLoaded && p.name === currentProject ? "selected" : "";
        const date = new Date(p.lastAccessed).toLocaleDateString("fr-FR");
        const displayName = p.customName || p.name;
        const details = p.customName ? ` (📁 ${p.name})` : "";
        return `<option value="${idx}" ${selected}>${displayName}${details} - ${date}</option>`;
      })
      .join("");

    selector.innerHTML = html;
  } else {
    selector.style.display = "none";
    renameBtn.style.display = "none";
    deleteBtn.style.display = "none";
  }
}

// Switch to a different project
async function switchProject(projectIndex) {
  try {
    const projects = await loadRecentProjects();
    if (projectIndex >= 0 && projectIndex < projects.length) {
      const project = projects[projectIndex];

      // Verify permission
      if (await verifyPermission(project.handle)) {
        directoryHandle = project.handle;

        // Update last accessed time and save
        await saveDirectoryHandle(directoryHandle);

        // Load the project
        await loadKanbanFile();

        document.getElementById("welcomeScreen").style.display = "none";
        document.getElementById("kanbanView").style.display = "block";
        document.getElementById("filterBar").style.display = "block";
        document.getElementById("newTaskBtn").style.display = "inline-flex";
        document.getElementById("archiveBtn").style.display = "inline-flex";
        document.getElementById("manageColsBtn").style.display = "inline-flex";

        // Update project selector now that kanban is visible
        await updateProjectSelector();

        showNotification(
          t("notif.projectLoaded", {
            name: project.customName || project.name,
          }),
          "success"
        );
      } else {
        showNotification(t("notif.permissionDenied"), "error");
      }
    }
  } catch (error) {
    console.error("Error switching project:", error);
    showNotification(t("notif.projectError"), "error");
  }
}

// Rename current project
async function renameCurrentProject() {
  if (!directoryHandle) return;

  try {
    const projects = await loadRecentProjects();
    const currentProject = projects.find(
      (p) => p.name === directoryHandle.name
    );

    if (currentProject) {
      const currentName = currentProject.customName || currentProject.name;
      const newName = prompt(t("prompt.renameProject"), currentName);

      if (newName !== null && newName.trim() !== currentName) {
        await saveDirectoryHandle(directoryHandle, newName.trim());
        showNotification(t("notif.projectRenamed"), "success");
      }
    }
  } catch (error) {
    console.error("Error renaming project:", error);
    showNotification(t("notif.renameError"), "error");
  }
}

// Delete current project from recent list
async function deleteCurrentProject() {
  if (!directoryHandle) return;

  try {
    const projects = await loadRecentProjects();
    const currentProject = projects.find(
      (p) => p.name === directoryHandle.name
    );

    if (currentProject) {
      const displayName = currentProject.customName || currentProject.name;

      if (confirm(t("confirm.deleteProject", { name: displayName }))) {
        // Remove from projects list
        const updatedProjects = projects.filter(
          (p) => p.name !== directoryHandle.name
        );

        // Save updated list to IndexedDB
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        store.put(updatedProjects, PROJECTS_KEY);

        await new Promise((resolve, reject) => {
          transaction.oncomplete = resolve;
          transaction.onerror = () => reject(transaction.error);
        });

        // Clear current project and show welcome screen
        directoryHandle = null;
        kanbanFileHandle = null;
        tasks = [];

        document.getElementById("kanbanView").style.display = "none";
        document.getElementById("filterBar").style.display = "none";
        document.getElementById("newTaskBtn").style.display = "none";
        document.getElementById("archiveBtn").style.display = "none";
        document.getElementById("manageColsBtn").style.display = "none";
        document.getElementById("welcomeScreen").style.display = "block";

        await updateProjectSelector();
        showNotification(t("notif.projectDeleted"), "success");
      }
    }
  } catch (error) {
    console.error("Error deleting project:", error);
    showNotification(t("notif.renameError"), "error");
  }
}

// Try to restore previous directory on page load
async function tryRestorePreviousDirectory() {
  const savedHandle = await loadDirectoryHandle();
  console.log(
    "Attempting to restore previous directory:",
    savedHandle ? savedHandle.name : "none"
  );

  if (savedHandle) {
    try {
      // Verify we still have permission
      console.log("Verifying permissions...");
      if (await verifyPermission(savedHandle)) {
        console.log("Permission granted, loading kanban file...");
        directoryHandle = savedHandle;
        await loadKanbanFile();

        document.getElementById("welcomeScreen").style.display = "none";
        document.getElementById("kanbanView").style.display = "block";
        document.getElementById("filterBar").style.display = "block";
        document.getElementById("newTaskBtn").style.display = "inline-flex";
        document.getElementById("archiveBtn").style.display = "inline-flex";
        document.getElementById("manageColsBtn").style.display = "inline-flex";

        showNotification(t("notif.projectRestored"), "success");
        await updateProjectSelector(); // Show project selector
        console.log("Project restored successfully");
        return true;
      } else {
        console.log("Permission denied or cancelled");
      }
    } catch (error) {
      console.error("Could not restore previous directory:", error);
    }
  }
  // Even if no project is loaded, update selector to show recent projects
  await updateProjectSelector();
  return false;
}

// Initialize on page load
window.addEventListener("DOMContentLoaded", async () => {
  await tryRestorePreviousDirectory();

  // Add event listener for project selector
  document
    .getElementById("projectSelector")
    .addEventListener("change", async (e) => {
      const projectIndex = parseInt(e.target.value);
      if (!isNaN(projectIndex)) {
        await switchProject(projectIndex);
      }
    });
});

// Select folder
document
  .getElementById("selectFolderBtn")
  .addEventListener("click", async () => {
    try {
      // Start in last used directory if available
      const options = {};
      if (directoryHandle) {
        options.startIn = directoryHandle;
      }

      directoryHandle = await window.showDirectoryPicker(options);
      await saveDirectoryHandle(directoryHandle); // Save for next time
      await loadKanbanFile();

      document.getElementById("welcomeScreen").style.display = "none";
      document.getElementById("kanbanView").style.display = "block";
      document.getElementById("filterBar").style.display = "block";
      document.getElementById("newTaskBtn").style.display = "inline-flex";
      document.getElementById("archiveBtn").style.display = "inline-flex";
      document.getElementById("manageColsBtn").style.display = "inline-flex";

      // Update project selector now that kanban is visible
      await updateProjectSelector();

      showNotification(t("notif.folderLoaded"), "success");
    } catch (error) {
      if (error.name !== "AbortError") {
        showNotification(t("notif.folderError"), "error");
        console.error(error);
      }
    }
  });

// Load kanban.md file
async function loadKanbanFile() {
  try {
    kanbanFileHandle = await directoryHandle.getFileHandle("kanban.md");
    const file = await kanbanFileHandle.getFile();
    currentKanbanContent = await file.text();

    console.log("File loaded, size:", currentKanbanContent.length);
    parseMarkdown(currentKanbanContent);
    await loadArchive(); // Load archive for historical autocomplete data
    updateAutocomplete();
    renderKanban();
  } catch (error) {
    // Only create default files if the file truly doesn't exist
    if (error.name === "NotFoundError") {
      showNotification(t("notif.initializingFolder"), "success");
      console.log("kanban.md not found, creating default files...");

      try {
        // Create kanban.md
        currentKanbanContent = createDefaultKanbanContent();
        kanbanFileHandle = await directoryHandle.getFileHandle("kanban.md", {
          create: true,
        });
        const writable = await kanbanFileHandle.createWritable();
        await writable.write(currentKanbanContent);
        await writable.close();

        // Create archive.md
        const archiveContent = createDefaultArchiveContent();
        const archiveFileHandle = await directoryHandle.getFileHandle(
          "archive.md",
          { create: true }
        );
        const archiveWritable = await archiveFileHandle.createWritable();
        await archiveWritable.write(archiveContent);
        await archiveWritable.close();

        showNotification(t("notif.filesInitialized"), "success");

        parseMarkdown(currentKanbanContent);
        updateAutocomplete();
        renderKanban();
      } catch (createError) {
        showNotification(t("notif.filesError"), "error");
        console.error(createError);
      }
    } else {
      // Different error (permissions, read error, etc.) - show error and don't overwrite
      showNotification(
        t("notif.loadError") || "Erreur lors du chargement du fichier",
        "error"
      );
      console.error("Error loading kanban.md:", error);
    }
  }
}

// Create default kanban.md content
function createDefaultKanbanContent() {
  return `# Kanban Board

<!-- Config: Last Task ID: 0 -->

## ⚙️ Configuration

**Columns**: 📝 To Do (todo) | 🚀 In Progress (in-progress) | 👀 In Review (in-review) | ✅ Done (done)

**Categories**: Frontend, Backend, Design, DevOps, Tests, Documentation

**Users**: @user (User)

**Priorities**: 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

**Tags**: #bug #feature #ui #backend #urgent #refactor #docs #test

---

## 📝 To Do

## 🚀 In Progress

## 👀 In Review

## ✅ Done
`;
}

// Create default archive.md content
function createDefaultArchiveContent() {
  return `${t("markdown.archiveTitle")}

${t("markdown.archiveDesc")}

${t("markdown.archiveSection")}

`;
}

// Parse Markdown - IMPROVED VERSION
function parseMarkdown(content) {
  tasks = [];
  config = {
    lastTaskId: 0,
    columns: [],
    categories: [],
    users: [],
    priorities: [],
    tags: [],
  };

  console.log("=== Starting parseMarkdown ===");

  // Parse config comment
  const configMatch = content.match(/<!-- Config: Last Task ID: (\d+) -->/);
  if (configMatch) {
    config.lastTaskId = parseInt(configMatch[1]);
    console.log("Last Task ID:", config.lastTaskId);
  }

  // Parse config section
  const configSection = content.match(/## ⚙️ Configuration\s+([\s\S]*?)---/);
  if (configSection) {
    const configText = configSection[1];
    console.log("Config section found");

    // Parse columns - FIXED REGEX
    const columnsMatch = configText.match(/\*\*Columns\*\*:\s*(.+)/);
    if (columnsMatch) {
      console.log("Raw columns:", columnsMatch[1]);
      config.columns = columnsMatch[1]
        .split("|")
        .map((col) => {
          // Fixed regex to handle space before parenthesis
          const match = col.trim().match(/(.+?)\s*\((.+?)\)/);
          if (match) {
            return { name: match[1].trim(), id: match[2].trim() };
          }
          return null;
        })
        .filter(Boolean);
      console.log("Parsed columns:", config.columns);
    }

    // Parse categories
    const categoriesMatch = configText.match(/\*\*Categories\*\*:\s*(.+)/);
    if (categoriesMatch) {
      config.categories = categoriesMatch[1]
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      console.log("Parsed categories:", config.categories);
    }

    // Parse users
    const usersMatch = configText.match(/\*\*Users\*\*:\s*(.+)/);
    if (usersMatch) {
      config.users = usersMatch[1]
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean);
      console.log("Parsed users:", config.users);
    }

    // Parse priorities
    const prioritiesMatch = configText.match(/\*\*Priorities\*\*:\s*(.+)/);
    if (prioritiesMatch) {
      config.priorities = prioritiesMatch[1]
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
      console.log("Parsed priorities:", config.priorities);
    }

    // Parse tags
    const tagsMatch = configText.match(/\*\*Tags\*\*:\s*(.+)/);
    if (tagsMatch) {
      config.tags = tagsMatch[1]
        .split(/\s+/)
        .filter((t) => t.startsWith("#"))
        .map((t) => t.replace("#", ""));
      console.log("Parsed tags:", config.tags);
    }
  }

  // Default columns if not found
  if (config.columns.length === 0) {
    config.columns = [
      { name: "📝 To Do", id: "todo" },
      { name: "🚀 In Progress", id: "in-progress" },
      { name: "👀 In Review", id: "in-review" },
      { name: "✅ Done", id: "done" },
    ];
    console.log("Using default columns");
  }

  // Default categories if not found
  if (config.categories.length === 0) {
    config.categories = [
      "Frontend",
      "Backend",
      "Design",
      "DevOps",
      "Tests",
      "Documentation",
    ];
  }

  // Default users if not found
  if (config.users.length === 0) {
    config.users = ["@user (User)"];
  }

  // Default priorities if not found
  if (config.priorities.length === 0) {
    config.priorities = ["🔴 Critical", "🟠 High", "🟡 Medium", "🟢 Low"];
  }

  // Default tags if not found
  if (config.tags.length === 0) {
    config.tags = [
      "bug",
      "feature",
      "ui",
      "backend",
      "urgent",
      "refactor",
      "docs",
      "test",
    ];
  }

  // Parse tasks by sections using the unified parser
  config.columns.forEach((column) => {
    const columnTasks = parseTasksFromSection(content, column.name, column.id);
    tasks.push(...columnTasks);
  });

  console.log(`\n=== Total tasks parsed: ${tasks.length} ===`);
  console.log("Tasks:", tasks.map((t) => `${t.id} (${t.status})`).join(", "));
}

// Parse tasks from a markdown section (reusable for both kanban and archive)
function parseTasksFromSection(content, sectionName, statusId) {
  console.log(
    `\n--- Parsing section: ${sectionName} (status: ${statusId}) ---`
  );
  const tasksFound = [];

  // Split by ## to get sections
  const sections = content.split(/\n##\s+/);
  let sectionContent = null;

  for (let section of sections) {
    if (section.startsWith(sectionName)) {
      // Extract content after the section title
      sectionContent = section.substring(sectionName.length).trim();
      break;
    }
  }

  if (!sectionContent) {
    console.log(`Section "${sectionName}" not found or empty`);
    return tasksFound;
  }

  console.log(`Section content length: ${sectionContent.length}`);

  // SIMPLE PARSING: Split by ### TASK-
  const taskBlocks = sectionContent.split(/###\s+TASK-/).slice(1); // Skip first empty element
  console.log(`Found ${taskBlocks.length} task blocks`);

  taskBlocks.forEach((block, index) => {
    // Each block starts with: XXX | Title
    const lines = block.split("\n");
    const firstLine = lines[0].trim();

    console.log(`Block ${index + 1} first line: "${firstLine}"`);

    // Extract ID and title from first line
    const pipeIndex = firstLine.indexOf("|");
    if (pipeIndex > 0) {
      const idPart = firstLine.substring(0, pipeIndex).trim();
      const titlePart = firstLine.substring(pipeIndex + 1).trim();

      // Check if idPart is a valid number
      const idMatch = idPart.match(/^(\d+)$/);
      if (idMatch && titlePart) {
        const taskId = "TASK-" + idPart.padStart(3, "0");
        const title = titlePart;
        const taskContent = lines.slice(1).join("\n");

        console.log(`✓ Matched! Parsing task: ${taskId} - ${title}`);
        const task = parseTask(taskId, title, taskContent, statusId);
        if (task) {
          tasksFound.push(task);
          console.log(
            `✓ Task added. Total in this section: ${tasksFound.length}`
          );
        } else {
          console.log(`✗ parseTask returned null`);
        }
      } else {
        console.log(`✗ Invalid ID format: "${idPart}"`);
      }
    } else {
      console.log(`✗ No pipe character found in first line`);
    }
  });

  console.log(`Total tasks parsed from "${sectionName}": ${tasksFound.length}`);
  return tasksFound;
}

// Parse individual task
function parseTask(id, title, content, status) {
  const task = {
    id,
    title: title.trim(),
    status,
    priority: "",
    category: "",
    assignees: [],
    tags: [],
    created: "",
    started: "",
    due: "",
    completed: "",
    description: "",
    subtasks: [],
    notes: "",
  };

  // Parse metadata line
  const metaMatch = content.match(
    /\*\*Priority\*\*:\s*(\w+)\s*\|\s*\*\*Category\*\*:\s*([^|]+?)(?:\s*\|\s*\*\*Assigned\*\*:\s*(.+?))?$/m
  );
  if (metaMatch) {
    task.priority = metaMatch[1].trim();
    task.category = metaMatch[2].trim();
    if (metaMatch[3]) {
      task.assignees = metaMatch[3].split(",").map((a) => a.trim());
    }
  }

  // Parse dates - support all date fields
  const createdMatch = content.match(/\*\*Created\*\*:\s*([\d-]+)/);
  if (createdMatch) task.created = createdMatch[1];

  const startedMatch = content.match(/\*\*Started\*\*:\s*([\d-]+)/);
  if (startedMatch) task.started = startedMatch[1];

  const dueMatch = content.match(/\*\*Due\*\*:\s*([\d-]+)/);
  if (dueMatch) task.due = dueMatch[1];

  const completedMatch = content.match(/\*\*Finished\*\*:\s*([\d-]+)/);
  if (completedMatch) task.completed = completedMatch[1];

  // Parse tags
  const tagsMatch = content.match(/\*\*Tags\*\*:\s*(.+)/);
  if (tagsMatch) {
    task.tags = tagsMatch[1].match(/#[\w-]+/g) || [];
  }

  // Parse description (text after dates/tags but before "**Sous-tâches**" or "**Notes**")
  const lines = content.split("\n");
  let descriptionLines = [];
  let inDescription = false;

  for (let line of lines) {
    // Skip metadata lines
    if (
      line.match(
        /^\*\*(Priority|Category|Assigned|Created|Started|Due|Finished|Tags)\*\*/
      )
    ) {
      continue;
    }
    // Stop at subsections
    if (line.match(/^\*\*(Subtasks|Notes|Links|Review|Dependencies)\*\*/)) {
      break;
    }
    // Collect description lines
    if (line.trim() && !inDescription) {
      inDescription = true;
    }
    if (inDescription && line.trim()) {
      descriptionLines.push(line.trim());
    }
  }
  task.description = descriptionLines.join(" ").substring(0, 200);

  // Parse subtasks
  const subtaskMatches = content.matchAll(/- \[(x| )\] (.+)/g);
  for (const match of subtaskMatches) {
    task.subtasks.push({
      completed: match[1] === "x",
      text: match[2].trim(),
    });
  }

  // Parse notes - everything after **Notes**: until end of task
  const notesMatch = content.match(/\*\*Notes\*\*:\s*\n([\s\S]*?)$/);
  if (notesMatch) {
    task.notes = notesMatch[1].trim();
  }

  return task;
}

// Enhanced markdown to HTML converter for notes
function markdownToHtml(markdown) {
  if (!markdown) return "";

  let html = markdown;

  // First, extract code blocks before escaping HTML
  // Use very flexible regex to capture all code block formats
  const codeBlocks = [];
  html = html.replace(
    /```([^\n`]*)\n?([\s\S]*?)```/g,
    (match, language, code) => {
      const lang = (language || "").trim() || "text";
      const placeholder = `\n__CODE_BLOCK_${codeBlocks.length}__\n`;

      // Remove trailing newline if present
      const cleanCode = code.replace(/\n$/, "");

      // Escape HTML in code for safe display
      const escapedCode = cleanCode
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Create simple code block with language label
      const codeBlock = `<div style="margin: 1rem 0;"><div style="background: #1a1a1a; color: #888; padding: 0.25rem 0.5rem; border-radius: 6px 6px 0 0; font-size: 0.75rem; font-family: 'Consolas', 'Monaco', monospace;">${lang}</div><pre style="margin: 0; border-radius: 0 0 6px 6px;"><code>${escapedCode}</code></pre></div>`;
      codeBlocks.push(codeBlock);
      return placeholder;
    }
  );

  // Escape HTML tags in remaining text (after extracting code blocks)
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Convert **Bold subsections** with colon (e.g., **Résultat**:)
  html = html.replace(
    /\*\*([^*]+)\*\*:/g,
    '<strong style="color: var(--primary); display: block; margin-top: 1rem; margin-bottom: 0.5rem;">$1:</strong>'
  );

  // Convert **Bold** (remaining)
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Convert *Italic*
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Convert `inline code`
  html = html.replace(
    /`([^`]+)`/g,
    "<code style=\"background: #2d2d2d; color: #f8f8f2; padding: 0.125rem 0.35rem; border-radius: 3px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.9em;\">$1</code>"
  );

  // Convert links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" style="color: var(--primary); text-decoration: underline;">$1</a>'
  );

  // Convert bullet lists and paragraphs
  const lines = html.split("\n");
  let inList = false;
  let result = [];

  for (let line of lines) {
    // Check if it's a code block placeholder - preserve it exactly
    if (line.trim() === "" || line.trim().match(/^__CODE_BLOCK_\d+__$/)) {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (line.trim().startsWith("__CODE_BLOCK_")) {
        result.push(line.trim());
      } else if (line.trim() === "") {
        // Empty line - add spacing only if not in list
        if (!inList) {
          result.push("");
        }
      }
      continue;
    }

    if (line.trim().startsWith("- ")) {
      if (!inList) {
        result.push('<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">');
        inList = true;
      }
      result.push("<li>" + line.trim().substring(2) + "</li>");
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      if (line.trim()) {
        result.push('<p style="margin: 0.5rem 0;">' + line + "</p>");
      }
    }
  }

  if (inList) {
    result.push("</ul>");
  }

  html = result.join("\n");

  // Replace code block placeholders with actual code blocks
  codeBlocks.forEach((block, index) => {
    html = html.replace(`__CODE_BLOCK_${index}__`, block);
  });

  return html;
}

// Auto-save function
async function autoSave() {
  if (!kanbanFileHandle) return;
  try {
    const newContent = generateMarkdown();
    const writable = await kanbanFileHandle.createWritable();
    await writable.write(newContent);
    await writable.close();
    currentKanbanContent = newContent;
    console.log("Auto-saved");
  } catch (error) {
    console.error("Auto-save failed:", error);
  }
}

// Helper function to normalize user identifier (extract @username from @username (Display Name))
function normalizeUserId(userString) {
  if (!userString) return "";
  // Extract @username before the space or parenthesis
  const match = userString.match(/^(@[^\s(]+)/);
  return match ? match[1] : userString;
}

// Helper function to get full user format from user ID
function getUserFullFormat(userId) {
  // Check if there's a defined user in config with this ID
  const configUser = (config.users || []).find(
    (u) => normalizeUserId(u) === userId
  );
  return configUser || userId;
}

// Extract unique values for autocomplete (including historical archived data)
function extractUniqueValues() {
  // Start with values from config (always keep these)
  const categories = new Set(config.categories || []);
  const userMap = new Map(); // Map from normalized ID to full format
  const tags = new Set(config.tags || []);

  // First, add config users (these have the full format with display names)
  (config.users || []).forEach((u) => {
    const normalizedId = normalizeUserId(u);
    if (!userMap.has(normalizedId)) {
      userMap.set(normalizedId, u);
    }
  });

  // Extract from active tasks
  tasks.forEach((t) => {
    if (t.category) categories.add(t.category);
    t.assignees.forEach((u) => {
      const normalizedId = normalizeUserId(u);
      // Only add if not already in map (prefer config version)
      if (!userMap.has(normalizedId)) {
        userMap.set(normalizedId, u);
      }
    });
    t.tags.forEach((tag) => tags.add(tag.replace("#", "")));
  });

  // Extract from archived tasks (historical data)
  archivedTasks.forEach((t) => {
    if (t.category) categories.add(t.category);
    t.assignees.forEach((u) => {
      const normalizedId = normalizeUserId(u);
      if (!userMap.has(normalizedId)) {
        userMap.set(normalizedId, u);
      }
    });
    t.tags.forEach((tag) => tags.add(tag.replace("#", "")));
  });

  return {
    categories: [...categories],
    users: [...userMap.values()],
    tags: [...tags],
  };
}

// Update autocomplete datalists and filter selects
function updateAutocomplete() {
  const { categories, users, tags } = extractUniqueValues();

  // Update form datalists (keep full format for proper storage)
  document.getElementById("categoriesList").innerHTML = categories
    .map((c) => `<option value="${c}">`)
    .join("");
  document.getElementById("usersList").innerHTML = users
    .map((u) => `<option value="${u}">`)
    .join("");
  document.getElementById("tagsList").innerHTML = tags
    .map((t) => `<option value="${t}">`)
    .join("");

  // Update filter selects
  document.getElementById("filterTagSelect").innerHTML =
    `<option value="">${t("filters.select")}</option>` +
    tags.map((t) => `<option value="${t}">${t}</option>`).join("");
  document.getElementById("filterCategorySelect").innerHTML =
    `<option value="">${t("filters.select")}</option>` +
    categories.map((c) => `<option value="${c}">${c}</option>`).join("");
  document.getElementById("filterUserSelect").innerHTML =
    `<option value="">${t("filters.select")}</option>` +
    users
      .map((u) => {
        const normalizedId = normalizeUserId(u);
        return `<option value="${normalizedId}">${u}</option>`;
      })
      .join("");

  // Update priority filter select from config
  const priorities = config.priorities || [];
  document.getElementById("filterPrioritySelect").innerHTML =
    `<option value="">${t("filters.select")}</option>` +
    priorities
      .map(
        (p, i) => `<option value="${clean(p)}">${displayPriority(p)}</option>`
      )
      .join("");
}

// Filter functions
function addFilter(type) {
  let value;
  if (type === "tag") {
    value = document.getElementById("filterTagSelect").value;
    document.getElementById("filterTagSelect").value = "";
  } else if (type === "category") {
    value = document.getElementById("filterCategorySelect").value;
    document.getElementById("filterCategorySelect").value = "";
  } else if (type === "user") {
    value = document.getElementById("filterUserSelect").value;
    document.getElementById("filterUserSelect").value = "";
  } else if (type === "priority") {
    value = document.getElementById("filterPrioritySelect").value;
    document.getElementById("filterPrioritySelect").value = "";
  }

  if (
    value &&
    !activeFilters.find((f) => f.type === type && f.value === value)
  ) {
    activeFilters.push({ type, value });
    renderFilters();
    renderKanban();
  }
}

function removeFilter(idx) {
  activeFilters.splice(idx, 1);
  renderFilters();
  renderKanban();
}

function clearFilters() {
  activeFilters = [];
  renderFilters();
  renderKanban();
}

// Global search functions
function applyGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const clearBtn = document.getElementById("clearGlobalSearch");
  globalSearchTerm = input.value.trim();

  // Show/hide clear button
  clearBtn.style.display = globalSearchTerm ? "block" : "none";

  // Re-render kanban with search filter
  renderKanban();
}

function clearGlobalSearch() {
  const input = document.getElementById("globalSearchInput");
  const clearBtn = document.getElementById("clearGlobalSearch");
  input.value = "";
  globalSearchTerm = "";
  clearBtn.style.display = "none";
  renderKanban();
}

function renderFilters() {
  const container = document.getElementById("activeFilters");
  const colors = {
    tag: "#3b82f6", // Blue
    category: "#8b5cf6", // Purple
    user: "#10b981", // Green
    priority: "#f59e0b", // Orange
  };

  container.innerHTML = activeFilters
    .map((f, idx) => {
      const escapedValue = f.value.replace(/'/g, "\\'");

      // Determine display value based on filter type
      let displayValue = f.value;

      // For priority filters, display with prefix/emoji from config
      if (f.type === "priority" && config.priorities) {
        const priority = config.priorities.find((p) => clean(p) === f.value);
        if (priority) {
          displayValue = priority;
        }
      }

      // For user filters, display with full format from config
      if (f.type === "user") {
        const fullUserFormat = getUserFullFormat(f.value);
        displayValue = fullUserFormat;
      }

      return `
                <span style="background: ${
                  colors[f.type]
                }; color: white; padding: 0.35rem 0.75rem; border-radius: 16px; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 500;">
                    ${displayPriority(displayValue)}
                    <button onclick="removeFilter(${idx})" style="background: none; border: none; color: white; cursor: pointer; padding: 0; font-weight: bold; font-size: 1.1rem; line-height: 1;" title="Supprimer ce filtre">✕</button>
                </span>
                `;
    })
    .join("");
}

function matchesFilters(task) {
  // Check active filters (tags, category, user, priority)
  if (activeFilters.length > 0) {
    const matchesActiveFilters = activeFilters.every((filter) => {
      if (filter.type === "tag") {
        return (
          task.tags.includes(filter.value) ||
          task.tags.includes("#" + filter.value)
        );
      } else if (filter.type === "category") {
        return task.category === filter.value;
      } else if (filter.type === "user") {
        // Normalize both the filter value and task assignees for comparison
        return task.assignees.some(
          (assignee) => normalizeUserId(assignee) === filter.value
        );
      } else if (filter.type === "priority") {
        return task.priority === filter.value;
      }
      return false;
    });
    if (!matchesActiveFilters) return false;
  }

  // Check global search term (searches in title, description, and notes)
  if (globalSearchTerm) {
    const searchLower = globalSearchTerm.toLowerCase();
    const matchesSearch =
      (task.title && task.title.toLowerCase().includes(searchLower)) ||
      (task.description &&
        task.description.toLowerCase().includes(searchLower)) ||
      (task.notes && task.notes.toLowerCase().includes(searchLower));
    if (!matchesSearch) return false;
  }

  return true;
}

// Click to add filter
function clickToFilter(type, value) {
  if (!activeFilters.find((f) => f.type === type && f.value === value)) {
    activeFilters.push({ type, value });
    renderFilters();
    renderKanban();
  }
}

// Column management
function openColumnsModal() {
  const modal = document.getElementById("columnsModal");
  const list = document.getElementById("columnsList");
  list.innerHTML = config.columns
    .map(
      (col, idx) => `
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.75rem; background: white; border: 2px solid #cbd5e0; border-radius: 6px; align-items: center;">
                    <div style="display: flex; gap: 0.25rem;">
                        <button onclick="moveColumn(${idx}, -1)" ${
        idx === 0 ? "disabled" : ""
      } class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" title="${t(
        "action.moveUp"
      )}">↑</button>
                        <button onclick="moveColumn(${idx}, 1)" ${
        idx === config.columns.length - 1 ? "disabled" : ""
      } class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" title="${t(
        "action.moveDown"
      )}">↓</button>
                    </div>
                    <input type="text" value="${
                      col.name
                    }" onchange="updateColumn(${idx}, 'name', this.value)" style="flex: 1; padding: 0.5rem; border: 1px solid #cbd5e0; border-radius: 4px;">
                    <input type="text" value="${
                      col.id
                    }" onchange="updateColumn(${idx}, 'id', this.value)" style="width: 120px; padding: 0.5rem; border: 1px solid #cbd5e0; border-radius: 4px;" placeholder="ID">
                    <button onclick="deleteColumn(${idx})" class="btn btn-secondary" style="padding: 0.5rem;">🗑️</button>
                </div>
            `
    )
    .join("");
  modal.classList.add("active");
}

function closeColumnsModal() {
  document.getElementById("columnsModal").classList.remove("active");
}

function addColumn() {
  const name = prompt(t("prompt.columnName"));
  const id = prompt(t("prompt.columnId"));
  if (name && id) {
    config.columns.push({ name, id });
    openColumnsModal();
    autoSave();
    renderKanban();
  }
}

function updateColumn(idx, field, value) {
  config.columns[idx][field] = value;
  autoSave();
  renderKanban();
}

function deleteColumn(idx) {
  if (confirm(t("confirm.deleteColumn"))) {
    config.columns.splice(idx, 1);
    openColumnsModal();
    autoSave();
    renderKanban();
  }
}

function moveColumn(idx, direction) {
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= config.columns.length) return;

  // Swap columns
  [config.columns[idx], config.columns[newIdx]] = [
    config.columns[newIdx],
    config.columns[idx],
  ];

  openColumnsModal();
  autoSave();
  renderKanban();
}

// Task edit/create modal
function openTaskModal(task = null) {
  isEditMode = !!task;
  const modal = document.getElementById("newTaskModal");
  const form = document.getElementById("newTaskForm");
  const title = modal.querySelector("h2");
  const submitBtn = document.getElementById("taskFormSubmitBtn");

  title.textContent = isEditMode
    ? t("taskForm.editTask")
    : t("taskForm.newTask");
  submitBtn.textContent = isEditMode
    ? t("taskForm.save")
    : t("taskForm.create");

  // Populate columns select
  document.getElementById("taskStatus").innerHTML = config.columns
    .map((col) => `<option value="${col.id}">${col.name}</option>`)
    .join("");

  // Populate priorities select
  document.getElementById("taskPriority").innerHTML = config.priorities
    .map(
      (priority) =>
        `<option value="${clean(priority)}">${displayPriority(
          priority
        )}</option>`
    )
    .join("");

  // Update autocomplete
  updateAutocomplete();

  if (isEditMode) {
    document.getElementById("taskEditId").value = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskStatus").value = task.status;
    document.getElementById("taskPriority").value = task.priority || "";
    document.getElementById("taskCategory").value = task.category || "";
    document.getElementById("taskAssignee").value = task.assignees.join(", ");
    document.getElementById("taskCreated").value = task.created || "";
    document.getElementById("taskStarted").value = task.started || "";
    document.getElementById("taskDue").value = task.due || "";
    document.getElementById("taskCompleted").value = task.completed || "";
    document.getElementById("taskTags").value = task.tags.join(" ");
    document.getElementById("taskDescription").value = task.description || "";
    document.getElementById("taskNotes").value = task.notes || "";
    formSubtasks = JSON.parse(JSON.stringify(task.subtasks || []));
  } else {
    form.reset();
    document.getElementById("taskEditId").value = "";
    formSubtasks = [];
  }

  renderFormSubtasks();
  modal.classList.add("active");
}

function closeTaskModal() {
  document.getElementById("newTaskModal").classList.remove("active");
  document.getElementById("newTaskForm").reset();
  formSubtasks = [];
  isEditMode = false;
}

// Form subtasks management
function renderFormSubtasks() {
  const list = document.getElementById("formSubtasksList");
  list.innerHTML = formSubtasks
    .map(
      (st, idx) => `
                <li style="padding: 0.5rem; margin-bottom: 0.25rem; background: white; border: 1px solid #cbd5e0; border-radius: 4px; display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" ${
                      st.completed ? "checked" : ""
                    } onchange="toggleFormSubtask(${idx})" style="width: 16px; height: 16px; cursor: pointer;">
                    <span style="flex: 1; ${
                      st.completed
                        ? "text-decoration: line-through; color: #999;"
                        : ""
                    }">${st.text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")}</span>
                    <button type="button" onclick="deleteFormSubtask(${idx})" style="background: none; border: none; cursor: pointer; color: #e53e3e; font-size: 1rem;">🗑️</button>
                </li>
            `
    )
    .join("");
}

function addFormSubtask() {
  const input = document.getElementById("formSubtaskInput");
  const text = input.value.trim();
  if (!text) return;
  formSubtasks.push({ completed: false, text });
  input.value = "";
  renderFormSubtasks();
}

function toggleFormSubtask(idx) {
  if (formSubtasks[idx]) {
    formSubtasks[idx].completed = !formSubtasks[idx].completed;
    renderFormSubtasks();
  }
}

function deleteFormSubtask(idx) {
  formSubtasks.splice(idx, 1);
  renderFormSubtasks();
}

// Render Kanban board
function renderKanban() {
  const board = document.getElementById("kanbanBoard");
  board.innerHTML = "";

  console.log("Rendering kanban with", tasks.length, "tasks");

  // Debug info
  const debugInfo = document.getElementById("debugInfo");
  debugInfo.textContent = `Loaded ${
    tasks.length
  } tasks\nColumns: ${config.columns.map((c) => c.name).join(", ")}`;
  // debugInfo.style.display = 'block'; // Uncomment to show debug info

  config.columns.forEach((column) => {
    const columnTasks = tasks.filter(
      (t) => t.status === column.id && matchesFilters(t)
    );
    console.log(`Column ${column.id}: ${columnTasks.length} tasks`);

    const columnEl = document.createElement("div");
    columnEl.className = "kanban-column";
    columnEl.dataset.columnId = column.id;

    columnEl.innerHTML = `
                    <div class="column-header">
                        <div class="column-title">
                            ${column.name}
                        </div>
                        <div class="column-count">${columnTasks.length}</div>
                    </div>
                    <div class="task-list" ondrop="drop(event)" ondragover="allowDrop(event)">
                        ${
                          columnTasks.length === 0
                            ? `<div class="empty-state">${t(
                                "empty.noTasks"
                              )}</div>`
                            : ""
                        }
                    </div>
                `;

    const taskList = columnEl.querySelector(".task-list");

    columnTasks.forEach((task) => {
      const taskEl = createTaskElement(task);
      taskList.appendChild(taskEl);
    });

    board.appendChild(columnEl);
  });
}

// Create task element
function createTaskElement(task) {
  const taskEl = document.createElement("div");
  taskEl.className = "task-card";
  taskEl.draggable = true;
  taskEl.dataset.taskId = task.id;

  var priorityBadgeClass = "Default";
  if (config.priorities) {
    const priority = config.priorities.find((p) => clean(p) === task.priority);
    if (priority) {
      const emoji = getFirstEmoji(priority);
      if (emoji && priorityIconClasses[emoji]) {
        priorityBadgeClass = priorityIconClasses[emoji];
      }
    }
  }

  const subtaskProgress =
    task.subtasks.length > 0
      ? `<div class="task-subtasks">
                    <div class="subtask-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${
                              (task.subtasks.filter((s) => s.completed).length /
                                task.subtasks.length) *
                              100
                            }%"></div>
                        </div>
                        <span>${
                          task.subtasks.filter((s) => s.completed).length
                        }/${task.subtasks.length}</span>
                    </div>
                </div>`
      : "";

  taskEl.innerHTML = `
                <div class="task-header">
                    <span class="task-id">${task.id}</span>
                    <button class="task-edit-btn" onclick="event.stopPropagation(); openTaskModal(tasks.find(t => t.id === '${
                      task.id
                    }'))" style="background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 0.25rem;">✏️</button>
                </div>
                <div class="task-title">${task.title}</div>
                ${
                  task.description
                    ? `<div class="task-description">${markdownToHtml(
                        task.description
                      )}</div>`
                    : ""
                }
                <div class="task-meta">
                    ${
                      task.priority
                        ? `<span class="badge badge-priority ${priorityBadgeClass}" onclick="event.stopPropagation(); clickToFilter('priority', '${task.priority.replace(
                            /'/g,
                            "\\'"
                          )}');" style="cursor: pointer;" title="${t(
                            "tooltip.filterByPriority"
                          )}">${displayPriority(task.priority)}</span>`
                        : ""
                    }
                    ${
                      task.category
                        ? `<span class="badge badge-category" onclick="event.stopPropagation(); clickToFilter('category', '${task.category.replace(
                            /'/g,
                            "\\'"
                          )}');" style="cursor: pointer;" title="${t(
                            "tooltip.filterByCategory"
                          )}">${task.category}</span>`
                        : ""
                    }
                    ${task.assignees
                      .map((a) => {
                        const normalizedId = normalizeUserId(a);
                        return `<span class="badge badge-assignee" onclick="event.stopPropagation(); clickToFilter('user', '${normalizedId.replace(
                          /'/g,
                          "\\'"
                        )}');" style="cursor: pointer;" title="${t(
                          "tooltip.filterByUser"
                        )}">${a}</span>`;
                      })
                      .join("")}
                    ${task.tags
                      .map(
                        (tag) =>
                          `<span class="tag" onclick="event.stopPropagation(); clickToFilter('tag', '${tag.replace(
                            /'/g,
                            "\\'"
                          )}');" style="cursor: pointer;" title="${t(
                            "tooltip.filterByTag"
                          )}">${tag}</span>`
                      )
                      .join("")}
                </div>
                ${subtaskProgress}
            `;

  taskEl.addEventListener("dragstart", drag);
  taskEl.addEventListener("click", () => showTaskDetail(task));

  return taskEl;
}

// Drag & Drop
function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("taskId", event.target.dataset.taskId);
  event.target.classList.add("dragging");
}

function drop(event) {
  event.preventDefault();
  const taskId = event.dataTransfer.getData("taskId");
  const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);

  if (taskEl) {
    taskEl.classList.remove("dragging");

    // Find the column
    let dropTarget = event.target;
    while (dropTarget && !dropTarget.classList.contains("task-list")) {
      dropTarget = dropTarget.parentElement;
    }

    if (dropTarget && dropTarget.classList.contains("task-list")) {
      const columnEl = dropTarget.closest(".kanban-column");
      const newStatus = columnEl.dataset.columnId;

      // Update task status
      const task = tasks.find((t) => t.id === taskId);
      if (task && task.status !== newStatus) {
        task.status = newStatus;
        renderKanban();
        autoSave();
        showNotification(t("notif.taskMoved"), "success");
      }
    }
  }
}

// Show task detail
function showTaskDetail(task) {
  currentDetailTask = task;
  const modal = document.getElementById("taskModal");
  const modalBody = document.getElementById("modalBody");

  // Get priority with translation
  let priorityWithIcon = task.priority;
  if (task.priority) {
    const priority = config.priorities.find((p) => clean(p) === task.priority);
    if (priority) {
      priorityWithIcon = displayPriority(priority);
    }
  }

  // Get status name
  const statusColumn = config.columns.find((col) => col.id === task.status);
  const statusName = statusColumn ? statusColumn.name : task.status;

  modalBody.innerHTML = `
                <div style="padding: 1.5rem;">
                    <!-- Task ID Badge -->
                    <div style="display: inline-block; background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem;">
                        ${task.id}
                    </div>

                    <!-- Title -->
                    <h3 style="margin: 0 0 1.5rem 0; font-size: 1.5rem; color: var(--text);">${
                      task.title
                    }</h3>

                    <!-- Metadata Grid -->
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
                        ${
                          task.priority
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.priority"
                                )}</div>
                                <div style="font-weight: 500;">${displayPriority(
                                  priorityWithIcon
                                )}</div>
                            </div>
                        `
                            : ""
                        }

                        <div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                              "meta.status"
                            )}</div>
                            <div style="font-weight: 500;">${statusName}</div>
                        </div>

                        ${
                          task.category
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.category"
                                )}</div>
                                <div style="font-weight: 500;">${
                                  task.category
                                }</div>
                            </div>
                        `
                            : ""
                        }

                        ${
                          task.assignees.length > 0
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.assigned"
                                )}</div>
                                <div style="font-weight: 500;">${task.assignees.join(
                                  ", "
                                )}</div>
                            </div>
                        `
                            : ""
                        }

                        ${
                          task.created
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.created"
                                )}</div>
                                <div style="font-weight: 500;">${
                                  task.created
                                }</div>
                            </div>
                        `
                            : ""
                        }

                        ${
                          task.started
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.started"
                                )}</div>
                                <div style="font-weight: 500;">${
                                  task.started
                                }</div>
                            </div>
                        `
                            : ""
                        }

                        ${
                          task.due
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.due"
                                )}</div>
                                <div style="font-weight: 500;">${task.due}</div>
                            </div>
                        `
                            : ""
                        }

                        ${
                          task.completed
                            ? `
                            <div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">${t(
                                  "meta.completed"
                                )}</div>
                                <div style="font-weight: 500;">${
                                  task.completed
                                }</div>
                            </div>
                        `
                            : ""
                        }
                    </div>

                    <!-- Tags -->
                    ${
                      task.tags.length > 0
                        ? `
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${t(
                              "meta.tags"
                            )}</div>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                ${task.tags
                                  .map(
                                    (tag) => `
                                    <span style="background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">
                                        ${tag}
                                    </span>
                                `
                                  )
                                  .join("")}
                            </div>
                        </div>
                    `
                        : ""
                    }

                    <!-- Description -->
                    ${
                      task.description
                        ? `
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">${t(
                              "meta.description"
                            )}</div>
                            <div style="line-height: 1.6; color: var(--text);">${markdownToHtml(
                              task.description
                            )}</div>
                        </div>
                    `
                        : ""
                    }

                    <!-- Subtasks -->
                    <div style="margin-bottom: 1.5rem;">
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">${t(
                          "meta.subtasks",
                          {
                            completed: task.subtasks.filter(
                              (st) => st.completed
                            ).length,
                            total: task.subtasks.length,
                          }
                        )}</div>
                        <ul id="subtasksList" style="list-style: none; padding: 0; margin: 0 0 1rem 0;">
                            ${task.subtasks
                              .map((st, idx) => {
                                const escapedText = st.text
                                  .replace(/</g, "&lt;")
                                  .replace(/>/g, "&gt;");
                                return `
                                <li style="padding: 0.5rem; margin-bottom: 0.25rem; background: var(--bg); border-radius: 4px; display: flex; align-items: center; gap: 0.5rem;">
                                    <input type="checkbox" ${
                                      st.completed ? "checked" : ""
                                    } onchange="toggleSubtask('${
                                  task.id
                                }', ${idx})" style="width: 18px; height: 18px; cursor: pointer;">
                                    <span ondblclick="editSubtask('${
                                      task.id
                                    }', ${idx})" style="flex: 1; ${
                                  st.completed
                                    ? "text-decoration: line-through; color: var(--text-secondary);"
                                    : ""
                                } cursor: pointer;" title="${t(
                                  "tooltip.doubleClickEdit"
                                )}">${escapedText}</span>
                                    <button onclick="deleteSubtask('${
                                      task.id
                                    }', ${idx})" style="background: none; border: none; cursor: pointer; color: #e53e3e; font-size: 1.1rem; padding: 0.25rem;" title="${t(
                                  "tooltip.delete"
                                )}">🗑️</button>
                                </li>
                                `;
                              })
                              .join("")}
                        </ul>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="newSubtaskInput" placeholder="${t(
                              "subtask.newPlaceholder"
                            )}" onkeypress="if(event.key==='Enter') addSubtask('${
    task.id
  }')" style="flex: 1; padding: 0.5rem; border: 2px solid #cbd5e0; border-radius: 4px; font-size: 0.9rem;">
                            <button onclick="addSubtask('${
                              task.id
                            }')" class="btn btn-primary" style="padding: 0.5rem 1rem;">${t(
    "taskForm.subtaskAdd"
  )}</button>
                        </div>
                    </div>

                    <!-- Notes -->
                    ${
                      task.notes
                        ? `
                        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; font-weight: 600;">${t(
                              "meta.notes"
                            )}</div>
                            <div style="line-height: 1.7; color: var(--text); background: var(--bg); padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary);">
                                ${markdownToHtml(task.notes)}
                            </div>
                        </div>
                    `
                        : ""
                    }
                </div>
            `;

  modal.classList.add("active");
}

function closeModal() {
  document.getElementById("taskModal").classList.remove("active");
}

function editCurrentTask() {
  if (currentDetailTask) {
    closeModal();
    openTaskModal(currentDetailTask);
  }
}

// Subtask management
function toggleSubtask(taskId, subtaskIdx) {
  const task = tasks.find((t) => t.id === taskId);
  if (task && task.subtasks[subtaskIdx]) {
    task.subtasks[subtaskIdx].completed = !task.subtasks[subtaskIdx].completed;
    currentDetailTask = task; // Update reference
    showTaskDetail(task); // Refresh display
    renderKanban(); // Update card progress
    autoSave();
  }
}

function deleteSubtask(taskId, subtaskIdx) {
  const task = tasks.find((t) => t.id === taskId);
  if (task && confirm(t("confirm.deleteSubtask"))) {
    task.subtasks.splice(subtaskIdx, 1);
    currentDetailTask = task;
    showTaskDetail(task);
    renderKanban();
    autoSave();
  }
}

function addSubtask(taskId) {
  const input = document.getElementById("newSubtaskInput");
  const text = input.value.trim();
  if (!text) return;

  const task = tasks.find((t) => t.id === taskId);
  if (task) {
    task.subtasks.push({ completed: false, text });
    currentDetailTask = task;
    input.value = "";
    showTaskDetail(task);
    renderKanban();
    autoSave();
  }
}

function editSubtask(taskId, subtaskIdx) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || !task.subtasks[subtaskIdx]) return;

  const newText = prompt(
    t("prompt.editSubtask"),
    task.subtasks[subtaskIdx].text
  );
  if (newText !== null && newText.trim()) {
    task.subtasks[subtaskIdx].text = newText.trim();
    currentDetailTask = task;
    showTaskDetail(task);
    renderKanban();
    autoSave();
  }
}

// Handle task form submission (create or edit)
document.getElementById("newTaskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get form values
  const title = document.getElementById("taskTitle").value.trim();
  const status = document.getElementById("taskStatus").value;
  const priority = document.getElementById("taskPriority").value;
  const category = document.getElementById("taskCategory").value.trim();
  const assignee = document.getElementById("taskAssignee").value.trim();
  const created = document.getElementById("taskCreated").value;
  const started = document.getElementById("taskStarted").value;
  const due = document.getElementById("taskDue").value;
  const completed = document.getElementById("taskCompleted").value;
  const tagsInput = document.getElementById("taskTags").value.trim();
  const description = document.getElementById("taskDescription").value.trim();
  const notes = document.getElementById("taskNotes").value.trim();

  // Parse tags and assignees
  const tags = tagsInput
    ? tagsInput
        .split(/\s+/)
        .filter((t) => t.startsWith("#") || t)
        .map((t) => (t.startsWith("#") ? t : "#" + t))
    : [];
  const assignees = assignee ? assignee.split(",").map((a) => a.trim()) : [];

  if (isEditMode) {
    // Edit existing task
    const taskId = document.getElementById("taskEditId").value;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.title = title;
      task.status = status;
      task.priority = priority;
      task.category = category;
      task.assignees = assignees;
      task.tags = tags;
      task.created = created;
      task.started = started;
      task.due = due;
      task.completed = completed;
      task.description = description;
      task.subtasks = formSubtasks;
      task.notes = notes;
      showNotification(t("notif.taskEdited", { id: taskId }), "success");
    }
  } else {
    // Create new task
    config.lastTaskId++;
    const newTaskId = "TASK-" + String(config.lastTaskId).padStart(3, "0");
    tasks.push({
      id: newTaskId,
      title,
      status,
      priority,
      category,
      assignees,
      tags,
      created: created || new Date().toISOString().split("T")[0],
      started: started || "",
      due,
      completed: completed || "",
      description,
      subtasks: formSubtasks,
      notes,
    });
    showNotification(t("notif.taskCreated", { id: newTaskId }), "success");
  }

  closeTaskModal();
  renderKanban();
  autoSave();
});

// Archive functions
async function loadArchive() {
  console.log("🗃️ === LOADING ARCHIVE ===");
  try {
    archiveFileHandle = await directoryHandle.getFileHandle("archive.md");
    console.log("✓ Archive file handle obtained");
    const file = await archiveFileHandle.getFile();
    console.log("✓ Archive file loaded, size:", file.size, "bytes");
    const content = await file.text();
    console.log(
      "✓ Archive content read, length:",
      content.length,
      "characters"
    );
    console.log("Archive content preview:", content.substring(0, 500));

    // Use the SAME section parser for archive.md!
    console.log("📖 Using unified parseTasksFromSection() parser...");

    // Parse the "✅ Archives" section directly with status 'archived'
    archivedTasks = parseTasksFromSection(content, "✅ Archives", "archived");

    console.log(
      "✓ Archive parsed. Total archived tasks:",
      archivedTasks.length
    );
    if (archivedTasks.length > 0) {
      console.log(
        "Archive tasks:",
        archivedTasks.map((t) => `${t.id} (${t.status})`).join(", ")
      );
    }
  } catch (error) {
    console.error("❌ archive.md not found or error:", error);
    archivedTasks = [];
  }
}

async function saveArchive() {
  if (!archiveFileHandle) {
    archiveFileHandle = await directoryHandle.getFileHandle("archive.md", {
      create: true,
    });
  }

  let md = `${t("markdown.archiveTitle")}\n\n${t(
    "markdown.archiveDesc"
  )}\n\n${t("markdown.archiveSection")}\n\n`;
  archivedTasks.forEach((task) => {
    md += `### ${task.id} | ${task.title}\n`;
    let meta = "";
    if (task.priority) meta += `**Priority**: ${task.priority}`;
    if (task.category) meta += ` | **Category**: ${task.category}`;
    if (task.assignees.length > 0)
      meta += ` | **Assigned**: ${task.assignees.join(", ")}`;
    if (meta) md += `${meta}\n`;

    // Write dates line
    let dates = "";
    if (task.created) dates += `**Created**: ${task.created}`;
    if (task.started)
      dates += (dates ? " | " : "") + `**Started**: ${task.started}`;
    if (task.due) dates += (dates ? " | " : "") + `**Due**: ${task.due}`;
    if (task.completed)
      dates += (dates ? " | " : "") + `**Finished**: ${task.completed}`;
    if (dates) md += `${dates}\n`;
    if (task.tags.length > 0) md += `**Tags**: ${task.tags.join(" ")}\n`;
    if (task.description) md += `\n${task.description}\n`;
    if (task.subtasks.length > 0) {
      md += `\n**Subtasks**:\n`;
      task.subtasks.forEach(
        (st) => (md += `- [${st.completed ? "x" : " "}] ${st.text}\n`)
      );
    }
    if (task.notes) {
      md += `\n**Notes**:\n${task.notes}\n`;
    }
    md += `\n`;
  });

  const writable = await archiveFileHandle.createWritable();
  await writable.write(md);
  await writable.close();
}

function archiveCurrentTask() {
  if (!currentDetailTask) return;
  if (confirm(t("confirm.archiveTask", { title: currentDetailTask.title }))) {
    // Remove from active tasks
    const idx = tasks.findIndex((t) => t.id === currentDetailTask.id);
    if (idx >= 0) {
      const task = tasks.splice(idx, 1)[0];
      archivedTasks.push(task);
      saveArchive();
      autoSave();
      updateAutocomplete(); // Keep historical values in autocomplete
      renderKanban();
      closeModal();
      showNotification(t("notif.taskArchived"), "success");
    }
  }
}

function deleteCurrentTask() {
  if (!currentDetailTask) return;
  deleteTask(currentDetailTask.id, false);
}

function deleteTask(taskId, fromArchive = false) {
  const taskList = fromArchive ? archivedTasks : tasks;
  const task = taskList.find((t) => t.id === taskId);

  if (!task) return;

  const confirmMessage = fromArchive
    ? t("confirm.deleteTask", { title: task.title })
    : t("confirm.deleteTaskFromArchive", { title: task.title });

  if (confirm(confirmMessage)) {
    const idx = taskList.findIndex((t) => t.id === taskId);
    if (idx >= 0) {
      taskList.splice(idx, 1);

      // Save both files
      if (fromArchive) {
        saveArchive();
      } else {
        autoSave();
      }

      // Update UI
      if (fromArchive) {
        renderArchiveList(document.getElementById("archiveSearch").value);
      } else {
        renderKanban();
        closeModal();
      }

      showNotification(t("notif.taskDeleted"), "success");
    }
  }
}

async function openArchiveModal() {
  console.log("\n📂 === OPENING ARCHIVE MODAL ===");
  await loadArchive();
  renderArchiveList();
  document.getElementById("archiveModal").classList.add("active");
  console.log("✓ Archive modal opened");
}

function closeArchiveModal() {
  document.getElementById("archiveModal").classList.remove("active");
}

function renderArchiveList(searchTerm = "") {
  console.log("\n🎨 === RENDERING ARCHIVE LIST ===");
  console.log("Search term:", searchTerm || "(none)");
  console.log("Total archived tasks:", archivedTasks.length);

  const list = document.getElementById("archiveList");
  if (!list) {
    console.error("❌ archiveList element not found!");
    return;
  }

  const filtered = searchTerm
    ? archivedTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          t.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : archivedTasks;

  console.log("Filtered tasks:", filtered.length);

  if (filtered.length === 0) {
    console.log("⚠️ No tasks to display - showing empty message");
    list.innerHTML = `<p style="text-align: center; color: #999; padding: 2rem;">${t(
      "archives.empty"
    )}</p>`;
    return;
  }

  console.log("✓ Rendering", filtered.length, "tasks");

  list.innerHTML = filtered
    .map(
      (task) => `
                <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <span style="background: #6b7280; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${
                              task.id
                            }</span>
                            <strong style="margin-left: 0.5rem; font-size: 1.1rem;">${
                              task.title
                            }</strong>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="deleteTask('${
                              task.id
                            }', true)" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; background: #ef4444; color: white;">🗑️</button>
                            <button onclick="unarchiveTask('${
                              task.id
                            }')" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">↩️ Restaurer</button>
                        </div>
                    </div>
                    ${
                      task.description
                        ? `<p style="color: #666; margin: 0.5rem 0;">${markdownToHtml(
                            task.description
                          )}</p>`
                        : ""
                    }
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                        ${
                          task.priority
                            ? `<span style="background: #fbbf24; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">${displayPriority(
                                task.priority
                              )}</span>`
                            : ""
                        }
                        ${
                          task.category
                            ? `<span style="background: #8b5cf6; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">${task.category}</span>`
                            : ""
                        }
                        ${task.tags
                          .map(
                            (t) =>
                              `<span style="background: #3b82f6; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem;">${t}</span>`
                          )
                          .join("")}
                    </div>
                </div>
            `
    )
    .join("");
}

function unarchiveTask(taskId) {
  const idx = archivedTasks.findIndex((t) => t.id === taskId);
  if (idx >= 0) {
    const task = archivedTasks.splice(idx, 1)[0];
    // Keep original column status
    // If the column no longer exists, use first column as fallback
    if (!config.columns.find((col) => col.id === task.status)) {
      task.status = config.columns[0]?.id || "todo";
    }
    tasks.push(task);
    saveArchive();
    autoSave();
    updateAutocomplete(); // Update autocomplete after restoring
    renderKanban();
    renderArchiveList(document.getElementById("archiveSearch").value);
    showNotification(t("notif.taskRestored"), "success");
  }
}

// Archive search
document.getElementById("archiveSearch").addEventListener("input", (e) => {
  renderArchiveList(e.target.value);
});

// Event listeners
document
  .getElementById("newTaskBtn")
  .addEventListener("click", () => openTaskModal());
document
  .getElementById("archiveBtn")
  .addEventListener("click", openArchiveModal);
document
  .getElementById("manageColsBtn")
  .addEventListener("click", openColumnsModal);

// Generate Markdown from tasks - SIMPLIFIED!
function generateMarkdown() {
  let md = `# Kanban Board\n\n<!-- Config: Last Task ID: ${config.lastTaskId} -->\n\n`;

  // Update config with values from tasks (merge with existing)
  const allCategories = new Set(config.categories || []);
  const allUsers = new Set(config.users || []);
  const allTags = new Set(config.tags || []);

  tasks.forEach((task) => {
    if (task.category) allCategories.add(task.category);
    task.assignees.forEach((u) => allUsers.add(u));
    task.tags.forEach((t) => allTags.add(t.replace("#", "")));
  });

  // Update config with merged values
  config.categories = [...allCategories];
  config.users = [...allUsers];
  config.tags = [...allTags];

  // Ensure defaults exist
  if (config.categories.length === 0) {
    config.categories = [
      "Frontend",
      "Backend",
      "Design",
      "DevOps",
      "Tests",
      "Documentation",
    ];
  }
  if (config.users.length === 0) {
    config.users = ["@user (User)"];
  }
  if (config.priorities.length === 0) {
    config.priorities = ["🔴 Critical", "🟠 High", "🟡 Medium", "🟢 Low"];
  }
  if (config.tags.length === 0) {
    config.tags = [
      "bug",
      "feature",
      "ui",
      "backend",
      "urgent",
      "refactor",
      "docs",
      "test",
    ];
  }

  // Add config section
  md += `## ⚙️ Configuration\n\n`;
  md += `**Columns**: ${config.columns
    .map((c) => `${c.name} (${c.id})`)
    .join(" | ")}\n\n`;
  md += `**Categories**: ${config.categories.join(", ")}\n\n`;
  md += `**Users**: ${config.users.join(", ")}\n\n`;
  md += `**Priorities**: ${config.priorities.join(" | ")}\n\n`;
  md += `**Tags**: ${config.tags.map((t) => "#" + t).join(" ")}\n\n`;
  md += `---\n\n`;

  // Add tasks by column
  config.columns.forEach((column) => {
    md += `## ${column.name}\n\n`;

    const columnTasks = tasks.filter((t) => t.status === column.id);
    columnTasks.forEach((task) => {
      md += `### ${task.id} | ${task.title}\n`;

      let meta = "";
      if (task.priority) meta += `**Priority**: ${task.priority}`;
      if (task.category) meta += ` | **Category**: ${task.category}`;
      if (task.assignees.length > 0)
        meta += ` | **Assigned**: ${task.assignees.join(", ")}`;
      if (meta) md += meta + "\n";

      // Write dates line
      let dates = "";
      if (task.created) dates += `**Created**: ${task.created}`;
      if (task.started)
        dates += (dates ? " | " : "") + `**Started**: ${task.started}`;
      if (task.due) dates += (dates ? " | " : "") + `**Due**: ${task.due}`;
      if (task.completed)
        dates += (dates ? " | " : "") + `**Finished**: ${task.completed}`;
      if (dates) md += dates + "\n";

      if (task.tags.length > 0) {
        md += `**Tags**: ${task.tags.join(" ")}\n`;
      }

      if (task.description) {
        md += `\n${task.description}\n`;
      }

      if (task.subtasks.length > 0) {
        md += `\n**Subtasks**:\n`;
        task.subtasks.forEach((st) => {
          md += `- [${st.completed ? "x" : " "}] ${st.text}\n`;
        });
      }

      if (task.notes) {
        md += `\n**Notes**:\n${task.notes}\n`;
      }

      md += `\n`; // Just one blank line between tasks, no ---
    });
  });

  return md;
}

// Show notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  notificationText.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}
