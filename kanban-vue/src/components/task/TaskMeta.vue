<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useConfigStore } from '@/stores'
import { useFocusStore } from '@/stores/focusStore'
import type { Task } from '@/types'

const props = defineProps<{
  task: Task
  stackIndex: number
  active: boolean
  parentTitle?: string
}>()

// 元素引用，用于滚动
const itemRefs = new Map<number, HTMLElement>()

const emit = defineEmits<{
  update: [data: Partial<Task>]
}>()

const configStore = useConfigStore()
const focusStore = useFocusStore()

// 定义所有可选项的扁平列表
interface MetaItem {
  id: string
  section: 'priority' | 'category' | 'assignee' | 'tag' | 'date'
  mode: 'radio' | 'checkbox' | 'input'
  label: string
  value: string
  icon?: string
}

// 生成扁平化列表
const flatItems = computed<MetaItem[]>(() => {
  const items: MetaItem[] = []

  // 优先级 (radio)
  configStore.priorities.forEach(p => {
    items.push({
      id: `priority-${p.value}`,
      section: 'priority',
      mode: 'radio',
      label: `${p.icon} ${p.name}`,
      value: p.value,
      icon: p.icon,
    })
  })

  // 分类 (radio)
  configStore.categories.forEach(cat => {
    items.push({
      id: `category-${cat}`,
      section: 'category',
      mode: 'radio',
      label: cat,
      value: cat,
    })
  })

  // 分配给 (checkbox)
  configStore.users.forEach(user => {
    items.push({
      id: `assignee-${user.id}`,
      section: 'assignee',
      mode: 'checkbox',
      label: user.displayName || user.id,
      value: user.id,
    })
  })

  // 标签 (checkbox)
  configStore.tags.forEach(tag => {
    items.push({
      id: `tag-${tag}`,
      section: 'tag',
      mode: 'checkbox',
      label: `#${tag}`,
      value: tag,
    })
  })

  // 日期字段 (input)
  const dateFields = [
    { id: 'date-created', label: '创建日期', value: 'created' },
    { id: 'date-started', label: '开始日期', value: 'started' },
    { id: 'date-due', label: '截止日期', value: 'due' },
    { id: 'date-completed', label: '完成日期', value: 'completed' },
  ]
  dateFields.forEach(d => {
    items.push({
      id: d.id,
      section: 'date',
      mode: 'input',
      label: d.label,
      value: d.value,
    })
  })

  return items
})

// 从 focusStore 获取当前焦点索引
const focusedIndex = computed(() => {
  if (!props.active) return -1
  const path = focusStore.currentPath
  // Path format: fullTask.{stackIndex}.meta.{itemIndex}
  const prefix = `fullTask.${props.stackIndex}.meta.`
  if (path.startsWith(prefix)) {
    const itemPart = path.slice(prefix.length)
    const index = parseInt(itemPart, 10)
    return isNaN(index) ? -1 : index
  }
  return -1
})

// 检查项是否选中
function isSelected(item: MetaItem): boolean {
  switch (item.section) {
    case 'priority':
      return props.task.priority.toLowerCase().includes(item.value)
    case 'category':
      return props.task.category === item.value
    case 'assignee':
      return props.task.assignees.includes(item.value)
    case 'tag':
      return props.task.tags.includes(item.value)
    default:
      return false
  }
}

// 切换选中状态
function toggleItem(item: MetaItem): void {
  switch (item.section) {
    case 'priority': {
      const priority = configStore.priorities.find(p => p.value === item.value)
      if (priority) {
        emit('update', { priority: `${priority.icon} ${priority.name}` })
      }
      break
    }
    case 'category':
      emit('update', { category: item.value })
      break
    case 'assignee': {
      const assignees = [...props.task.assignees]
      const index = assignees.indexOf(item.value)
      if (index === -1) {
        assignees.push(item.value)
      } else {
        assignees.splice(index, 1)
      }
      emit('update', { assignees })
      break
    }
    case 'tag': {
      const tags = [...props.task.tags]
      const index = tags.indexOf(item.value)
      if (index === -1) {
        tags.push(item.value)
      } else {
        tags.splice(index, 1)
      }
      emit('update', { tags })
      break
    }
  }
}

// 更新日期
function updateDate(field: string, value: string): void {
  emit('update', { [field]: value })
}

// 日期输入框引用
const dateInputRefs = new Map<string, HTMLInputElement>()

function setDateInputRef(fieldValue: string, el: HTMLInputElement | null) {
  if (el) {
    dateInputRefs.set(fieldValue, el)
  } else {
    dateInputRefs.delete(fieldValue)
  }
}

// 监听 meta-item-select 事件
function handleMetaSelect(event: CustomEvent<{ index: number }>) {
  const index = event.detail.index
  const item = flatItems.value[index]
  if (item) {
    if (item.mode !== 'input') {
      toggleItem(item)
    } else if (item.section === 'date') {
      // 日期字段：聚焦并打开选择器
      nextTick(() => {
        const input = dateInputRefs.get(item.value)
        if (input) {
          input.focus()
          // 尝试打开日期选择器
          if (typeof input.showPicker === 'function') {
            try {
              input.showPicker()
            } catch {
              // 某些浏览器可能不支持或需要用户交互
            }
          }
        }
      })
    }
  }
}

