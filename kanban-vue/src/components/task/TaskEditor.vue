<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useFocusStore } from '@/stores/focusStore'
import { useTaskBinding } from '@/composables/useTaskBinding'

const props = defineProps<{
  taskId: string
  stackIndex: number
  active: boolean
}>()

const emit = defineEmits<{
  'title-change': []
}>()

const focusStore = useFocusStore()

// 使用响应式任务绑定 - 直接与 store 同步
const { task, title, description, notes } = useTaskBinding(() => props.taskId)

// 输入框引用
const titleRef = ref<HTMLInputElement | null>(null)
const descRef = ref<HTMLTextAreaElement | null>(null)
const notesRef = ref<HTMLTextAreaElement | null>(null)

// 编辑状态：是否真正聚焦到输入框
const isEditing = ref(false)

// 从 focusStore 获取当前焦点字段
const focusedField = computed(() => {
  if (!props.active) return null
  const path = focusStore.currentPath
  const prefix = `fullTask.${props.stackIndex}.editor.`
  if (path.startsWith(prefix)) {
    return path.slice(prefix.length)
  }
  return null
})

// 监听标题变化，通知父组件
watch(title, (newTitle, oldTitle) => {
  if (newTitle !== oldTitle) {
    emit('title-change')
  }
})

// 进入编辑状态
function enterEditMode() {
  isEditing.value = true
  nextTick(() => {
    const field = focusedField.value
    if (field === 'title') {
      titleRef.value?.focus()
    } else if (field === 'description') {
      descRef.value?.focus()
    } else if (field === 'notes') {
      notesRef.value?.focus()
    }
  })
}

// 退出编辑状态
function exitEditMode() {
  isEditing.value = false
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

// 处理输入框的键盘事件
function handleInputKeydown(event: KeyboardEvent) {
  // Cmd+Enter 或 Ctrl+Enter 退出编辑状态
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    event.stopPropagation()
    exitEditMode()
    return
  }

  // 上下箭头键：退出编辑模式，让全局键盘处理来移动焦点
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault()
    event.stopPropagation()
    exitEditMode()
    const action = event.key === 'ArrowUp' ? 'up' : 'down'
    window.dispatchEvent(new CustomEvent('focus-navigate', { detail: { action } }))
  }

  // Tab 键：移动到下/上一个字段
  if (event.key === 'Tab') {
    event.preventDefault()
    event.stopPropagation()
    exitEditMode()
    const action = event.shiftKey ? 'up' : 'down'
    window.dispatchEvent(new CustomEvent('focus-navigate', { detail: { action } }))
  }
}

// 当用户用鼠标点击 input 时，同步 focusStore 状态
function handleFieldFocus(field: 'title' | 'description' | 'notes') {
  isEditing.value = true
  const newPath = `fullTask.${props.stackIndex}.editor.${field}`
  if (focusStore.currentPath !== newPath) {
    focusStore.setPath(newPath)
  }
}

// 监听 editor-field-focus 事件 (Space/Enter 触发)
function handleFieldSelect() {
  enterEditMode()
}

onMounted(() => {
  window.addEventListener('editor-field-focus', handleFieldSelect)
})

onUnmounted(() => {
  window.removeEventListener('editor-field-focus', handleFieldSelect)
})
</script>

<template>
  <div v-if="task" class="task-editor">
    <!-- 标题 -->
    <div class="editor-field" :class="{ focused: focusedField === 'title' }">
      <label class="field-label">标题</label>
      <input
        ref="titleRef"
        v-model="title"
        type="text"
        class="title-input"
        :class="{ editing: isEditing && focusedField === 'title' }"
        placeholder="任务标题"
        @keydown="handleInputKeydown"
        @focus="handleFieldFocus('title')"
      />
    </div>

    <!-- 描述 -->
    <div class="editor-field" :class="{ focused: focusedField === 'description' }">
      <label class="field-label">描述</label>
      <textarea
        ref="descRef"
        v-model="description"
        class="desc-input"
        :class="{ editing: isEditing && focusedField === 'description' }"
        placeholder="简短描述"
        rows="3"
        @keydown="handleInputKeydown"
        @focus="handleFieldFocus('description')"
      ></textarea>
    </div>

    <!-- 备注 -->
    <div class="editor-field notes-field" :class="{ focused: focusedField === 'notes' }">
      <label class="field-label">备注 (Markdown)</label>
      <textarea
        ref="notesRef"
        v-model="notes"
        class="notes-input"
        :class="{ editing: isEditing && focusedField === 'notes' }"
        placeholder="详细备注，支持 Markdown 格式"
        @keydown="handleInputKeydown"
        @focus="handleFieldFocus('notes')"
      ></textarea>
    </div>
  </div>
</template>

<style scoped>
.task-editor {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.editor-field {
  margin-bottom: var(--spacing-lg);
}

.editor-field.focused {
  position: relative;
}

.editor-field.focused::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--text-accent);
  border-radius: 2px;
}

.field-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
}

.title-input {
  width: 100%;
  font-size: 1.25rem;
  font-weight: 600;
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
}

.title-input:focus,
.title-input.editing {
  border-color: var(--border-focus);
  box-shadow: var(--focus-glow);
}

.desc-input {
  width: 100%;
  padding: var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  resize: none;
  line-height: 1.5;
}

.desc-input:focus,
.desc-input.editing {
  border-color: var(--border-focus);
  box-shadow: var(--focus-glow);
}

.notes-field {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.notes-input {
  flex: 1;
  width: 100%;
  padding: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.9rem;
  line-height: 1.6;
  resize: none;
}

.notes-input:focus,
.notes-input.editing {
  border-color: var(--border-focus);
  box-shadow: var(--focus-glow);
}

.notes-input::placeholder {
  color: var(--text-muted);
}
</style>
