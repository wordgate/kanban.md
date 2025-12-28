<script setup lang="ts">
import { computed } from 'vue'
import FullTask from './FullTask.vue'
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

// 简化：只传递 taskId，让子组件自己从 store 获取数据
const stackItems = computed(() => {
  return uiStore.fullTaskStack.map((taskId, index) => ({
    taskId,
    index,
    zIndex: 100 + index,
    isNew: uiStore.isNewTask(taskId),
  }))
})
</script>

<template>
  <Teleport to="body">
    <div v-if="stackItems.length > 0" class="full-task-stack">
      <FullTask
        v-for="item in stackItems"
        :key="item.taskId"
        :task-id="item.taskId"
        :stack-index="item.index"
        :z-index="item.zIndex"
        :is-top="item.index === stackItems.length - 1"
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
