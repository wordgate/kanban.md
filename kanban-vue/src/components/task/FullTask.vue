<script setup lang="ts">
import { computed } from 'vue'
import TaskMeta from './TaskMeta.vue'
import TaskEditor from './TaskEditor.vue'
import SubtaskKanban from './SubtaskKanban.vue'
import { useUIStore, useTaskStore } from '@/stores'
import { useFocusStore } from '@/stores/focusStore'
import { useFullTaskPanelFocus } from '@/composables/useFocusBinding'
import { useTaskBinding, isTaskEmpty } from '@/composables/useTaskBinding'

const props = defineProps<{
  taskId: string
  stackIndex: number
  zIndex: number
  isTop: boolean
  isNew?: boolean
}>()

const uiStore = useUIStore()
const taskStore = useTaskStore()
const focusStore = useFocusStore()

// 使用响应式任务绑定 - 单一数据源
const { task, title } = useTaskBinding(() => props.taskId)

// 使用新的焦点系统
const { isFocused: metaFocused } = useFullTaskPanelFocus(props.stackIndex, 'meta')
const { isFocused: editorFocused } = useFullTaskPanelFocus(props.stackIndex, 'editor')
const { isFocused: subtasksFocused } = useFullTaskPanelFocus(props.stackIndex, 'subtasks')

// 父任务标题（用于面包屑显示）
const parentTitle = computed(() => {
  const t = task.value
  if (t?.parentId) {
    const parent = taskStore.getTask(t.parentId)
    return parent?.title || ''
  }
  return ''
})

// 当标题有内容时，标记为已保存（不再是新任务）
function onTitleChange() {
  if (title.value.trim()) {
    uiStore.markTaskSaved(props.taskId)
  }
}

// 关闭
function close() {
  // 如果是新任务且标题为空，删除任务
  if (props.isNew && isTaskEmpty(task.value)) {
    taskStore.deleteTask(props.taskId)
  }

  // 无论如何都清理新任务标记
  uiStore.markTaskSaved(props.taskId)

  uiStore.closeFullTask()
  focusStore.popLayer()
}
</script>

<template>
  <div
    v-if="task"
    class="full-task-overlay"
    :class="{ 'is-top': isTop }"
    :style="{ zIndex }"
    @click.self="close"
  >
    <div class="full-task-container" :style="{ transform: `translateY(${stackIndex * 10}px)` }">
      <!-- 头部 -->
      <div class="full-task-header">
        <div class="task-id">{{ task.id }}</div>
        <div class="header-actions">
          <span class="auto-save-hint">自动保存</span>
          <button class="btn-icon" @click="close" title="关闭 (Esc)">✕</button>
        </div>
      </div>

      <!-- 主体 -->
      <div class="full-task-body">
        <!-- 左侧：元数据 -->
        <div class="panel panel-left" :class="{ focused: metaFocused }">
          <TaskMeta
            :task-id="taskId"
            :stack-index="stackIndex"
            :active="metaFocused"
            :parent-title="parentTitle"
          />
        </div>

        <!-- 中间：编辑区 -->
        <div class="panel panel-center" :class="{ focused: editorFocused }">
          <TaskEditor
            :task-id="taskId"
            :stack-index="stackIndex"
            :active="editorFocused"
            @title-change="onTitleChange"
          />
        </div>

        <!-- 右侧：子任务 -->
        <div class="panel panel-right" :class="{ focused: subtasksFocused }">
          <SubtaskKanban
            :parent-task-id="taskId"
            :active="subtasksFocused"
            :focus-index="0"
          />
        </div>
      </div>

      <!-- 底部 -->
      <div class="full-task-footer">
        <div class="footer-hints">
          <span><kbd>←→</kbd> 切换栏</span>
          <span><kbd>↑↓</kbd> 切换项</span>
          <span><kbd>Enter</kbd> 编辑</span>
          <span><kbd>⌘↵</kbd> 完成编辑</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
        <div class="footer-actions">
          <button class="btn btn-primary" @click="close">完成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.full-task-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-primary);
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  pointer-events: auto;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.full-task-overlay.is-top {
  opacity: 1;
}

.full-task-container {
  flex: 1;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s;
}

.full-task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.task-id {
  font-family: var(--font-mono);
  font-size: 0.9rem;
  color: var(--text-accent);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.auto-save-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.full-task-body {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr 300px;
  overflow: hidden;
}

.panel {
  overflow-y: auto;
  transition: background 0.15s;
}

.panel.focused {
  background: rgba(74, 222, 128, 0.03);
}

.panel-left {
  border-right: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.panel-center {
  background: var(--bg-primary);
}

.panel-right {
  border-left: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.full-task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.footer-hints {
  display: flex;
  gap: var(--spacing-lg);
  color: var(--text-muted);
  font-size: 0.85rem;
}

.footer-hints kbd {
  margin-right: 4px;
}

.footer-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--color-success);
  border: 1px solid var(--color-success);
  color: #000;
  font-weight: 500;
}

.btn-primary:hover {
  background: #22c55e;
}
</style>
