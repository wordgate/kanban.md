<script setup lang="ts">
import { useProjectStore } from '@/stores'
import { useProjectData } from '@/composables/useProjectData'

const projectStore = useProjectStore()
const { loadProject } = useProjectData()

async function handleAddProject() {
  const selected = await projectStore.selectFolder()
  if (selected) {
    await loadProject()
  }
}
</script>

<template>
  <div class="welcome-screen">
    <div class="welcome-content">
      <div class="welcome-logo">
        <span class="logo-icon">$</span>
        <span class="logo-text">kanban</span>
      </div>

      <h1 class="welcome-title">Markdown 任务看板</h1>
      <p class="welcome-desc">键盘优先的本地任务管理工具</p>

      <button class="welcome-btn" @click="handleAddProject">
        <span>📁</span>
        <span>选择项目文件夹</span>
      </button>

      <div class="welcome-hints">
        <div class="hint-item">
          <kbd>h/j/k/l</kbd> 或 <kbd>方向键</kbd> 导航
        </div>
        <div class="hint-item">
          <kbd>Enter</kbd> 打开任务
        </div>
        <div class="hint-item">
          <kbd>⌘F</kbd> 搜索
        </div>
        <div class="hint-item">
          <kbd>Tab</kbd> 切换列
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
}

.welcome-content {
  text-align: center;
  max-width: 400px;
}

.welcome-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-family: var(--font-mono);
  font-size: 2rem;
  margin-bottom: var(--spacing-lg);
}

.logo-icon {
  color: var(--text-accent);
}

.logo-text {
  color: var(--text-primary);
  font-weight: 600;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.welcome-desc {
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xl);
}

.welcome-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.15s;
}

.welcome-btn:hover {
  background: var(--bg-hover);
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.welcome-hints {
  margin-top: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.hint-item {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.hint-item kbd {
  margin: 0 2px;
}
</style>
