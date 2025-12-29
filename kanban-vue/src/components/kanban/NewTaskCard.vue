<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps<{
  isFocused: boolean
}>()

const emit = defineEmits<{
  create: []
}>()

// Reference to card element for auto-scroll
const cardRef = ref<HTMLElement | null>(null)

// Auto-scroll into view when focused
watch(() => props.isFocused, (focused) => {
  if (focused && cardRef.value) {
    nextTick(() => {
      cardRef.value?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    })
  }
})

function handleClick() {
  emit('create')
}
</script>

<template>
  <div
    ref="cardRef"
    class="new-task-card"
    :class="{ focused: isFocused }"
    @click="handleClick"
  >
    <span class="plus-icon">+</span>
    <span class="hint-text">创建任务</span>
    <span v-if="isFocused" class="key-hint"><kbd>Enter</kbd></span>
  </div>
</template>

<style scoped>
.new-task-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  color: var(--text-muted);
}

.new-task-card:hover {
  background: var(--bg-hover);
  border-color: var(--text-accent);
  color: var(--text-accent);
}

.new-task-card.focused {
  border-color: var(--border-focus);
  border-style: solid;
  box-shadow: var(--focus-ring), var(--focus-glow);
  color: var(--text-accent);
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: 300;
}

.hint-text {
  font-size: 0.9rem;
}

.key-hint {
  margin-left: auto;
}

.key-hint kbd {
  font-size: 0.7rem;
  padding: 2px 6px;
}
</style>
