/**
 * Global Navigation Handler
 *
 * Handles actions that work regardless of current focus path.
 * This handler runs first and catches global actions like search toggle.
 *
 * Pattern: .* (matches everything, but only handles specific actions)
 */

import type { NavigationHandler, ActionResult, ParsedFocusPath, Action, NavigationContext } from '../types'

export const globalHandler: NavigationHandler = {
  // Match everything, but only handle specific actions
  pattern: '',

  handle(
    path: ParsedFocusPath,
    action: Action,
    ctx: NavigationContext
  ): ActionResult | null {
    switch (action) {
      case 'search': {
        // Don't toggle if already in search
        if (path.layer === 'search') {
          return null // Let search handler deal with it
        }

        // Open search
        return {
          handled: true,
          effect: () => {
            ctx.focus.pushLayer('search.input')
          },
        }
      }

      case 'save': {
        // Global save - could trigger file save
        return {
          handled: true,
          effect: () => {
            // Dispatch save event for any listeners
            const event = new CustomEvent('app-save')
            window.dispatchEvent(event)
          },
        }
      }

      default:
        return null
    }
  },
}
