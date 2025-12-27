/**
 * Key Bindings Configuration
 *
 * Maps keyboard events to semantic actions.
 * This is the only place where keys are mapped to actions.
 */

import type { KeyBinding, Action } from './types'

/**
 * Default key bindings
 *
 * Order matters: more specific bindings (with modifiers) should come first
 * to ensure they are matched before simpler bindings.
 */
export const defaultKeyBindings: KeyBinding[] = [
  // Global shortcuts (work even in input fields)
  { key: 's', modifiers: { meta: true }, action: 'save' },
  { key: 's', modifiers: { ctrl: true }, action: 'save' },
  { key: 'f', modifiers: { meta: true }, action: 'search' },
  { key: 'f', modifiers: { ctrl: true }, action: 'search' },

  // Move task between columns
  { key: 'ArrowLeft', modifiers: { meta: true }, action: 'move-left' },
  { key: 'ArrowLeft', modifiers: { ctrl: true }, action: 'move-left' },
  { key: 'ArrowRight', modifiers: { meta: true }, action: 'move-right' },
  { key: 'ArrowRight', modifiers: { ctrl: true }, action: 'move-right' },
  { key: 'h', modifiers: { meta: true }, action: 'move-left' },
  { key: 'h', modifiers: { ctrl: true }, action: 'move-left' },
  { key: 'l', modifiers: { meta: true }, action: 'move-right' },
  { key: 'l', modifiers: { ctrl: true }, action: 'move-right' },

  // Tab navigation (with shift for reverse)
  { key: 'Tab', modifiers: { shift: true }, action: 'up' },
  { key: 'Tab', action: 'down' },

  // Arrow key navigation
  { key: 'ArrowUp', action: 'up' },
  { key: 'ArrowDown', action: 'down' },
  { key: 'ArrowLeft', action: 'left' },
  { key: 'ArrowRight', action: 'right' },

  // Vim-style navigation
  { key: 'k', action: 'up' },
  { key: 'j', action: 'down' },
  { key: 'h', action: 'left' },
  { key: 'l', action: 'right' },

  // Selection
  { key: ' ', action: 'select' },  // Space
  { key: 'Enter', action: 'select' },

  // Back/Close
  { key: 'Escape', action: 'back' },

  // Delete
  { key: 'Delete', action: 'delete' },
  { key: 'Backspace', action: 'delete' },
]

/**
 * Actions that should work even when in an input field
 */
export const globalActions: Action[] = ['back', 'save', 'search']

/**
 * Check if modifiers match
 */
function modifiersMatch(
  event: KeyboardEvent,
  mods?: KeyBinding['modifiers']
): boolean {
  if (!mods) {
    // No modifiers required: should NOT have cmd/ctrl/alt pressed
    // (shift is allowed for Shift+Tab)
    return !event.metaKey && !event.ctrlKey && !event.altKey
  }

  // Check each modifier
  const wantsCmdOrCtrl = mods.meta || mods.ctrl
  const hasCmdOrCtrl = event.metaKey || event.ctrlKey

  if (wantsCmdOrCtrl !== hasCmdOrCtrl) return false
  if (!!mods.shift !== event.shiftKey) return false
  if (!!mods.alt !== event.altKey) return false

  return true
}

/**
 * Convert a keyboard event to an action
 *
 * @returns The action if a binding matches, null otherwise
 */
export function eventToAction(event: KeyboardEvent): Action | null {
  for (const binding of defaultKeyBindings) {
    // Check key match
    if (event.key !== binding.key) continue

    // Check modifiers match
    if (!modifiersMatch(event, binding.modifiers)) continue

    return binding.action
  }

  return null
}

/**
 * Check if an action is global (works in input fields)
 */
export function isGlobalAction(action: Action): boolean {
  return globalActions.includes(action)
}

/**
 * Get display string for a key binding (for UI hints)
 *
 * @example
 * getKeyDisplay({ key: 's', modifiers: { meta: true }, action: 'save' })
 * // => '⌘S' (on Mac) or 'Ctrl+S' (on other platforms)
 */
export function getKeyDisplay(binding: KeyBinding): string {
  const isMac = navigator.platform.includes('Mac')
  const parts: string[] = []

  if (binding.modifiers?.ctrl || binding.modifiers?.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl+')
  }
  if (binding.modifiers?.shift) {
    parts.push(isMac ? '⇧' : 'Shift+')
  }
  if (binding.modifiers?.alt) {
    parts.push(isMac ? '⌥' : 'Alt+')
  }

  // Format special keys
  const keyDisplay: Record<string, string> = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    ' ': 'Space',
    'Escape': 'Esc',
    'Delete': 'Del',
    'Backspace': '⌫',
    'Enter': '↵',
    'Tab': 'Tab',
  }

  parts.push(keyDisplay[binding.key] || binding.key.toUpperCase())

  return parts.join('')
}

/**
 * Get all bindings for an action
 */
export function getBindingsForAction(action: Action): KeyBinding[] {
  return defaultKeyBindings.filter(b => b.action === action)
}

/**
 * Get primary key display for an action (first binding)
 */
export function getPrimaryKeyForAction(action: Action): string {
  const binding = defaultKeyBindings.find(b => b.action === action)
  return binding ? getKeyDisplay(binding) : ''
}
