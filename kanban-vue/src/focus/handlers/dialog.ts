/**
 * Dialog Navigation Handler
 *
 * Handles focus navigation within dialogs.
 * Pattern: dialog.*
 *
 * Dialog types:
 * - confirm: Confirmation dialog with cancel/confirm buttons
 */

import type { NavigationHandler, ActionResult, ParsedFocusPath, Action, NavigationContext } from '../types'
import { buildPath } from '../pathUtils'

// Confirm dialog buttons
const CONFIRM_BUTTONS = ['cancel', 'confirm']

export const dialogHandler: NavigationHandler = {
  pattern: /^dialog\./,

  handle(
    path: ParsedFocusPath,
    action: Action,
    ctx: NavigationContext
  ): ActionResult | null {
    const { ui } = ctx.stores

    // Handle different dialog types
    if (path.item === 'confirm' || path.item === 'cancel') {
      return handleConfirmDialog(path, action, ctx)
    }

    switch (action) {
      case 'back': {
        // Close dialog without action
        return {
          handled: true,
          effect: () => {
            ui.hideConfirm()
            ctx.focus.popLayer()
          },
        }
      }

      default:
        return null
    }
  },
}

/**
 * Handle confirm dialog navigation
 */
function handleConfirmDialog(
  path: ParsedFocusPath,
  action: Action,
  ctx: NavigationContext
): ActionResult | null {
  const { ui } = ctx.stores

  // Determine current button
  const currentIndex = path.item === 'cancel' ? 0 : 1

  switch (action) {
    case 'left': {
      if (currentIndex > 0) {
        return {
          handled: true,
          newPath: buildPath({
            layer: 'dialog',
            item: CONFIRM_BUTTONS[currentIndex - 1],
          }),
        }
      }
      return { handled: true }
    }

    case 'right': {
      if (currentIndex < CONFIRM_BUTTONS.length - 1) {
        return {
          handled: true,
          newPath: buildPath({
            layer: 'dialog',
            item: CONFIRM_BUTTONS[currentIndex + 1],
          }),
        }
      }
      return { handled: true }
    }

    case 'up':
    case 'down': {
      // No vertical navigation in confirm dialog
      return { handled: true }
    }

    case 'select': {
      if (path.item === 'cancel') {
        // Cancel action
        return {
          handled: true,
          effect: () => {
            ui.hideConfirm()
            ctx.focus.popLayer()
          },
        }
      } else if (path.item === 'confirm') {
        // Execute confirm action (stored in ui.confirmDialog.onConfirm)
        return {
          handled: true,
          effect: () => {
            // Call the stored onConfirm callback
            ui.confirmDialog.onConfirm()
            // Note: The confirm action handler is responsible for hiding the dialog
            // and calling focus.popLayer()
          },
        }
      }
      return null
    }

    case 'back': {
      // Close dialog without action (same as cancel)
      return {
        handled: true,
        effect: () => {
          ui.hideConfirm()
          ctx.focus.popLayer()
        },
      }
    }

    default:
      return null
  }
}
