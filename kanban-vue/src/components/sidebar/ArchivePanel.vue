<script setup lang="ts">
import { ref } from 'vue'
import { useTaskStore } from '@/stores'

const taskStore = useTaskStore()
const isExpanded = ref(false)

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function restoreTask(taskId: string) {
  taskStore.restoreTask(taskId)
}
</script>

<template>
  <div class="archive-panel">
    <button class="archive-header" @click="toggleExpand">
      <span class="archive-icon">📦</span>
      <span>归档</span>
      <span class="archive-count">{{ taskStore.archivedTasks.length }}</span>
      <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span>
    </button>

    <div v-if="isExpanded" class="archive-content">
      <div
        v-for="task in taskStore.archivedTasks"
        :key="task.id"
        class="archive-item"
      >
        <span class="task-title">{{ task.title }}</span>
        <button class="restore-btn" @click="restoreTask(task.id)" title="恢复">
          ↩
        </button>
      </div>

      <div v-if="taskStore.archivedTasks.length === 0" class="empty-hint">
        暂无归档任务
      </div>
    </div>
  </div>
</template>

<style scoped>
.archive-panel {
  padding: var(--spacing-sm);
}

.archive-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  font-size: 0.9rem;
}

.archive-header:hover {
  background: var(--bg-hover);
}

.archive-count {
  background: var(--bg-tertiary);
  padding: 0 var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.expand-icon {
  margin-left: auto;
  font-size: 0.7rem;
}

.archive-content {
  max-height: 200px;
  overflow-y: auto;
  margin-top: var(--spacing-sm);
}

.archive-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.archive-item:hover {
  background: var(--bg-hover);
}

.task-title {
  flex: 1;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
}

.restore-btn {
  padding: 2px 6px;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 0.8rem;
}

.restore-btn:hover {
  background: var(--bg-hover);
  color: var(--text-accent);
  border-color: var(--text-accent);
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.8rem;
  padding: var(--spacing-sm);
  text-align: center;
}
</style>
