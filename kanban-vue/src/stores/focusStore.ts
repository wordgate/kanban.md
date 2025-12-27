/**
 * Focus Store
 *
 * Single source of truth for focus state.
 * Replaces scattered focus state (focusedColumnIndex, focusedTaskIndex, etc.)
 * with a unified semantic path system.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FocusPath, ParsedFocusPath } from '@/focus/types'
import { parsePath, matchPath } from '@/focus/pathUtils'

export const useFocusStore = defineStore('focus', () => {
  /**
   * The single source of truth for focus state
   *
   * This replaces:
   *   - uiStore.focusMode
   *   - uiStore.focusedColumnIndex
   *   - uiStore.focusedTaskIndex
   *   - All component-local focusIndex states
   */
  const currentPath = ref<FocusPath>('kanban.board.todo.new-task')

  /**
   * Stack of paths for modal layers
   * When opening a fullTask, we push the current path
   * When closing, we pop and restore
   */
  const pathStack = ref<FocusPath[]>([])

  /**
   * Parsed version of current path for easy access
   */
  const parsed = computed((): ParsedFocusPath => {
    return parsePath(currentPath.value)
  })

  /**
   * Current layer (for quick checks)
   */
  const layer = computed(() => parsed.value.layer)

  /**
   * Whether we're in kanban mode
   */
  const isKanban = computed(() => layer.value === 'kanban')

  /**
   * Whether we're in fullTask mode
   */
  const isFullTask = computed(() => layer.value === 'fullTask')

  /**
   * Whether we're in dialog mode
   */
  const isDialog = computed(() => layer.value === 'dialog')

  /**
   * Whether we're in search mode
   */
  const isSearch = computed(() => layer.value === 'search')

  /**
   * Whether we're in sidebar
   */
  const isSidebar = computed(() =>
    isKanban.value && parsed.value.area === 'sidebar'
  )

  /**
   * Whether we're on the board
   */
  const isBoard = computed(() =>
    isKanban.value && parsed.value.area === 'board'
  )

  /**
   * Current fullTask stack index (if in fullTask mode)
   */
  const fullTaskStackIndex = computed(() => {
    if (!isFullTask.value) return -1
    return parsed.value.stackIndex ?? 0
  })

  /**
   * The focused item id from current path
   */
  const focusedItem = computed(() => parsed.value.item)

  /**
   * The focused container from current path
   */
  const focusedContainer = computed(() => parsed.value.container)

  /**
   * The focused area from current path
   */
  const focusedArea = computed(() => parsed.value.area)

  /**
   * Set focus to a new path
   */
  function setPath(path: FocusPath) {
    currentPath.value = path
  }

  /**
   * Push current path to stack and switch to new layer
   * Used when opening modals/dialogs
   */
  function pushLayer(newPath: FocusPath) {
    pathStack.value.push(currentPath.value)
    currentPath.value = newPath
  }

  /**
   * Pop from stack and restore previous path
   * Used when closing modals/dialogs
   */
  function popLayer(): FocusPath | null {
    const previousPath = pathStack.value.pop()
    if (previousPath) {
      currentPath.value = previousPath
      return previousPath
    }
    // Default fallback if stack is empty
    currentPath.value = 'kanban.board.todo.new-task'
    return null
  }

  /**
   * Check if a given path matches the current focus
   * Supports wildcards: "kanban.board.*" matches any column
   */
  function matches(pattern: string): boolean {
    return matchPath(currentPath.value, pattern)
  }

  /**
   * Check if a specific item is focused
   */
  function isItemFocused(pathPattern: string, itemId: string): boolean {
    return matches(pathPattern) && focusedItem.value === itemId
  }

  /**
   * Reset to initial state
   */
  function reset() {
    currentPath.value = 'kanban.board.todo.new-task'
    pathStack.value = []
  }

  /**
   * Initialize focus path based on available columns
   * Call this after config is loaded
   */
  function initializeWithColumn(columnId: string) {
    currentPath.value = `kanban.board.${columnId}.new-task`
  }

  /**
   * Get stack depth (number of modal layers open)
   */
  const stackDepth = computed(() => pathStack.value.length)

  return {
    // State
    currentPath,
    pathStack,
    parsed,

    // Computed - Layer checks
    layer,
    isKanban,
    isFullTask,
    isDialog,
    isSearch,
    isSidebar,
    isBoard,

    // Computed - Focus details
    fullTaskStackIndex,
    focusedItem,
    focusedContainer,
    focusedArea,
    stackDepth,

    // Actions
    setPath,
    pushLayer,
    popLayer,
    matches,
    isItemFocused,
    reset,
    initializeWithColumn,
  }
})
