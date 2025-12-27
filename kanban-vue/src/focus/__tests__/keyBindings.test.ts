import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  eventToAction,
  isGlobalAction,
  getKeyDisplay,
  getBindingsForAction,
  getPrimaryKeyForAction,
  defaultKeyBindings,
} from '../keyBindings'

describe('keyBindings', () => {
  describe('eventToAction', () => {
    it('should convert arrow keys to navigation actions', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowUp' }))).toBe('up')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowDown' }))).toBe('down')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))).toBe('left')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowRight' }))).toBe('right')
    })

    it('should convert vim keys to navigation actions', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'h' }))).toBe('left')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'j' }))).toBe('down')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'k' }))).toBe('up')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'l' }))).toBe('right')
    })

    it('should convert selection keys', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: ' ' }))).toBe('select')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'Enter' }))).toBe('select')
    })

    it('should convert escape to back action', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'Escape' }))).toBe('back')
    })

    it('should convert delete keys', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'Delete' }))).toBe('delete')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'Backspace' }))).toBe('delete')
    })

    it('should convert Tab to navigation', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'Tab' }))).toBe('down')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))).toBe('up')
    })

    it('should convert Cmd/Ctrl+S to save action', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 's', metaKey: true }))).toBe('save')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }))).toBe('save')
    })

    it('should convert Cmd/Ctrl+F to search action', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'f', metaKey: true }))).toBe('search')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }))).toBe('search')
    })

    it('should convert Cmd/Ctrl+Arrow to move actions', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowLeft', metaKey: true }))).toBe('move-left')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowRight', metaKey: true }))).toBe('move-right')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true }))).toBe('move-left')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }))).toBe('move-right')
    })

    it('should convert Cmd/Ctrl+H/L to move actions (vim style)', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'h', metaKey: true }))).toBe('move-left')
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'l', metaKey: true }))).toBe('move-right')
    })

    it('should return null for unbound keys', () => {
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'a' }))).toBe(null)
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))).toBe(null)
    })

    it('should not match when modifier is required but not pressed', () => {
      // 's' without modifier should not match save
      expect(eventToAction(new KeyboardEvent('keydown', { key: 's' }))).toBe(null)
    })

    it('should not match when modifier is pressed but not required', () => {
      // 'j' with ctrl should not match 'down'
      expect(eventToAction(new KeyboardEvent('keydown', { key: 'j', ctrlKey: true }))).toBe(null)
    })
  })

  describe('isGlobalAction', () => {
    it('should identify global actions', () => {
      expect(isGlobalAction('back')).toBe(true)
      expect(isGlobalAction('save')).toBe(true)
      expect(isGlobalAction('search')).toBe(true)
    })

    it('should identify non-global actions', () => {
      expect(isGlobalAction('up')).toBe(false)
      expect(isGlobalAction('down')).toBe(false)
      expect(isGlobalAction('select')).toBe(false)
      expect(isGlobalAction('delete')).toBe(false)
    })
  })

  describe('getKeyDisplay', () => {
    beforeEach(() => {
      // Mock navigator.platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        writable: true,
      })
    })

    it('should format modifier keys for Mac', () => {
      Object.defineProperty(navigator, 'platform', { value: 'MacIntel' })

      const saveBinding = defaultKeyBindings.find(b => b.action === 'save' && b.modifiers?.meta)
      expect(getKeyDisplay(saveBinding!)).toBe('⌘S')
    })

    it('should format special keys', () => {
      const escBinding = defaultKeyBindings.find(b => b.key === 'Escape')
      expect(getKeyDisplay(escBinding!)).toBe('Esc')

      const enterBinding = defaultKeyBindings.find(b => b.key === 'Enter')
      expect(getKeyDisplay(enterBinding!)).toBe('↵')

      const spaceBinding = defaultKeyBindings.find(b => b.key === ' ')
      expect(getKeyDisplay(spaceBinding!)).toBe('Space')
    })

    it('should format arrow keys', () => {
      const upBinding = defaultKeyBindings.find(b => b.key === 'ArrowUp')
      expect(getKeyDisplay(upBinding!)).toBe('↑')
    })
  })

  describe('getBindingsForAction', () => {
    it('should return all bindings for an action', () => {
      const saveBindings = getBindingsForAction('save')
      expect(saveBindings.length).toBe(2) // meta and ctrl

      const upBindings = getBindingsForAction('up')
      expect(upBindings.length).toBeGreaterThanOrEqual(2) // ArrowUp, k, Shift+Tab
    })

    it('should return empty array for non-existent action', () => {
      const bindings = getBindingsForAction('non-existent' as any)
      expect(bindings).toEqual([])
    })
  })

  describe('getPrimaryKeyForAction', () => {
    it('should return the first binding display', () => {
      const saveDisplay = getPrimaryKeyForAction('save')
      expect(saveDisplay).toBeTruthy()
    })

    it('should return empty string for non-existent action', () => {
      const display = getPrimaryKeyForAction('non-existent' as any)
      expect(display).toBe('')
    })
  })

  describe('binding priority', () => {
    it('should prioritize modifier bindings over simple bindings', () => {
      // Cmd+H should be move-left, not left
      const cmdH = eventToAction(new KeyboardEvent('keydown', { key: 'h', metaKey: true }))
      expect(cmdH).toBe('move-left')

      // Plain h should be left
      const plainH = eventToAction(new KeyboardEvent('keydown', { key: 'h' }))
      expect(plainH).toBe('left')
    })

    it('should prioritize Cmd+Arrow over plain Arrow', () => {
      const cmdLeft = eventToAction(new KeyboardEvent('keydown', { key: 'ArrowLeft', metaKey: true }))
      expect(cmdLeft).toBe('move-left')

      const plainLeft = eventToAction(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      expect(plainLeft).toBe('left')
    })
  })
})
