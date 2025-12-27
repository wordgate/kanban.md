import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, Subtask } from '@/types'
import { createEmptyTask } from '@/types'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const archivedTasks = ref<Task[]>([])
  const lastTaskId = ref(0)

  // 按列获取任务
  const tasksByColumn = computed(() => {
    return (columnId: string) => tasks.value.filter(t => t.status === columnId)
  })

  // 获取单个任务
  function getTask(id: string): Task | undefined {
    return tasks.value.find(t => t.id === id)
  }

  // 获取子任务（作为独立任务存储的子任务）
  function getSubtasks(parentId: string): Task[] {
    return tasks.value.filter(t => t.parentId === parentId)
  }

  // 获取父任务
  function getParentTask(taskId: string): Task | undefined {
    const task = getTask(taskId)
    if (task?.parentId) {
      return getTask(task.parentId)
    }
    return undefined
  }

  // 创建新任务
  function createTask(status: string, data?: Partial<Task>): Task {
    lastTaskId.value++
    const id = `TASK-${String(lastTaskId.value).padStart(3, '0')}`
    const task = { ...createEmptyTask(id, status), ...data }
    tasks.value.push(task)
    return task
  }

  // 更新任务
  function updateTask(id: string, data: Partial<Task>) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...data }
    }
  }

  // 移动任务到另一列
  function moveTask(id: string, toColumn: string) {
    const task = tasks.value.find(t => t.id === id)
    if (task) {
      task.status = toColumn
      // 如果移动到完成列，设置完成时间
      if (toColumn === 'done' && !task.completed) {
        task.completed = new Date().toISOString().split('T')[0]
      }
    }
  }

  // 删除任务
  function deleteTask(id: string) {
    tasks.value = tasks.value.filter(t => t.id !== id)
  }

  // 归档任务
  function archiveTask(id: string) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const [task] = tasks.value.splice(index, 1)
      archivedTasks.value.push(task)
    }
  }

  // 恢复归档任务
  function restoreTask(id: string) {
    const index = archivedTasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      const [task] = archivedTasks.value.splice(index, 1)
      tasks.value.push(task)
    }
  }

  // 添加子任务
  function addSubtask(taskId: string, text: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.subtasks.push({ text, completed: false })
    }
  }

  // 切换子任务状态
  function toggleSubtask(taskId: string, subtaskIndex: number) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.subtasks[subtaskIndex]) {
      task.subtasks[subtaskIndex].completed = !task.subtasks[subtaskIndex].completed
    }
  }

  // 更新子任务
  function updateSubtask(taskId: string, subtaskIndex: number, data: Partial<Subtask>) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task && task.subtasks[subtaskIndex]) {
      task.subtasks[subtaskIndex] = { ...task.subtasks[subtaskIndex], ...data }
    }
  }

  // 删除子任务
  function deleteSubtask(taskId: string, subtaskIndex: number) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.subtasks.splice(subtaskIndex, 1)
    }
  }

  // 设置所有任务（从文件加载时用）
  function setTasks(newTasks: Task[], archived: Task[] = []) {
    tasks.value = newTasks
    archivedTasks.value = archived
    // 计算最大任务ID
    const allTasks = [...newTasks, ...archived]
    const maxId = allTasks.reduce((max, t) => {
      const num = parseInt(t.id.replace('TASK-', ''))
      return Math.max(max, isNaN(num) ? 0 : num)
    }, 0)
    lastTaskId.value = maxId
  }

  // 清空任务
  function clearTasks() {
    tasks.value = []
    archivedTasks.value = []
    lastTaskId.value = 0
  }

  return {
    tasks,
    archivedTasks,
    lastTaskId,
    tasksByColumn,
    getTask,
    getSubtasks,
    getParentTask,
    createTask,
    updateTask,
    moveTask,
    deleteTask,
    archiveTask,
    restoreTask,
    addSubtask,
    toggleSubtask,
    updateSubtask,
    deleteSubtask,
    setTasks,
    clearTasks,
  }
})
