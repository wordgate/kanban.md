<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import AppLayout from './components/layout/AppLayout.vue'
import ConfirmDialog from './components/common/ConfirmDialog.vue'
import KeyHintBar from './components/common/KeyHintBar.vue'
import FullTaskStack from './components/task/FullTaskStack.vue'
import { useProjectStore, useUIStore, useConfigStore } from './stores'
import { useFocusStore } from './stores/focusStore'
import { useProjectData } from './composables/useProjectData'
import { useGlobalKeyboard } from './composables/useGlobalKeyboard'

const projectStore = useProjectStore()
const uiStore = useUIStore()
const configStore = useConfigStore()
const focusStore = useFocusStore()
const { setupAutoSave, loadProject, saveProject } = useProjectData()

// 统一键盘处理系统（替代旧的 useKeyboard）
useGlobalKeyboard()

// 处理全局保存事件 (Cmd+S)
function handleAppSave() {
  saveProject()
}

onMounted(async () => {
  // 监听全局保存事件
  window.addEventListener('app-save', handleAppSave)
  // 加载项目列表
  await projectStore.loadProjects()

  // 如果有项目，自动加载第一个
  if (projectStore.projects.length > 0) {
    const loaded = await projectStore.loadProject(projectStore.projects[0].id)
    if (loaded) {
      await loadProject()
      // 初始化焦点到第一个列
      if (configStore.columns.length > 0) {
        focusStore.initializeWithColumn(configStore.columns[0].id)
      }
    }
  }

  // 设置自动保存
  setupAutoSave()
})

onUnmounted(() => {
  window.removeEventListener('app-save', handleAppSave)
})
</script>

<template>
  <AppLayout />
  <FullTaskStack />
  <ConfirmDialog
    v-if="uiStore.confirmDialog.visible"
    :title="uiStore.confirmDialog.title"
    :message="uiStore.confirmDialog.message"
    @confirm="uiStore.confirmDialog.onConfirm"
    @cancel="uiStore.hideConfirm"
  />
  <KeyHintBar />
</template>

<style scoped>
</style>
