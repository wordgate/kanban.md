import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project } from '@/types'

const DB_NAME = 'KanbanDB'
const DB_VERSION = 1
const STORE_NAME = 'projects'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)
  const directoryHandle = ref<FileSystemDirectoryHandle | null>(null)
  const kanbanFileHandle = ref<FileSystemFileHandle | null>(null)
  const archiveFileHandle = ref<FileSystemFileHandle | null>(null)
  const isLoading = ref(false)

  // 打开 IndexedDB
  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  // 加载项目列表
  async function loadProjects() {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.getAll()

      return new Promise<void>((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          projects.value = request.result.sort((a, b) => b.lastAccess - a.lastAccess)
          resolve()
        }
      })
    } catch (error) {
      console.error('加载项目列表失败:', error)
    }
  }

  // 保存项目
  async function saveProject(project: Project & { handle: FileSystemDirectoryHandle }) {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)

      // 保存项目信息和句柄
      const projectData = {
        id: project.id,
        name: project.name,
        path: project.path,
        lastAccess: project.lastAccess,
        handle: project.handle,
      }

      store.put(projectData)

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })

      await loadProjects()
    } catch (error) {
      console.error('保存项目失败:', error)
    }
  }

  // 获取项目句柄
  async function getProjectHandle(projectId: string): Promise<FileSystemDirectoryHandle | null> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(projectId)

      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          resolve(request.result?.handle || null)
        }
      })
    } catch (error) {
      console.error('获取项目句柄失败:', error)
      return null
    }
  }

  // 选择文件夹
  async function selectFolder(): Promise<boolean> {
    try {
      const handle = await window.showDirectoryPicker()
      directoryHandle.value = handle

      // 创建项目
      const projectId = `project-${Date.now()}`
      const project = {
        id: projectId,
        name: handle.name,
        path: handle.name,
        lastAccess: Date.now(),
        handle,
      }

      await saveProject(project)
      currentProjectId.value = projectId

      return true
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('选择文件夹失败:', error)
      }
      return false
    }
  }

  // 加载项目
  async function loadProject(projectId: string): Promise<boolean> {
    isLoading.value = true
    try {
      const handle = await getProjectHandle(projectId)
      if (!handle) return false

      // 检查权限
      const permission = await handle.queryPermission({ mode: 'readwrite' })
      if (permission !== 'granted') {
        const newPermission = await handle.requestPermission({ mode: 'readwrite' })
        if (newPermission !== 'granted') return false
      }

      directoryHandle.value = handle
      currentProjectId.value = projectId

      // 获取文件句柄
      try {
        kanbanFileHandle.value = await handle.getFileHandle('kanban.md')
      } catch {
        // 文件不存在，创建新文件
        kanbanFileHandle.value = await handle.getFileHandle('kanban.md', { create: true })
      }

      try {
        archiveFileHandle.value = await handle.getFileHandle('archive.md')
      } catch {
        archiveFileHandle.value = null
      }

      // 更新最后访问时间
      const project = projects.value.find(p => p.id === projectId)
      if (project) {
        await saveProject({ ...project, lastAccess: Date.now(), handle })
      }

      return true
    } catch (error) {
      console.error('加载项目失败:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 删除项目
  async function deleteProject(projectId: string) {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.delete(projectId)

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })

      if (currentProjectId.value === projectId) {
        currentProjectId.value = null
        directoryHandle.value = null
        kanbanFileHandle.value = null
        archiveFileHandle.value = null
      }

      await loadProjects()
    } catch (error) {
      console.error('删除项目失败:', error)
    }
  }

  // 重命名项目
  async function renameProject(projectId: string, newName: string) {
    const handle = await getProjectHandle(projectId)
    if (handle) {
      const project = projects.value.find(p => p.id === projectId)
      if (project) {
        await saveProject({ ...project, name: newName, handle })
      }
    }
  }

  // 切换项目
  function switchProject(direction: 'next' | 'prev') {
    if (projects.value.length === 0) return

    const currentIndex = projects.value.findIndex(p => p.id === currentProjectId.value)
    let newIndex: number

    if (currentIndex === -1) {
      newIndex = 0
    } else if (direction === 'next') {
      newIndex = (currentIndex + 1) % projects.value.length
    } else {
      newIndex = (currentIndex - 1 + projects.value.length) % projects.value.length
    }

    loadProject(projects.value[newIndex].id)
  }

  // 当前项目
  function getCurrentProject(): Project | null {
    return projects.value.find(p => p.id === currentProjectId.value) || null
  }

  return {
    projects,
    currentProjectId,
    directoryHandle,
    kanbanFileHandle,
    archiveFileHandle,
    isLoading,
    loadProjects,
    selectFolder,
    loadProject,
    deleteProject,
    renameProject,
    switchProject,
    getCurrentProject,
  }
})
