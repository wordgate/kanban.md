import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Filter {
  type: 'tag' | 'category' | 'user' | 'priority' | 'text'
  value: string
}

export const useUIStore = defineStore('ui', () => {
  // FullTask 堆栈
  const fullTaskStack = ref<string[]>([])
  // 追踪新创建的任务（用于判断关闭时是否删除空任务）
  const newTaskIds = ref<Set<string>>(new Set())

  // 搜索状态
  const searchQuery = ref('')

  // 过滤器
  const activeFilters = ref<Filter[]>([])

  // 确认弹窗
  const confirmDialog = ref<{
    visible: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // 打开 FullTask
  function openFullTask(taskId: string, isNew: boolean = false) {
    fullTaskStack.value.push(taskId)
    if (isNew) {
      newTaskIds.value.add(taskId)
    }
  }

  // 检查任务是否是新创建的
  function isNewTask(taskId: string): boolean {
    return newTaskIds.value.has(taskId)
  }

  // 标记任务不再是新任务（保存后）
  function markTaskSaved(taskId: string) {
    newTaskIds.value.delete(taskId)
  }

  // 关闭 FullTask
  function closeFullTask() {
    fullTaskStack.value.pop()
  }

  // 关闭所有 FullTask
  function closeAllFullTasks() {
    fullTaskStack.value = []
  }

  // 添加过滤器
  function addFilter(filter: Filter) {
    const exists = activeFilters.value.find(
      f => f.type === filter.type && f.value === filter.value
    )
    if (!exists) {
      activeFilters.value.push(filter)
    }
  }

  // 移除过滤器
  function removeFilter(filter: Filter) {
    activeFilters.value = activeFilters.value.filter(
      f => !(f.type === filter.type && f.value === filter.value)
    )
  }

  // 清空过滤器
  function clearFilters() {
    activeFilters.value = []
    searchQuery.value = ''
  }

  // 显示确认弹窗
  function showConfirm(title: string, message: string, onConfirm: () => void) {
    confirmDialog.value = {
      visible: true,
      title,
      message,
      onConfirm,
    }
  }

  // 隐藏确认弹窗
  function hideConfirm() {
    confirmDialog.value.visible = false
  }

  return {
    fullTaskStack,
    newTaskIds,
    searchQuery,
    activeFilters,
    confirmDialog,
    openFullTask,
    closeFullTask,
    closeAllFullTasks,
    isNewTask,
    markTaskSaved,
    addFilter,
    removeFilter,
    clearFilters,
    showConfirm,
    hideConfirm,
  }
})
