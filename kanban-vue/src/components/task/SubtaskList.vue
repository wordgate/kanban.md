<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useUIStore, useTaskStore } from '@/stores'
import type { Subtask } from '@/types'

const props = defineProps<{
  taskId: string
  subtasks: Subtask[]
  focusIndex: number
}>()

const emit = defineEmits<{
  update: [subtasks: Subtask[]]
}>()

const uiStore = useUIStore()
const taskStore = useTaskStore()
const newSubtaskText = ref('')
const editingIndex = ref<number | null>(null)
const editingText = ref('')

// 输入框引用
const addInputRef = ref<HTMLInputElement | null>(null)
const subtaskRefs = ref<HTMLElement[]>([])

// 添加子任务
function addSubtask() {
  if (!newSubtaskText.value.trim()) return

  const newSubtasks = [...props.subtasks, {
    text: newSubtaskText.value.trim(),
    completed: false,
  }]
  emit('update', newSubtasks)
  newSubtaskText.value = ''
}

// 切换子任务完成状态
function toggleSubtask(index: number) {
  const newSubtasks = [...props.subtasks]
  newSubtasks[index] = {
    ...newSubtasks[index],
    completed: !newSubtasks[index].completed,
  }
  emit('update', newSubtasks)
}

// 开始编辑
function startEdit(index: number) {
  editingIndex.value = index
  editingText.value = props.subtasks[index].text
}

// 保存编辑
function saveEdit() {
  if (editingIndex.value === null) return

  const newSubtasks = [...props.subtasks]
  if (editingText.value.trim()) {
    newSubtasks[editingIndex.value] = {
      ...newSubtasks[editingIndex.value],
      text: editingText.value.trim(),
    }
    emit('update', newSubtasks)
  }
  editingIndex.value = null
  editingText.value = ''
}

// 取消编辑
function cancelEdit() {
  editingIndex.value = null
  editingText.value = ''
}

// 删除子任务
function deleteSubtask(index: number) {
  const newSubtasks = props.subtasks.filter((_, i) => i !== index)
  emit('update', newSubtasks)
}

// 打开子任务详情（创建新任务并打开）
function openSubtaskDetail(subtask: Subtask) {
  // 创建一个新任务基于子任务
  const task = taskStore.createTask(taskStore.getTask(props.taskId)?.status || 'todo', {
    title: subtask.text,
    description: `来自任务 ${props.taskId} 的子任务`,
  })
  uiStore.openFullTask(task.id)
}

// 处理输入框键盘事件
function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    addSubtask()
  }
}

// 处理编辑框键盘事件
function handleEditKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveEdit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    cancelEdit()
  }
}

// 聚焦到指定字段
function focusField(index: number) {
  nextTick(() => {
    if (index === 0) {
      addInputRef.value?.focus()
    } else {
      // index 1+ 对应 subtasks[index-1]
      const subtaskIndex = index - 1
      if (subtaskRefs.value[subtaskIndex]) {
        // 聚焦到子任务的 checkbox 按钮
        const checkbox = subtaskRefs.value[subtaskIndex].querySelector('.checkbox') as HTMLElement
        checkbox?.focus()
      }
    }
  })
}

// 设置子任务引用
function setSubtaskRef(el: HTMLElement | null, index: number) {
  if (el) {
    subtaskRefs.value[index] = el
  }
}

// 暴露方法给父组件
defineExpose({ focusField })
</script>

<template>
  <div class="subtask-list">
    <div class="subtask-header">
      <span class="subtask-title">子任务</span>
      <span class="subtask-count">{{ subtasks.filter(s => s.completed).length }}/{{ subtasks.length }}</span>
    </div>

    <!-- 添加子任务输入 -->
    <div class="add-subtask" :class="{ focused: focusIndex === 0 }">
      <input
        ref="addInputRef"
        v-model="newSubtaskText"
        type="text"
        placeholder="添加子任务..."
        @keydown="handleInputKeydown"
      />
      <button class="add-btn" @click="addSubtask" :disabled="!newSubtaskText.trim()">
        +
      </button>
    </div>

    <!-- 子任务列表 -->
    <div class="subtasks">
      <div
        v-for="(subtask, index) in subtasks"
        :key="index"
        :ref="(el) => setSubtaskRef(el as HTMLElement, index)"
        class="subtask-item"
        :class="{ completed: subtask.completed, focused: focusIndex === index + 1 }"
      >
        <button
          class="checkbox"
          :class="{ checked: subtask.completed }"
          @click="toggleSubtask(index)"
        >
          {{ subtask.completed ? '☑' : '☐' }}
        </button>

        <template v-if="editingIndex === index">
          <input
            v-model="editingText"
            type="text"
            class="edit-input"
            @keydown="handleEditKeydown"
            @blur="saveEdit"
            autofocus
          />
        </template>
        <template v-else>
          <span class="subtask-text" @dblclick="startEdit(index)">
            {{ subtask.text }}
          </span>
        </template>

        <div class="subtask-actions">
          <button class="action-btn" @click="openSubtaskDetail(subtask)" title="转为任务">
            ↗
          </button>
          <button class="action-btn danger" @click="deleteSubtask(index)" title="删除">
            ✕
          </button>
        </div>
      </div>

      <div v-if="subtasks.length === 0" class="empty-subtasks">
        暂无子任务
      </div>
    </div>
  </div>
</template>

<style scoped>
.subtask-list {
  padding: var(--spacing-md);
  border-left: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.add-subtask {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-xs);
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.add-subtask.focused {
  background: rgba(74, 222, 128, 0.1);
}

.add-subtask input {
  flex: 1;
  padding: var(--spacing-sm);
  font-size: 0.9rem;
  background: var(--bg-secondary);
}

.add-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-active);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-accent);
  font-size: 1.1rem;
  cursor: pointer;
}

.add-btn:hover:not(:disabled) {
  background: var(--bg-hover);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.subtasks {
  flex: 1;
  overflow-y: auto;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: background 0.15s;
}

.subtask-item:hover {
  background: var(--bg-hover);
}

.subtask-item.focused {
  background: rgba(74, 222, 128, 0.1);
}

.subtask-item.completed .subtask-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checkbox {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
}

.checkbox.checked {
  color: var(--color-success);
}

.subtask-text {
  flex: 1;
  font-size: 0.9rem;
  color: var(--text-primary);
  cursor: text;
}

.edit-input {
  flex: 1;
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.9rem;
  background: var(--bg-secondary);
}

.subtask-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.subtask-item:hover .subtask-actions {
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
  color: var(--text-primary);
}

.action-btn.danger:hover {
  color: var(--color-error);
}

.empty-subtasks {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: var(--spacing-lg);
}
</style>
