<script setup lang="ts">
import { onMounted } from 'vue'
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
const { setupAutoSave, loadProject } = useProjectData()

// 统一键盘处理系统（替代旧的 useKeyboard）
useGlobalKeyboard()

onMounted(async () => {
  // 加载项目列表
  await projectStore.loadProjects()

  // 如果有项目，尝试自动加载第一个
  // 使用 skipPermissionRequest=true 避免在没有用户手势时请求权限
  if (projectStore.projects.length > 0) {
    const result = await projectStore.loadProject(projectStore.projects[0].id, true)
    if (result === 'success') {
      await loadProject()
      // 初始化焦点到第一个列
      if (configStore.columns.length > 0) {
        focusStore.initializeWithColumn(configStore.columns[0].id)
      }
    }
    // 如果 result === 'needs_permission'，WelcomeScreen 会显示授权提示
  }

  // 设置自动保存
  setupAutoSave()
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
