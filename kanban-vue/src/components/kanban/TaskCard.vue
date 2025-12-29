<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useUIStore, useConfigStore } from '@/stores'
import { useDragDrop } from '@/composables'
import type { Task } from '@/types'

const props = defineProps<{
  task: Task
  isFocused: boolean
}>()

// Reference to card element for auto-scroll
const cardRef = ref<HTMLElement | null>(null)

// Auto-scroll into view when focused
watch(() => props.isFocused, (focused) => {
  if (focused && cardRef.value) {
    nextTick(() => {
      cardRef.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    })
  }
})

const uiStore = useUIStore()
const configStore = useConfigStore()
const { onDragStart, onDragEnd } = useDragDrop()

// 获取优先级信息
const priorityInfo = computed(() => {
  if (!props.task.priority) return null
  return configStore.priorities.find(p =>
    props.task.priority.toLowerCase().includes(p.value)
  )
})

// 子任务进度
const subtaskProgress = computed(() => {
  if (props.task.subtasks.length === 0) return null
  const completed = props.task.subtasks.filter(s => s.completed).length
  return { completed, total: props.task.subtasks.length }
})

function openTask() {
  uiStore.openFullTask(props.task.id)
}

function handleDragStart(event: DragEvent) {
  onDragStart(event, props.task.id)
}
</script>

<template>
  <div
    ref="cardRef"
    class="task-card"
    :class="{ focused: isFocused }"
    draggable="true"
    @click="openTask"
    @dragstart="handleDragStart"
    @dragend="onDragEnd"
  >
    <div class="task-header">
      <span class="task-id">{{ task.id }}</span>
      <span v-if="priorityInfo" class="task-priority" :class="priorityInfo.value">
        {{ priorityInfo.icon }}
      </span>
    </div>

    <div class="task-title">{{ task.title }}</div>

    <div v-if="task.description" class="task-description">
      {{ task.description }}
    </div>

    <div class="task-meta">
      <span v-if="task.category" class="meta-item category">
        {{ task.category }}
      </span>
      <span v-for="assignee in task.assignees.slice(0, 2)" :key="assignee" class="meta-item user">
        {{ assignee }}
      </span>
      <span v-if="task.assignees.length > 2" class="meta-item more">
        +{{ task.assignees.length - 2 }}
      </span>
    </div>

    <div class="task-footer">
      <div v-if="subtaskProgress" class="subtask-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(subtaskProgress.completed / subtaskProgress.total) * 100}%` }"
          ></div>
        </div>
        <span class="progress-text">{{ subtaskProgress.completed }}/{{ subtaskProgress.total }}</span>
      </div>

      <div v-if="task.due" class="due-date" :class="{ overdue: new Date(task.due) < new Date() }">
        📅 {{ task.due }}
      </div>
    </div>

    <div v-if="task.tags.length > 0" class="task-tags">
      <span v-for="tag in task.tags.slice(0, 3)" :key="tag" class="tag">
        #{{ tag }}
      </span>
    </div>

    <!-- 聚焦时的快捷键提示 -->
    <div v-if="isFocused" class="focus-hints">
      <kbd>Enter</kbd> 编辑
      <kbd>⌘←/→</kbd> 移动
    </div>
  </div>
</template>

<style scoped>
.task-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.15s;
}

.task-card:hover {
  background: var(--bg-hover);
  border-color: var(--text-muted);
}

.task-card.focused {
  border-color: var(--border-focus);
  box-shadow: var(--focus-ring), var(--focus-glow);
}

.task-card.dragging {
  opacity: 0.5;
}

.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xs);
}

.task-id {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.task-priority {
  font-size: 0.9rem;
}

.task-title {
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
}

.task-description {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.meta-item {
  font-size: 0.75rem;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-active);
}

.meta-item.category { color: var(--color-warning); }
.meta-item.user { color: var(--color-success); }
.meta-item.more { color: var(--text-muted); }

.task-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
}

.subtask-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex: 1;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-active);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-success);
  transition: width 0.2s;
}

.progress-text {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.due-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.due-date.overdue {
  color: var(--color-error);
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.tag {
  font-size: 0.7rem;
  color: var(--color-info);
}

.focus-hints {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
  font-size: 0.75rem;
  color: var(--text-muted);
}

.focus-hints kbd {
  font-size: 0.7rem;
  padding: 1px 4px;
}
</style>
