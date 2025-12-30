<script setup lang="ts">
import ProjectList from './ProjectList.vue'
import SearchBar from '../search/SearchBar.vue'
import ArchivePanel from './ArchivePanel.vue'
import { useExactFocusBinding } from '@/composables/useFocusBinding'

// 使用新的焦点系统
const { isFocused: sidebarIsFocused } = useExactFocusBinding('kanban.sidebar')
</script>

<template>
  <aside class="sidebar" :class="{ focused: sidebarIsFocused }">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">$</span>
        <span class="logo-text">kanban</span>
      </div>
    </div>

    <SearchBar />
    <ProjectList />

    <div class="sidebar-footer">
      <ArchivePanel />
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.15s;
}

.sidebar.focused {
  border-right-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.03);
}

.sidebar-header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-family: var(--font-mono);
  font-size: 1.1rem;
}

.logo-icon {
  color: var(--text-accent);
}

.logo-text {
  color: var(--text-primary);
  font-weight: 600;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid var(--border-color);
}
</style>
