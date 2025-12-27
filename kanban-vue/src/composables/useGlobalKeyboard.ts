/**
 * Global Keyboard Composable
 *
 * This is the ONLY keyboard listener in the application.
 * It converts keyboard events to semantic actions and routes them
 * to the appropriate navigation handler based on focus path.
 *
 * Usage: Call once in App.vue
 */

import { onMounted, onUnmounted } from 'vue'
import { useFocusStore } from '@/stores/focusStore'
import { useConfigStore, useTaskStore, useUIStore, useProjectStore } from '@/stores'
import { eventToAction, isGlobalAction } from '@/focus/keyBindings'
import { navigationHandlers } from '@/focus/handlers'
import type { NavigationContext, Action } from '@/focus/types'

/**
 * Check if event target is an input field
 */
function isInputField(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea') return true
  if (target.isContentEditable) return true

  return false
}

/**
 * Setup the global keyboard handler
 *
 * Call this once in App.vue's setup:
 * ```
 * import { useGlobalKeyboard } from '@/composables/useGlobalKeyboard'
 * useGlobalKeyboard()
 * ```
 */
export function useGlobalKeyboard() {
  const focusStore = useFocusStore()
  const configStore = useConfigStore()
  const taskStore = useTaskStore()
  const uiStore = useUIStore()
  const projectStore = useProjectStore()

  /**
   * Build navigation context for handlers
   */
  function buildContext(): NavigationContext {
    return {
      currentPath: focusStore.currentPath,
      parsed: focusStore.parsed,
      stores: {
        config: configStore,
        task: taskStore,
        ui: uiStore,
        project: projectStore,
      },
      focus: {
        setPath: focusStore.setPath,
        pushLayer: focusStore.pushLayer,
        popLayer: focusStore.popLayer,
      },
    }
  }

  /**
   * Find handler that matches current focus path
   */
  function findHandler(path: string) {
    for (const handler of navigationHandlers) {
      if (typeof handler.pattern === 'string') {
        if (path.startsWith(handler.pattern)) {
          return handler
        }
      } else {
        if (handler.pattern.test(path)) {
          return handler
        }
      }
    }
    return null
  }

  /**
   * Handle a keyboard action
   */
  async function handleAction(action: Action) {
    const context = buildContext()
    const handler = findHandler(context.currentPath)

    if (!handler) {
      console.debug(`[Focus] No handler for path: ${context.currentPath}`)
      return false
    }

    const result = handler.handle(context.parsed, action, context)

    if (!result) {
      return false
    }

    if (result.handled) {
      // Update focus path if provided
      if (result.newPath) {
        focusStore.setPath(result.newPath)
      }

      // Execute side effect if provided
      if (result.effect) {
        await result.effect()
      }

      return true
    }

    return false
  }

  /**
   * Check if action should be allowed in input field based on current context
   */
  function shouldAllowInInput(action: Action, event: KeyboardEvent): boolean {
    // Always allow global actions (back, save, search)
    if (isGlobalAction(action)) return true

    // In fullTask.editor context, allow Tab navigation
    const path = focusStore.currentPath
    if (path.includes('.editor.')) {
      // Tab and Shift+Tab for field navigation
      if (event.key === 'Tab') return true
    }

    // In fullTask.meta context, allow Tab navigation
    if (path.includes('.meta.')) {
      if (event.key === 'Tab') return true
    }

    return false
  }

  /**
   * Main keydown handler
   */
  async function onKeyDown(event: KeyboardEvent) {
    // Convert key event to action
    const action = eventToAction(event)
    if (!action) return

    // Check if in input field
    const inInput = isInputField(event.target)

    // If in input field, check if action should be allowed
    if (inInput && !shouldAllowInInput(action, event)) {
      return
    }

    // Try to handle the action
    const handled = await handleAction(action)

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  // Setup and teardown
  onMounted(() => {
    window.addEventListener('keydown', onKeyDown, { capture: true })
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeyDown, { capture: true })
  })

  // Return action handler for programmatic use
  return {
    handleAction,
  }
}
