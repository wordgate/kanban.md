<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useUIStore } from '@/stores'
import { useFocusStore } from '@/stores/focusStore'
import { useSearch } from '@/composables'

const uiStore = useUIStore()
const focusStore = useFocusStore()
const { suggestions, applySuggestion } = useSearch()

const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)

// 使用新焦点系统判断搜索是否聚焦
const isSearchFocused = computed(() => focusStore.currentPath.startsWith('search.'))

const showDropdown = computed(() =>
  isSearchFocused.value && suggestions.value.length > 0
)

// 监听搜索焦点状态
watch(isSearchFocused, async (focused) => {
  if (focused) {
    await nextTick()
    inputRef.value?.focus()
  }
})

function handleKeyDown(event: KeyboardEvent) {
  if (!showDropdown.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, suggestions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const suggestion = suggestions.value[selectedIndex.value]
    if (suggestion) {
      applySuggestion(suggestion)
      selectedIndex.value = 0
    }
  }
}

function handleFocus() {
  if (!isSearchFocused.value) {
    focusStore.setPath('search.input')
  }
}

function handleBlur() {
  // 延迟关闭以允许点击建议
  setTimeout(() => {
    if (isSearchFocused.value) {
      focusStore.popLayer()
    }
  }, 150)
}

function selectSuggestion(index: number) {
  const suggestion = suggestions.value[index]
  if (suggestion) {
    applySuggestion(suggestion)
    selectedIndex.value = 0
  }
}

function removeFilter(index: number) {
  uiStore.activeFilters.splice(index, 1)
}
</script>

<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <span class="search-icon">🔍</span>
      <input
        ref="inputRef"
        v-model="uiStore.searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索... (⌘F)"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeyDown"
      />
    </div>

    <!-- 活跃过滤器 -->
    <div v-if="uiStore.activeFilters.length > 0" class="active-filters">
      <span
        v-for="(filter, index) in uiStore.activeFilters"
        :key="`${filter.type}-${filter.value}`"
        class="filter-tag"
        :class="filter.type"
      >
        {{ filter.type === 'tag' ? '#' : '' }}{{ filter.value }}
        <button class="remove-filter" @click="removeFilter(index)">×</button>
      </span>
      <button class="clear-filters" @click="uiStore.clearFilters">清除</button>
    </div>

    <!-- 搜索建议下拉 -->
    <div v-if="showDropdown" class="search-dropdown">
      <div
        v-for="(suggestion, index) in suggestions"
        :key="`${suggestion.type}-${suggestion.value}`"
        class="dropdown-item"
        :class="{ active: index === selectedIndex }"
        @click="selectSuggestion(index)"
        @mouseenter="selectedIndex = index"
      >
        <span class="suggestion-type">{{ suggestion.type }}</span>
        <span class="suggestion-display">{{ suggestion.display }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0 var(--spacing-sm);
}

.search-icon {
  font-size: 0.85rem;
  opacity: 0.6;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: var(--spacing-sm) 0;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  box-shadow: none;
}

.search-input-wrapper:focus-within {
  border-color: var(--border-focus);
  box-shadow: var(--focus-glow);
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-top: var(--spacing-sm);
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.filter-tag.tag { color: var(--color-info); }
.filter-tag.category { color: var(--color-warning); }
.filter-tag.user { color: var(--color-success); }
.filter-tag.priority { color: var(--color-error); }

.remove-filter {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
  opacity: 0.6;
}

.remove-filter:hover {
  opacity: 1;
}

.clear-filters {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.75rem;
  padding: 2px 4px;
}

.clear-filters:hover {
  color: var(--text-secondary);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  margin-top: 4px;
  max-height: 240px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
}

.dropdown-item:hover,
.dropdown-item.active {
  background: var(--bg-hover);
}

.suggestion-type {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-muted);
  min-width: 60px;
}

.suggestion-display {
  color: var(--text-primary);
  font-size: 0.9rem;
}
</style>
