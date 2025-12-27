<script setup lang="ts">
import { useProjectStore } from '@/stores'
import { useFocusBinding } from '@/composables/useFocusBinding'
import { useProjectData } from '@/composables/useProjectData'
import { projectIdToPathItem } from '@/focus/pathUtils'

const projectStore = useProjectStore()
const { switchProject, loadProject } = useProjectData()

// 使用新的焦点绑定
const { isFocused: sidebarIsFocused, focusedItem } = useFocusBinding('kanban.sidebar.*')

// 检查特定项目是否聚焦
function isProjectFocused(projectId: string): boolean {
  if (!sidebarIsFocused.value) return false
  const pathItem = projectIdToPathItem(projectId)
  return focusedItem.value === pathItem
}

async function handleSelectProject(projectId: string) {
  await switchProject(projectId)
}

async function handleAddProject() {
  const selected = await projectStore.selectFolder()
  if (selected) {
    await loadProject()
  }
}

// 获取项目名称
function getProjectName(projectId: string): string {
  const project = projectStore.projects.find(p => p.id === projectId)
  return project?.name || projectId
}
</script>

<template>
  <div class="project-list">
    <div class="section-header">
      <span class="section-title">项目</span>
      <button class="btn-icon" @click="handleAddProject" title="添加项目">+</button>
    </div>

    <div class="projects">
      <div
        v-for="project in projectStore.projects"
        :key="project.id"
        class="project-item"
        :class="{
          active: project.id === projectStore.currentProjectId,
          focused: isProjectFocused(project.id)
        }"
        @click="handleSelectProject(project.id)"
      >
        <span class="radio">{{ project.id === projectStore.currentProjectId ? '●' : '○' }}</span>
        <span class="project-name">{{ getProjectName(project.id) }}</span>
      </div>

      <div v-if="projectStore.projects.length === 0" class="empty-hint">
        点击 + 添加项目
      </div>
    </div>

    <div v-if="sidebarIsFocused && projectStore.projects.length > 0" class="nav-hints">
      <span><kbd>↑↓</kbd> 导航</span>
      <span><kbd>Space</kbd> 选择</span>
    </div>
  </div>
</template>

<style scoped>
.project-list {
  padding: var(--spacing-md);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.btn-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-accent);
  border-color: var(--text-accent);
}

.projects {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
}

.project-item:hover {
  background: var(--bg-hover);
}

.project-item.active {
  color: var(--text-accent);
}

.project-item.focused {
  border-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.1);
}

.radio {
  font-size: 0.9rem;
  width: 16px;
  text-align: center;
  color: inherit;
}

.project-name {
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: var(--spacing-sm);
}

.nav-hints {
  display: flex;
  gap: var(--spacing-md);
  padding-top: var(--spacing-sm);
  font-size: 0.7rem;
  color: var(--text-muted);
}

.nav-hints kbd {
  font-size: 0.65rem;
  margin-right: 2px;
}
</style>
