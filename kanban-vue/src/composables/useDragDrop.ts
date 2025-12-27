import { useTaskStore } from '@/stores'

export function useDragDrop() {
  const taskStore = useTaskStore()

  let draggedTaskId: string | null = null

  function onDragStart(event: DragEvent, taskId: string) {
    draggedTaskId = taskId
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', taskId)
    }

    // 添加拖动样式
    const target = event.target as HTMLElement
    target.classList.add('dragging')
  }

  function onDragEnd(event: DragEvent) {
    draggedTaskId = null

    // 移除拖动样式
    const target = event.target as HTMLElement
    target.classList.remove('dragging')
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  function onDragEnter(event: DragEvent, _columnId: string) {
    event.preventDefault()

    // 添加放置目标样式
    const target = event.currentTarget as HTMLElement
    target.classList.add('drag-over')
  }

  function onDragLeave(event: DragEvent) {
    // 移除放置目标样式
    const target = event.currentTarget as HTMLElement
    target.classList.remove('drag-over')
  }

  function onDrop(event: DragEvent, columnId: string) {
    event.preventDefault()

    // 移除放置目标样式
    const target = event.currentTarget as HTMLElement
    target.classList.remove('drag-over')

    const taskId = event.dataTransfer?.getData('text/plain') || draggedTaskId
    if (taskId) {
      taskStore.moveTask(taskId, columnId)
    }

    draggedTaskId = null
  }

  return {
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
  }
}
