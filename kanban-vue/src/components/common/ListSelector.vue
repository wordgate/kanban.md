<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useListNavigation, type ListItem } from '@/composables/useListNavigation'

const props = withDefaults(defineProps<{
  /** 列表项 */
  items: ListItem<string>[]
  /** 选择模式 */
  mode?: 'radio' | 'checkbox'
  /** 当前选中值 */
  modelValue: string | string[] | null
  /** 是否显示标签 */
  label?: string
  /** 是否激活键盘导航 */
  active?: boolean
  /** 外部焦点索引（用于同步） */
  focusIndex?: number
}>(), {
  mode: 'radio',
  active: false,
  focusIndex: -1,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | null]
  'update:focusIndex': [index: number]
  navigate: [index: number]
}>()

// 内部 modelValue ref
const internalValue = ref(props.modelValue)
watch(() => props.modelValue, (v) => { internalValue.value = v })
watch(internalValue, (v) => { emit('update:modelValue', v) })

// 转换为 computed
const itemsRef = computed(() => props.items)

// 使用导航 composable
const nav = useListNavigation({
  items: itemsRef,
  mode: props.mode,
  modelValue: internalValue,
  loop: true,
  enabled: computed(() => props.active),
  onSelect: (value) => {
    emit('update:modelValue', value)
  },
  onNavigate: (index) => {
    emit('update:focusIndex', index)
    emit('navigate', index)
  },
})

// 同步外部焦点索引
watch(() => props.focusIndex, (index) => {
  if (index >= 0 && index !== nav.focusIndex.value) {
    nav.setFocusIndex(index)
  }
})

// 键盘事件处理
function handleKeyDown(event: KeyboardEvent) {
  if (!props.active) return
  nav.handleKeyDown(event)
}

onMounted(() => {
  if (props.active) {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

watch(() => props.active, (active) => {
  if (active) {
    window.addEventListener('keydown', handleKeyDown)
  } else {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

// 暴露给父组件
defineExpose({
  focusIndex: nav.focusIndex,
  move: nav.move,
  toggle: nav.toggle,
  setFocusIndex: nav.setFocusIndex,
})
</script>

<template>
  <div class="list-selector" :class="{ active }">
    <div v-if="label" class="list-label">{{ label }}</div>
    <div class="list-items">
      <button
        v-for="(item, index) in items"
        :key="item.id"
        class="list-item"
        :class="{
          selected: nav.isSelected(item),
          focused: active && nav.focusIndex.value === index,
          disabled: item.disabled,
        }"
        :disabled="item.disabled"
        @click="nav.select(item)"
      >
        <span v-if="mode === 'checkbox'" class="checkbox">
          {{ nav.isSelected(item) ? '☑' : '☐' }}
        </span>
        <span v-else-if="mode === 'radio'" class="radio">
          {{ nav.isSelected(item) ? '●' : '○' }}
        </span>
        <span class="item-label">{{ item.value }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.list-selector {
  display: flex;
  flex-direction: column;
}

.list-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--spacing-sm);
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
}

.list-item:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.list-item.focused {
  border-color: var(--border-focus);
  background: rgba(74, 222, 128, 0.1);
}

.list-item.selected {
  color: var(--text-accent);
}

.list-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox,
.radio {
  font-size: 0.9rem;
  color: inherit;
}

.item-label {
  flex: 1;
}
</style>
