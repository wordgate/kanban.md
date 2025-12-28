<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUIStore, useTaskStore, useConfigStore } from '@/stores'
import { useTaskBinding } from '@/composables/useTaskBinding'
import type { Task } from '@/types'

const props = defineProps<{
  parentTaskId: string
  active: boolean
  focusIndex: number
}>()

const emit = defineEmits<{
  navigate: [index: number]
}>()

const uiStore = useUIStore()
const taskStore = useTaskStore()
const configStore = useConfigStore()

// 使用响应式任务绑定获取父任务
const { task: parentTask } = useTaskBinding(() => props.parentTaskId)

// 获取子任务（作为独立任务存储）
const subtasks = computed(() => {
  return taskStore.getSubtasks(props.parentTaskId)
})

// 内部焦点索引：0 = 添加按钮, 1+ = 子任务
const internalFocusIndex = ref(0)

// 同步外部焦点
watch(() => props.focusIndex, (index) => {
  if (index >= 0) {
    internalFocusIndex.value = index
  }
})

// 新任务标题输入
const newTaskTitle = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// 添加子任务
function addSubtask(): void {
  if (!newTaskTitle.value.trim()) return
  if (!parentTask.value) return

  // 创建独立任务并关联到父任务
  const task = taskStore.createTask('todo', {
    title: newTaskTitle.value.trim(),
    parentId: props.parentTaskId,
  })

  // 同时更新父任务的 subtasks 列表
  const subtaskIds = [...(parentTask.value.subtasks || []).map(s =>
    typeof s === 'string' ? s : s.text
  )]
  subtaskIds.push(task.id)
  taskStore.updateTask(props.parentTaskId, {
    subtasks: subtaskIds.map(id => ({ text: id, completed: false }))
  })

  newTaskTitle.value = ''
}

// 打开子任务详情
function openSubtask(task: Task): void {
  uiStore.openFullTask(task.id)
}

// 删除子任务
function deleteSubtask(task: Task): void {
  uiStore.showConfirm(
    '删除子任务',
    `确定删除子任务 "${task.title}" 吗？`,
    () => {
      taskStore.deleteTask(task.id)
      uiStore.hideConfirm()
    }
  )
}

// 移动焦点
function move(direction: 'up' | 'down'): void {
  const maxIndex = subtasks.value.length  // 0=input, 1+=subtasks
  const delta = direction === 'up' ? -1 : 1
  let newIndex = internalFocusIndex.value + delta

  // 循环
  if (newIndex < 0) newIndex = maxIndex
  if (newIndex > maxIndex) newIndex = 0

  internalFocusIndex.value = newIndex
  emit('navigate', newIndex)
}

// 聚焦当前项
async function focusCurrentItem(): Promise<void> {
  await nextTick()
  if (internalFocusIndex.value === 0) {
    inputRef.value?.focus()
  }
}

// 键盘事件
function handleKeyDown(event: KeyboardEvent): void {
  if (!props.active) return

  const isInInput = document.activeElement === inputRef.value

  switch (event.key) {
    case 'ArrowUp':
    case 'k':
      if (!isInInput || !newTaskTitle.value) {
        event.preventDefault()
        move('up')
        focusCurrentItem()
      }
      break

    case 'ArrowDown':
    case 'j':
      if (!isInInput || !newTaskTitle.value) {
        event.preventDefault()
        move('down')
        focusCurrentItem()
      }
      break

    case 'Tab':
      event.preventDefault()
      move(event.shiftKey ? 'up' : 'down')
      focusCurrentItem()
      break

    case 'Enter':
      event.preventDefault()
      if (internalFocusIndex.value === 0) {
        if (newTaskTitle.value.trim()) {
          addSubtask()
        }
      } else {
        const task = subtasks.value[internalFocusIndex.value - 1]
        if (task) {
          openSubtask(task)
        }
      }
      break

    case ' ':
      if (!isInInput) {
        event.preventDefault()
        const task = subtasks.value[internalFocusIndex.value - 1]
        if (task) {
          openSubtask(task)
        }
      }
      break

    case 'Delete':
    case 'Backspace':
      if (!isInInput) {
        event.preventDefault()
        const task = subtasks.value[internalFocusIndex.value - 1]
        if (task) {
          deleteSubtask(task)
        }
      }
      break
  }
}

