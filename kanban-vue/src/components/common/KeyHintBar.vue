<script setup lang="ts">
import { computed } from 'vue'
import { useFocusStore } from '@/stores/focusStore'

const focusStore = useFocusStore()

interface HintItem {
  key: string
  label: string
}

const hints = computed((): HintItem[] => {
  const path = focusStore.currentPath

  if (path.startsWith('fullTask.')) {
    return [
      { key: '⌘S', label: '保存关闭' },
      { key: 'Esc', label: '取消' },
      { key: '↑↓', label: '切换字段' },
    ]
  }

  if (path.startsWith('search.')) {
    return [
      { key: '↑↓', label: '选择' },
      { key: 'Enter', label: '应用' },
      { key: '⌘F', label: '关闭' },
      { key: '#', label: '标签' },
      { key: '@', label: '用户' },
    ]
  }

  // 默认看板模式
  return [
    { key: 'hjkl', label: '导航' },
    { key: 'Enter', label: '编辑' },
    { key: '⌘←→', label: '移动' },
    { key: 'Tab', label: '切换列' },
    { key: '⌘F', label: '搜索' },
    { key: 'Del', label: '删除' },
  ]
})
</script>

<template>
  <div class="key-hint-bar">
    <div v-for="hint in hints" :key="hint.key" class="hint-item">
      <kbd>{{ hint.key }}</kbd>
      <span>{{ hint.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.key-hint-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-sm) var(--spacing-lg);
  display: flex;
  gap: var(--spacing-lg);
  font-size: 0.8rem;
  z-index: 50;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--text-muted);
}

.hint-item kbd {
  font-size: 0.75rem;
}
</style>
