<script setup lang="ts">
import { computed } from 'vue'
import TaskCard from './TaskCard.vue'
import NewTaskCard from './NewTaskCard.vue'
import { useUIStore, useTaskStore } from '@/stores'
import { useFocusStore } from '@/stores/focusStore'
import { useDragDrop } from '@/composables'
import { useFocusBinding } from '@/composables/useFocusBinding'
import { taskIdToPathItem } from '@/focus/pathUtils'
import type { Column, Task } from '@/types'

const props = defineProps<{
  column: Column
  tasks: Task[]
  isFirstColumn?: boolean
}>()

const uiStore = useUIStore()
const taskStore = useTaskStore()
const focusStore = useFocusStore()
const { onDragOver, onDragEnter, onDragLeave, onDrop } = useDragDrop()

// 新的焦点绑定系统
const focusPattern = computed(() => `kanban.board.${props.column.id}.*`)
const { isFocused: columnIsFocused, isItemFocused } = useFocusBinding(focusPattern.value)

function createTask() {
  const task = taskStore.createTask(props.column.id, { title: '' })
  // 标记为新任务，关闭时如果标题为空会自动删除
  uiStore.openFullTask(task.id, true)
  // 更新焦点到新任务编辑器
  focusStore.pushLayer(`fullTask.${uiStore.fullTaskStack.length - 1}.editor.title`)
}

function handleDrop(event: DragEvent) {
  onDrop(event, props.column.id)
}

function handleDragEnter(event: DragEvent) {
  onDragEnter(event, props.column.id)
}

// 判断当前任务是否聚焦（使用新系统）
function checkTaskFocused(task: Task): boolean {
  const pathItem = taskIdToPathItem(task.id)
  return isItemFocused(pathItem)
}

// 检查新建卡片是否聚焦
function isNewTaskFocused(): boolean {
  return isItemFocused('new-task')
}
</script>

<template>
  <div
    class="kanban-column"
    :class="{ focused: columnIsFocused }"
    @dragover="onDragOver"
    @dragenter="handleDragEnter"
    @dragleave="onDragLeave"
    @drop="handleDrop"
  >
    <div class="column-header">
      <span class="column-name">{{ column.name }}</span>
      <span class="column-count">{{ tasks.length }}</span>
    </div>

    <div class="column-content">
      <!-- 新建任务卡片（仅第一列显示） -->
      <NewTaskCard
        v-if="isFirstColumn"
        :is-focused="isNewTaskFocused()"
        @create="createTask"
      />

      <!-- 任务列表 -->
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :is-focused="checkTaskFocused(task)"
      />
    </div>
  </div>
</template>

<style scoped>
.kanban-column {
  flex: 1;
  min-width: 280px;
  max-width: 350px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.15s;
}

.kanban-column.focused {
  border-color: var(--border-focus);
}

.kanban-column.drag-over {
  border-color: var(--text-accent);
  background: rgba(74, 222, 128, 0.05);
}

.column-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.column-name {
  font-weight: 600;
  color: var(--text-primary);
}

.column-count {
  background: var(--bg-tertiary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.column-content {
  flex: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
</style>
