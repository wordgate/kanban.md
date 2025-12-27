<script setup lang="ts">
import KanbanBoard from '../kanban/KanbanBoard.vue'
import WelcomeScreen from '../common/WelcomeScreen.vue'
import { useProjectStore } from '@/stores'

const projectStore = useProjectStore()
</script>

<template>
  <main class="content-area">
    <KanbanBoard v-if="projectStore.currentProjectId" />
    <WelcomeScreen v-else />
  </main>
</template>

<style scoped>
.content-area {
  flex: 1;
  overflow: hidden;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
}
</style>