onMounted(() => {
  if (props.active) {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

watch(() => props.active, (active) => {
  if (active) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

// 获取状态对应的列名
function getColumnName(status: string): string {
  const column = configStore.columns.find(c => c.id === status)
  return column?.name || status
}

// 暴露方法
defineExpose({
  focusIndex: internalFocusIndex,
  move,
  focusCurrentItem,
})
</script>

<template>
  <div v-if="parentTask" class="subtask-kanban">
    <div class="subtask-header">
      <span class="subtask-title">子任务</span>
      <span class="subtask-count">{{ subtasks.length }}</span>
    </div>

    <!-- 添加子任务 -->
    <div class="add-subtask" :class="{ focused: active && internalFocusIndex === 0 }">
      <input
        ref="inputRef"
        v-model="newTaskTitle"
        type="text"
        placeholder="添加子任务... (Enter)"
        @keydown.enter.prevent="addSubtask"
      />
    </div>

    <!-- 子任务列表 -->
    <div class="subtask-list">
      <div
        v-for="(task, index) in subtasks"
        :key="task.id"
        class="subtask-card"
        :class="{ focused: active && internalFocusIndex === index + 1 }"
        @click="openSubtask(task)"
      >
        <div class="task-status">
          <span class="status-badge" :class="task.status">
            {{ getColumnName(task.status) }}
          </span>
        </div>
        <div class="task-info">
          <div class="task-id">{{ task.id }}</div>
          <div class="task-title">{{ task.title || '(无标题)' }}</div>
        </div>
        <div class="task-actions">
          <button class="action-btn" @click.stop="deleteSubtask(task)" title="删除">
            ✕
          </button>
        </div>
      </div>

      <div v-if="subtasks.length === 0" class="empty-hint">
        暂无子任务
      </div>
    </div>

    <div class="subtask-hints">
      <span><kbd>Enter</kbd> 打开</span>
      <span><kbd>Del</kbd> 删除</span>
    </div>
  </div>
</template>

<style scoped>
.subtask-kanban {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-md);
}

.subtask-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.subtask-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.subtask-count {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.add-subtask {
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-xs);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.add-subtask.focused {
  border-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.1);
}

.add-subtask input {
  width: 100%;
  padding: var(--spacing-sm);
  font-size: 0.9rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.add-subtask input:focus {
  border-color: var(--border-focus);
  box-shadow: var(--focus-glow);
}

.subtask-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.subtask-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.subtask-card:hover {
  background: var(--bg-hover);
}

.subtask-card.focused {
  border-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.1);
}

.task-status {
  flex-shrink: 0;
}

.status-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-muted);
}

.status-badge.todo {
  background: rgba(156, 163, 175, 0.2);
}

.status-badge.in-progress {
  background: rgba(59, 130, 246, 0.2);
  color: var(--color-info);
}

.status-badge.review {
  background: rgba(249, 115, 22, 0.2);
  color: var(--color-warning);
}

.status-badge.done {
  background: rgba(34, 197, 94, 0.2);
  color: var(--color-success);
}

.task-info {
  flex: 1;
  min-width: 0;
}

.task-id {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.task-title {
  font-size: 0.85rem;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.subtask-card:hover .task-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.action-btn:hover {
  background: var(--bg-active);
  color: var(--color-error);
}

.empty-hint {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: var(--spacing-lg);
}

.subtask-hints {
  display: flex;
  gap: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.subtask-hints kbd {
  font-size: 0.7rem;
  margin-right: 4px;
}
</style>