onMounted(() => {
  window.addEventListener('meta-item-select', handleMetaSelect as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('meta-item-select', handleMetaSelect as EventListener)
})

// 按 section 分组用于渲染
const sectionLabels: Record<string, string> = {
  priority: '优先级',
  category: '分类',
  assignee: '分配给',
  tag: '标签',
  date: '日期',
}

// 获取某个 section 的开始索引
function getSectionStartIndex(section: string): number {
  return flatItems.value.findIndex(item => item.section === section)
}

// 设置元素引用
function setItemRef(index: number, el: HTMLElement | null) {
  if (el) {
    itemRefs.set(index, el)
  } else {
    itemRefs.delete(index)
  }
}

// 当焦点索引变化时，滚动到可见区域
watch(focusedIndex, (index) => {
  if (index >= 0) {
    nextTick(() => {
      const el = itemRefs.get(index)
      if (el) {
        el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }
})
</script>

<template>
  <div class="task-meta">
    <!-- 父任务面包屑 -->
    <div v-if="parentTitle" class="parent-breadcrumb">
      <span class="parent-title">{{ parentTitle }}</span>
      <span class="breadcrumb-separator">›</span>
    </div>

    <!-- 优先级 -->
    <div class="meta-section">
      <div class="meta-label">{{ sectionLabels.priority }}</div>
      <div class="meta-options">
        <button
          v-for="(item, idx) in flatItems.filter(i => i.section === 'priority')"
          :key="item.id"
          :ref="(el) => setItemRef(getSectionStartIndex('priority') + idx, el as HTMLElement)"
          class="option-btn"
          :class="{
            active: isSelected(item),
            focused: focusedIndex === getSectionStartIndex('priority') + idx
          }"
          @click="toggleItem(item)"
        >
          <span class="radio">{{ isSelected(item) ? '●' : '○' }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <!-- 分类 -->
    <div class="meta-section">
      <div class="meta-label">{{ sectionLabels.category }}</div>
      <div class="meta-options">
        <button
          v-for="(item, idx) in flatItems.filter(i => i.section === 'category')"
          :key="item.id"
          :ref="(el) => setItemRef(getSectionStartIndex('category') + idx, el as HTMLElement)"
          class="option-btn"
          :class="{
            active: isSelected(item),
            focused: focusedIndex === getSectionStartIndex('category') + idx
          }"
          @click="toggleItem(item)"
        >
          <span class="radio">{{ isSelected(item) ? '●' : '○' }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <!-- 分配给 -->
    <div class="meta-section">
      <div class="meta-label">{{ sectionLabels.assignee }}</div>
      <div class="meta-options">
        <button
          v-for="(item, idx) in flatItems.filter(i => i.section === 'assignee')"
          :key="item.id"
          :ref="(el) => setItemRef(getSectionStartIndex('assignee') + idx, el as HTMLElement)"
          class="option-btn"
          :class="{
            active: isSelected(item),
            focused: focusedIndex === getSectionStartIndex('assignee') + idx
          }"
          @click="toggleItem(item)"
        >
          <span class="checkbox">{{ isSelected(item) ? '☑' : '☐' }}</span>
          <span>{{ item.label }}</span>
        </button>
        <span v-if="configStore.users.length === 0" class="empty-hint">暂无用户</span>
      </div>
    </div>

    <!-- 标签 -->
    <div class="meta-section">
      <div class="meta-label">{{ sectionLabels.tag }}</div>
      <div class="meta-options">
        <button
          v-for="(item, idx) in flatItems.filter(i => i.section === 'tag')"
          :key="item.id"
          :ref="(el) => setItemRef(getSectionStartIndex('tag') + idx, el as HTMLElement)"
          class="option-btn tag"
          :class="{
            active: isSelected(item),
            focused: focusedIndex === getSectionStartIndex('tag') + idx
          }"
          @click="toggleItem(item)"
        >
          <span class="checkbox">{{ isSelected(item) ? '☑' : '☐' }}</span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <!-- 日期 -->
    <div class="meta-section">
      <div class="meta-label">{{ sectionLabels.date }}</div>
      <div class="date-fields">
        <div
          v-for="(item, idx) in flatItems.filter(i => i.section === 'date')"
          :key="item.id"
          :ref="(el) => setItemRef(getSectionStartIndex('date') + idx, el as HTMLElement)"
          class="date-field"
          :class="{ focused: focusedIndex === getSectionStartIndex('date') + idx }"
        >
          <label>{{ item.label.replace('日期', '') }}</label>
          <input
            :ref="(el) => setDateInputRef(item.value, el as HTMLInputElement)"
            type="date"
            :value="(task as any)[item.value]"
            @input="updateDate(item.value, ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-meta {
  padding: var(--spacing-md);
  overflow-y: auto;
}

.parent-breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.parent-title {
  color: var(--text-muted);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-separator {
  color: var(--text-muted);
}

.meta-section {
  margin-bottom: var(--spacing-lg);
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
}

.meta-options {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.option-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.option-btn.focused {
  border-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.1);
}

.option-btn.active {
  color: var(--text-accent);
}

.option-btn.tag {
  color: var(--color-info);
}

.option-btn.tag.active {
  color: var(--text-accent);
}

.radio,
.checkbox {
  font-size: 0.9rem;
  width: 16px;
  text-align: center;
}

.empty-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: var(--spacing-xs);
}

.date-fields {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--spacing-xs);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  transition: all 0.15s;
}

.date-field.focused {
  border-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.1);
}

.date-field label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.date-field input {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.85rem;
  background: var(--bg-tertiary);
}
</style>
