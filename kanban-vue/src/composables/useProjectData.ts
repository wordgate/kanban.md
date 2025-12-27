/**
 * Project Data Management Hook
 *
 * Centralized data management for tasks and config.
 * - Auto-saves on data changes (debounced)
 * - Handles project switching safely
 * - Provides CRUD operations
 */

import { ref, watch, computed } from 'vue'
import { useProjectStore, useTaskStore, useConfigStore, useUIStore } from '@/stores'
import { parseKanbanMarkdown, parseArchiveMarkdown, generateKanbanMarkdown, generateArchiveMarkdown } from '@/utils/markdown'
import type { Task } from '@/types'

// Singleton state
let saveTimeout: ReturnType<typeof setTimeout> | null = null
let isSwitchingProject = false

export function useProjectData() {
  const projectStore = useProjectStore()
  const taskStore = useTaskStore()
  const configStore = useConfigStore()
  const uiStore = useUIStore()

  const isLoading = ref(false)
  const isSaving = ref(false)

  // ============ File Operations ============

  async function readFile(handle: FileSystemFileHandle | null): Promise<string> {
    if (!handle) return ''
    try {
      const file = await handle.getFile()
      return await file.text()
    } catch (error) {
      console.error('[ProjectData] Read file failed:', error)
      return ''
    }
  }

  async function writeFile(handle: FileSystemFileHandle | null, content: string): Promise<boolean> {
    if (!handle) return false
    try {
      const writable = await handle.createWritable()
      await writable.write(content)
      await writable.close()
      return true
    } catch (error) {
      console.error('[ProjectData] Write file failed:', error)
      return false
    }
  }

  // ============ Save & Load ============

  async function saveProject(): Promise<boolean> {
    // Don't save during project switch
    if (isSwitchingProject) return false
    if (!projectStore.kanbanFileHandle) return false

    isSaving.value = true

    try {
      // Save kanban.md
      const kanbanContent = generateKanbanMarkdown(
        configStore.getConfig(),
        taskStore.tasks,
        taskStore.lastTaskId
      )
      const saved = await writeFile(projectStore.kanbanFileHandle, kanbanContent)

      // Save archive.md if needed
      if (taskStore.archivedTasks.length > 0 && projectStore.directoryHandle) {
        if (!projectStore.archiveFileHandle) {
          projectStore.archiveFileHandle = await projectStore.directoryHandle.getFileHandle('archive.md', { create: true })
        }
        const archiveContent = generateArchiveMarkdown(taskStore.archivedTasks)
        await writeFile(projectStore.archiveFileHandle, archiveContent)
      }

      return saved
    } catch (error) {
      console.error('[ProjectData] Save failed:', error)
      return false
    } finally {
      isSaving.value = false
    }
  }

  async function loadProject(): Promise<boolean> {
    if (!projectStore.kanbanFileHandle) return false

    isLoading.value = true

    try {
      // Load kanban.md
      const kanbanContent = await readFile(projectStore.kanbanFileHandle)

      if (kanbanContent) {
        const result = parseKanbanMarkdown(kanbanContent)
        configStore.setConfig(result.config)
        taskStore.setTasks(result.tasks)
        taskStore.lastTaskId = result.lastTaskId
      } else {
        configStore.resetToDefault()
        taskStore.clearTasks()
      }

      // Load archive.md
      const archiveContent = await readFile(projectStore.archiveFileHandle)
      if (archiveContent) {
        const archivedTasks = parseArchiveMarkdown(archiveContent)
        taskStore.archivedTasks = archivedTasks
      }

      return true
    } catch (error) {
      console.error('[ProjectData] Load failed:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ============ Project Switching ============

  async function switchProject(projectId: string): Promise<boolean> {
    // Cancel any pending auto-save
    if (saveTimeout) {
      clearTimeout(saveTimeout)
      saveTimeout = null
    }

    // Mark that we're switching projects
    isSwitchingProject = true

    try {
      // Save current project first
      if (projectStore.kanbanFileHandle) {
        isSwitchingProject = false // Temporarily allow save
        await saveProject()
        isSwitchingProject = true
      }

      // Load new project
      const loaded = await projectStore.loadProject(projectId)
      if (!loaded) return false

      // Load project data
      await loadProject()

      return true
    } finally {
      isSwitchingProject = false
    }
  }

  // ============ Auto-save ============

  function scheduleSave() {
    if (isSwitchingProject) return

    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      saveProject()
    }, 500)
  }

  function setupAutoSave() {
    watch(
      () => [taskStore.tasks, taskStore.archivedTasks, configStore.columns],
      () => {
        if (projectStore.kanbanFileHandle && !isSwitchingProject) {
          scheduleSave()
        }
      },
      { deep: true }
    )
  }

  // ============ Task CRUD ============

  function createTask(columnId: string): Task {
    const task = taskStore.createTask(columnId)
    uiStore.openFullTask(task.id, true)
    return task
  }

  function updateTask(taskId: string, updates: Partial<Task>) {
    taskStore.updateTask(taskId, updates)
    // Auto-save will trigger from watch
  }

  function deleteTask(taskId: string) {
    taskStore.deleteTask(taskId)
    // Auto-save will trigger from watch
  }

  function moveTask(taskId: string, toColumnId: string) {
    taskStore.moveTask(taskId, toColumnId)
    // Auto-save will trigger from watch
  }

  function archiveTask(taskId: string) {
    taskStore.archiveTask(taskId)
    // Auto-save will trigger from watch
  }

  // ============ Computed ============

  const currentProject = computed(() => projectStore.getCurrentProject())
  const tasks = computed(() => taskStore.tasks)
  const tasksByColumn = (columnId: string) => taskStore.tasksByColumn(columnId)

  return {
    // State
    isLoading,
    isSaving,
    currentProject,
    tasks,
    tasksByColumn,

    // Project operations
    switchProject,
    saveProject,
    loadProject,
    setupAutoSave,

    // Task CRUD
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    archiveTask,
  }
}
