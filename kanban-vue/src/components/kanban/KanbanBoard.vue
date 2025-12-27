<script setup lang="ts">
import { computed } from 'vue'
import KanbanColumn from './KanbanColumn.vue'
import { useConfigStore } from '@/stores'
import { useSearch } from '@/composables'

const configStore = useConfigStore()
const { filteredTasks } = useSearch()

// 按列分组的任务
const tasksByColumn = computed(() => {
  const result: Record<string, typeof filteredTasks.value> = {}
  configStore.columns.forEach(column => {
    result[column.id] = filteredTasks.value.filter(t => t.status === column.id)
  })
  return result
})
</script>

<template>
  <div class="kanban-board">
    <KanbanColumn
      v-for="column in configStore.columns"
      :key="column.id"
      :column="column"
      :tasks="tasksByColumn[column.id] || []"
    />
  </div>
</template>

<style scoped>
.kanban-board {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}
</style>
