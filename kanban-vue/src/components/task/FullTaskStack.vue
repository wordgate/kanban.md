<script setup lang="ts">
import { computed } from 'vue'
import FullTask from './FullTask.vue'
import { useUIStore, useTaskStore } from '@/stores'

const uiStore = useUIStore()
const taskStore = useTaskStore()

const stackTasks = computed(() => {
  return uiStore.fullTaskStack.map((taskId, index) => ({
    task: taskStore.getTask(taskId),
    taskId,
    index,
    zIndex: 100 + index,
    isNew: uiStore.isNewTask(taskId),
  })).filter(item => item.task)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="stackTasks.length > 0" class="full-task-stack">
      <FullTask
        v-for="item in stackTasks"
        :key="item.task!.id"
        :task="item.task!"
        :stack-index="item.index"
        :z-index="item.zIndex"
        :is-top="item.index === stackTasks.length - 1"
        :is-new="item.isNew"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.full-task-stack {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
}
</style>
