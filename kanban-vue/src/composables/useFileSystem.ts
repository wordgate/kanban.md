import { watch } from 'vue'
import { useProjectStore, useTaskStore, useConfigStore } from '@/stores'
import { parseKanbanMarkdown, parseArchiveMarkdown, generateKanbanMarkdown, generateArchiveMarkdown } from '@/utils/markdown'

let saveTimeout: ReturnType<typeof setTimeout> | null = null

export function useFileSystem() {
  const projectStore = useProjectStore()
  const taskStore = useTaskStore()
  const configStore = useConfigStore()

  // 读取 kanban.md 文件
  async function readKanbanFile(): Promise<string> {
    if (!projectStore.kanbanFileHandle) return ''

    try {
      const file = await projectStore.kanbanFileHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error('读取 kanban.md 失败:', error)
      return ''
    }
  }

  // 读取 archive.md 文件
  async function readArchiveFile(): Promise<string> {
    if (!projectStore.archiveFileHandle) return ''

    try {
      const file = await projectStore.archiveFileHandle.getFile()
      return await file.text()
    } catch (error) {
      console.error('读取 archive.md 失败:', error)
      return ''
    }
  }

  // 写入 kanban.md 文件
  async function writeKanbanFile(content: string): Promise<boolean> {
    if (!projectStore.kanbanFileHandle) return false

    try {
      const writable = await projectStore.kanbanFileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      return true
    } catch (error) {
      console.error('写入 kanban.md 失败:', error)
      return false
    }
  }

  // 写入 archive.md 文件
  async function writeArchiveFile(content: string): Promise<boolean> {
    if (!projectStore.directoryHandle) return false

    try {
      // 确保 archive.md 存在
      if (!projectStore.archiveFileHandle) {
        projectStore.archiveFileHandle = await projectStore.directoryHandle.getFileHandle('archive.md', { create: true })
      }

      const writable = await projectStore.archiveFileHandle.createWritable()
      await writable.write(content)
      await writable.close()
      return true
    } catch (error) {
      console.error('写入 archive.md 失败:', error)
      return false
    }
  }

  // 加载项目数据
  async function loadProjectData(): Promise<boolean> {
    try {
      // 读取 kanban.md
      const kanbanContent = await readKanbanFile()
      if (kanbanContent) {
        const result = parseKanbanMarkdown(kanbanContent)
        configStore.setConfig(result.config)
        taskStore.setTasks(result.tasks)
        taskStore.lastTaskId = result.lastTaskId
      } else {
        // 新项目，使用默认配置
        configStore.resetToDefault()
        taskStore.clearTasks()
      }

      // 读取 archive.md
      const archiveContent = await readArchiveFile()
      if (archiveContent) {
        const archivedTasks = parseArchiveMarkdown(archiveContent)
        taskStore.archivedTasks = archivedTasks
      }

      return true
    } catch (error) {
      console.error('加载项目数据失败:', error)
      return false
    }
  }

  // 保存项目数据
  async function saveProjectData(): Promise<boolean> {
    try {
      // 生成并写入 kanban.md
      const kanbanContent = generateKanbanMarkdown(
        configStore.getConfig(),
        taskStore.tasks,
        taskStore.lastTaskId
      )
      await writeKanbanFile(kanbanContent)

      // 如果有归档任务，写入 archive.md
      if (taskStore.archivedTasks.length > 0) {
        const archiveContent = generateArchiveMarkdown(taskStore.archivedTasks)
        await writeArchiveFile(archiveContent)
      }

      return true
    } catch (error) {
      console.error('保存项目数据失败:', error)
      return false
    }
  }

  // 自动保存（防抖）
  function autoSave() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      saveProjectData()
    }, 500)
  }

  // 监听任务变化自动保存
  function setupAutoSave() {
    watch(
      () => [taskStore.tasks, taskStore.archivedTasks, configStore.columns],
      () => {
        if (projectStore.kanbanFileHandle) {
          autoSave()
        }
      },
      { deep: true }
    )
  }

  return {
    readKanbanFile,
    readArchiveFile,
    writeKanbanFile,
    writeArchiveFile,
    loadProjectData,
    saveProjectData,
    autoSave,
    setupAutoSave,
  }
}
