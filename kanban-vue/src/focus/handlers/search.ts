/**
 * Search Navigation Handler
 *
 * Handles focus navigation within the search overlay.
 * Pattern: search.*
 *
 * Search items:
 * - input: The search input field
 * - result-0, result-1, etc.: Search results
 */

import type { NavigationHandler, ActionResult, ParsedFocusPath, Action, NavigationContext } from '../types'
import { buildPath } from '../pathUtils'

export const searchHandler: NavigationHandler = {
  pattern: /^search\./,

  handle(
    path: ParsedFocusPath,
    action: Action,
    ctx: NavigationContext
  ): ActionResult | null {
    const { ui } = ctx.stores

    // Search results would need to be computed from search query
    // For now, we'll handle basic search navigation
    // The actual search results should be computed in the search component
    const searchResults: { id: string }[] = []
    const resultCount = searchResults.length

    // Parse current position
    const isInput = path.item === 'input'
    let resultIndex = -1
    if (path.item?.startsWith('result-')) {
      resultIndex = parseInt(path.item.replace('result-', ''), 10)
    }

    switch (action) {
      case 'up': {
        if (resultIndex > 0) {
          // Move to previous result
          return {
            handled: true,
            newPath: buildPath({
              layer: 'search',
              item: `result-${resultIndex - 1}`,
            }),
          }
        } else if (resultIndex === 0) {
          // Move back to input
          return {
            handled: true,
            newPath: buildPath({
              layer: 'search',
              item: 'input',
            }),
          }
        }
        return { handled: true }
      }

      case 'down': {
        if (isInput && resultCount > 0) {
          // Move from input to first result
          return {
            handled: true,
            newPath: buildPath({
              layer: 'search',
              item: 'result-0',
            }),
          }
        } else if (resultIndex >= 0 && resultIndex < resultCount - 1) {
          // Move to next result
          return {
            handled: true,
            newPath: buildPath({
              layer: 'search',
              item: `result-${resultIndex + 1}`,
            }),
          }
        }
        return { handled: true }
      }

      case 'left':
      case 'right': {
        // No horizontal navigation in search
        return { handled: true }
      }

      case 'select': {
        if (resultIndex >= 0 && resultIndex < resultCount) {
          // Open the selected search result
          const result = searchResults[resultIndex]
          if (result) {
            return {
              handled: true,
              effect: () => {
                // Close search and open the task
                ctx.focus.popLayer()
                ui.openFullTask(result.id)
                ctx.focus.pushLayer(`fullTask.${ui.fullTaskStack.length - 1}.editor.title`)
              },
            }
          }
        }
        return null
      }

      case 'back': {
        // Close search
        return {
          handled: true,
          effect: () => {
            ctx.focus.popLayer()
          },
        }
      }

      case 'search': {
        // Toggle search off
        return {
          handled: true,
          effect: () => {
            ctx.focus.popLayer()
          },
        }
      }

      default:
        return null
    }
  },
}
