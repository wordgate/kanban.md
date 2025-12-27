/**
 * Focus Binding Composable
 *
 * Provides reactive focus state for components.
 * Components use this to determine if they or their items are focused,
 * without needing to handle keyboard events themselves.
 */

import { computed } from 'vue'
import { useFocusStore } from '@/stores/focusStore'
import { matchPath } from '@/focus/pathUtils'

/**
 * Bind component to focus state
 *
 * @param pathPattern - Pattern to match (e.g., "kanban.board.todo.*")
 *
 * @example
 * // In a KanbanColumn component
 * const { isFocused, focusedItem, isItemFocused } = useFocusBinding('kanban.board.todo.*')
 *
 * // Check if this column is focused
 * <div :class="{ focused: isFocused }">
 *
 * // Check if a specific task is focused
 * <TaskCard :is-focused="isItemFocused('task-001')" />
 */
export function useFocusBinding(pathPattern: string) {
  const focusStore = useFocusStore()

  /**
   * Whether this component's area is focused
   */
  const isFocused = computed(() => {
    return matchPath(focusStore.currentPath, pathPattern)
  })

  /**
   * The specific item focused within this component
   * Returns undefined if not focused or no item specified
   */
  const focusedItem = computed(() => {
    if (!isFocused.value) return undefined
    return focusStore.focusedItem
  })

  /**
   * Check if a specific item is focused
   *
   * @param itemId - The item identifier (e.g., "task-001", "new-task")
   */
  function isItemFocused(itemId: string): boolean {
    return isFocused.value && focusStore.focusedItem === itemId
  }

  /**
   * The focused container (for board: column id)
   */
  const focusedContainer = computed(() => {
    if (!isFocused.value) return undefined
    return focusStore.focusedContainer
  })

  return {
    isFocused,
    focusedItem,
    focusedContainer,
    isItemFocused,
  }
}

/**
 * Bind to a specific focus path (exact match)
 *
 * @param exactPath - Exact path to match
 *
 * @example
 * const { isFocused } = useExactFocusBinding('kanban.sidebar')
 */
export function useExactFocusBinding(exactPath: string) {
  const focusStore = useFocusStore()

  const isFocused = computed(() => {
    return focusStore.currentPath === exactPath ||
           focusStore.currentPath.startsWith(exactPath + '.')
  })

  return {
    isFocused,
  }
}

/**
 * Get focus state for fullTask panel
 *
 * @param stackIndex - The fullTask stack index
 * @param panel - The panel ('meta' | 'editor' | 'subtasks')
 *
 * @example
 * const { isFocused, focusedItem } = useFullTaskPanelFocus(0, 'meta')
 */
export function useFullTaskPanelFocus(
  stackIndex: number,
  panel: 'meta' | 'editor' | 'subtasks'
) {
  const focusStore = useFocusStore()
  const pattern = `fullTask.${stackIndex}.${panel}`

  const isFocused = computed(() => {
    return matchPath(focusStore.currentPath, pattern + '.*') ||
           focusStore.currentPath === pattern
  })

  const focusedItem = computed(() => {
    if (!isFocused.value) return undefined
    return focusStore.focusedItem
  })

  function isItemFocused(itemId: string): boolean {
    return isFocused.value && focusStore.focusedItem === itemId
  }

  return {
    isFocused,
    focusedItem,
    isItemFocused,
  }
}
