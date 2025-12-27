<script setup lang="ts">
import { ref } from 'vue'

const showColumnManager = ref(false)
</script>

<template>
  <div class="tools-section">
    <div class="section-header">
      <span class="section-title">工具</span>
    </div>

    <div class="tools">
      <button class="tool-btn" @click="showColumnManager = true">
        <span class="tool-icon">⚙</span>
        <span>列管理</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.tools-section {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.section-header {
  margin-bottom: var(--spacing-sm);
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.tools {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: transparent;
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-size: 0.9rem;
}

.tool-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.tool-icon {
  width: 20px;
  text-align: center;
}
</style>
