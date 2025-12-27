<script setup lang="ts">
import { computed, ref } from 'vue'
import { useFocusStore } from '@/stores/focusStore'

const focusStore = useFocusStore()
const showHelp = ref(false)

// 检测 Mac 平台
const isMac = navigator.platform.includes('Mac')
const cmdKey = isMac ? '⌘' : 'Ctrl+'

interface HintItem {
  key: string
  label: string
  priority: 'primary' | 'secondary' | 'muted'
}

interface HintGroup {
  title: string
  hints: HintItem[]
}

// 当前上下文的快捷键提示
const hints = computed((): HintItem[] => {
  const path = focusStore.currentPath

  // 对话框模式
  if (path.startsWith('dialog.')) {
    return [
      { key: 'Enter', label: '确认', priority: 'primary' },
      { key: 'Esc', label: '取消', priority: 'secondary' },
    ]
  }

  // 完整任务模式
  if (path.startsWith('fullTask.')) {
    if (path.includes('.editor.')) {
      return [
        { key: `${cmdKey}S`, label: '保存关闭', priority: 'primary' },
        { key: 'Esc', label: '返回', priority: 'secondary' },
        { key: 'Tab', label: '下一字段', priority: 'muted' },
      ]
    }
    if (path.includes('.meta.')) {
      return [
        { key: 'Enter', label: '选择', priority: 'primary' },
        { key: 'Tab', label: '下一项', priority: 'secondary' },
        { key: 'Esc', label: '返回', priority: 'muted' },
      ]
    }
    return [
      { key: `${cmdKey}S`, label: '保存关闭', priority: 'primary' },
      { key: 'Esc', label: '取消', priority: 'secondary' },
      { key: '↑↓', label: '切换区域', priority: 'muted' },
    ]
  }

  // 搜索模式
  if (path.startsWith('search.')) {
    return [
      { key: 'Enter', label: '打开', priority: 'primary' },
      { key: '↑↓', label: '选择', priority: 'secondary' },
      { key: 'Esc', label: '关闭', priority: 'muted' },
    ]
  }

  // 侧边栏模式
  if (path.includes('.sidebar')) {
    return [
      { key: 'Enter', label: '切换项目', priority: 'primary' },
      { key: '→', label: '进入看板', priority: 'secondary' },
      { key: '↑↓', label: '导航', priority: 'muted' },
      { key: '?', label: '帮助', priority: 'muted' },
    ]
  }

  // 默认看板模式
  return [
    { key: 'Enter', label: '编辑', priority: 'primary' },
    { key: `${cmdKey}←→`, label: '移动', priority: 'primary' },
    { key: 'hjkl', label: '导航', priority: 'secondary' },
    { key: `${cmdKey}F`, label: '搜索', priority: 'muted' },
    { key: '?', label: '帮助', priority: 'muted' },
  ]
})

// 完整快捷键帮助
const helpGroups = computed((): HintGroup[] => [
  {
    title: '导航',
    hints: [
      { key: 'h / ←', label: '向左', priority: 'secondary' },
      { key: 'j / ↓', label: '向下', priority: 'secondary' },
      { key: 'k / ↑', label: '向上', priority: 'secondary' },
      { key: 'l / →', label: '向右', priority: 'secondary' },
      { key: 'Tab', label: '下一列', priority: 'muted' },
      { key: 'Shift+Tab', label: '上一列', priority: 'muted' },
    ],
  },
  {
    title: '任务操作',
    hints: [
      { key: 'Enter / Space', label: '编辑任务', priority: 'primary' },
      { key: `${cmdKey}← / ${cmdKey}H`, label: '移到前一列', priority: 'primary' },
      { key: `${cmdKey}→ / ${cmdKey}L`, label: '移到后一列', priority: 'primary' },
      { key: 'Del / ⌫', label: '删除任务', priority: 'secondary' },
    ],
  },
  {
    title: '全局',
    hints: [
      { key: `${cmdKey}S`, label: '保存', priority: 'primary' },
      { key: `${cmdKey}F`, label: '搜索', priority: 'primary' },
      { key: 'Esc', label: '返回 / 关闭', priority: 'secondary' },
      { key: '?', label: '显示帮助', priority: 'muted' },
    ],
  },
])

function toggleHelp() {
  showHelp.value = !showHelp.value
}

function closeHelp() {
  showHelp.value = false
}

// 监听 ? 键打开帮助
function handleKeydown(e: KeyboardEvent) {
  if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    // 只在非输入状态响应
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
      e.preventDefault()
      toggleHelp()
    }
  }
  if (e.key === 'Escape' && showHelp.value) {
    e.preventDefault()
    closeHelp()
  }
}

// 在组件挂载时添加事件监听
import { onMounted, onUnmounted } from 'vue'
onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- 快捷键提示栏 -->
  <div class="key-hint-bar">
    <div
      v-for="hint in hints"
      :key="hint.key"
      class="hint-item"
      :class="`priority-${hint.priority}`"
    >
      <kbd>{{ hint.key }}</kbd>
      <span>{{ hint.label }}</span>
    </div>
  </div>

  <!-- 快捷键帮助面板 -->
  <Teleport to="body">
    <div v-if="showHelp" class="help-overlay" @click="closeHelp">
      <div class="help-panel" @click.stop>
        <div class="help-header">
          <h2>快捷键参考</h2>
          <button class="close-btn" @click="closeHelp">×</button>
        </div>
        <div class="help-content">
          <div
            v-for="group in helpGroups"
            :key="group.title"
            class="help-group"
          >
            <h3>{{ group.title }}</h3>
            <div class="help-list">
              <div
                v-for="hint in group.hints"
                :key="hint.key"
                class="help-item"
                :class="`priority-${hint.priority}`"
              >
                <kbd>{{ hint.key }}</kbd>
                <span>{{ hint.label }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="help-footer">
          <span class="hint-text">按 <kbd>Esc</kbd> 或点击外部关闭</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* 底部快捷键提示栏 */
.key-hint-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-tertiary);
  border-top: 1px solid var(--border-color);
  padding: var(--spacing-xs) var(--spacing-lg);
  display: flex;
  gap: var(--spacing-lg);
  font-size: 0.75rem;
  z-index: 50;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 优先级样式 */
.hint-item.priority-primary {
  color: var(--text-accent);
}

.hint-item.priority-primary kbd {
  background: rgba(74, 222, 128, 0.15);
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.hint-item.priority-secondary {
  color: var(--text-secondary);
}

.hint-item.priority-secondary kbd {
  background: var(--bg-secondary);
  border-color: var(--border-color);
}

.hint-item.priority-muted {
  color: var(--text-muted);
}

.hint-item.priority-muted kbd {
  background: transparent;
  border-color: var(--border-color);
  opacity: 0.7;
}

.hint-item kbd {
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid;
  font-family: var(--font-mono);
}

/* 帮助面板遮罩 */
.help-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

/* 帮助面板 */
.help-panel {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
}

.help-header h2 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 500;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.help-content {
  padding: var(--spacing-md) var(--spacing-lg);
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-lg);
}

.help-group h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  font-weight: 500;
}

.help-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.help-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.help-item.priority-primary {
  background: rgba(74, 222, 128, 0.08);
}

.help-item kbd {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

.help-item.priority-primary kbd {
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.help-item span {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.help-footer {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.hint-text kbd {
  font-size: 0.65rem;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  font-family: var(--font-mono);
}
</style>
