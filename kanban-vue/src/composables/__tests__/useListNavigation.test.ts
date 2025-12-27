import { describe, it, expect, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { useListNavigation, type ListItem } from '../useListNavigation'

describe('useListNavigation', () => {
  const createItems = (): ListItem<string>[] => [
    { id: '1', value: 'Item 1' },
    { id: '2', value: 'Item 2' },
    { id: '3', value: 'Item 3' },
  ]

  describe('Radio mode', () => {
    it('should initialize with focusIndex at 0', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      expect(nav.focusIndex.value).toBe(0)
    })

    it('should move focus down', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.move('down')
      expect(nav.focusIndex.value).toBe(1)

      nav.move('down')
      expect(nav.focusIndex.value).toBe(2)
    })

    it('should move focus up', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.setFocusIndex(2)
      nav.move('up')
      expect(nav.focusIndex.value).toBe(1)
    })

    it('should loop navigation when at boundaries', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        loop: true,
      })

      // At start, move up should go to end
      nav.move('up')
      expect(nav.focusIndex.value).toBe(2)

      // At end, move down should go to start
      nav.move('down')
      expect(nav.focusIndex.value).toBe(0)
    })

    it('should not loop when loop is disabled', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        loop: false,
      })

      // At start, move up should stay at 0
      nav.move('up')
      expect(nav.focusIndex.value).toBe(0)

      // Go to end
      nav.setFocusIndex(2)

      // At end, move down should stay at 2
      nav.move('down')
      expect(nav.focusIndex.value).toBe(2)
    })

    it('should select item on toggle in radio mode', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)
      const onSelect = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        onSelect,
      })

      nav.setFocusIndex(1)
      nav.toggle()

      expect(modelValue.value).toBe('Item 2')
      expect(onSelect).toHaveBeenCalledWith('Item 2')
    })

    it('should correctly check if item is selected', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>('Item 2')

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      expect(nav.isSelected(items.value[0])).toBe(false)
      expect(nav.isSelected(items.value[1])).toBe(true)
      expect(nav.isSelected(items.value[2])).toBe(false)
    })

    it('should select item directly', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)
      const onSelect = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        onSelect,
      })

      nav.select(items.value[2])

      expect(modelValue.value).toBe('Item 3')
      expect(nav.focusIndex.value).toBe(2)
      expect(onSelect).toHaveBeenCalledWith('Item 3')
    })
  })

  describe('Checkbox mode', () => {
    it('should toggle items in checkbox mode', () => {
      const items = ref(createItems())
      const modelValue = ref<string[]>([])
      const onSelect = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'checkbox',
        modelValue,
        onSelect,
      })

      // Select first item
      nav.toggle()
      expect(modelValue.value).toEqual(['Item 1'])

      // Select second item
      nav.setFocusIndex(1)
      nav.toggle()
      expect(modelValue.value).toEqual(['Item 1', 'Item 2'])

      // Deselect first item
      nav.setFocusIndex(0)
      nav.toggle()
      expect(modelValue.value).toEqual(['Item 2'])
    })

    it('should correctly check if item is selected in checkbox mode', () => {
      const items = ref(createItems())
      const modelValue = ref<string[]>(['Item 1', 'Item 3'])

      const nav = useListNavigation({
        items,
        mode: 'checkbox',
        modelValue,
      })

      expect(nav.isSelected(items.value[0])).toBe(true)
      expect(nav.isSelected(items.value[1])).toBe(false)
      expect(nav.isSelected(items.value[2])).toBe(true)
    })
  })

  describe('Disabled items', () => {
    it('should skip disabled items when navigating', () => {
      const items = ref([
        { id: '1', value: 'Item 1' },
        { id: '2', value: 'Item 2', disabled: true },
        { id: '3', value: 'Item 3' },
      ])
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      // Should skip disabled item
      nav.move('down')
      expect(nav.focusIndex.value).toBe(2)
    })

    it('should not allow selecting disabled items', () => {
      const items = ref([
        { id: '1', value: 'Item 1' },
        { id: '2', value: 'Item 2', disabled: true },
        { id: '3', value: 'Item 3' },
      ])
      const modelValue = ref<string | null>(null)
      const onSelect = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        onSelect,
      })

      // Try to select disabled item
      const result = nav.select(items.value[1])

      expect(result).toBe(false)
      expect(modelValue.value).toBe(null)
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('Keyboard handling', () => {
    it('should handle ArrowDown key', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const handled = nav.handleKeyDown(event)

      expect(handled).toBe(true)
      expect(nav.focusIndex.value).toBe(1)
    })

    it('should handle ArrowUp key', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        loop: true,
      })

      const event = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      nav.handleKeyDown(event)

      expect(nav.focusIndex.value).toBe(2) // Looped to end
    })

    it('should handle j/k vim-style keys', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'j' }))
      expect(nav.focusIndex.value).toBe(1)

      nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'k' }))
      expect(nav.focusIndex.value).toBe(0)
    })

    it('should handle Space key for toggle', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)
      const onSelect = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        onSelect,
      })

      nav.handleKeyDown(new KeyboardEvent('keydown', { key: ' ' }))

      expect(modelValue.value).toBe('Item 1')
      expect(onSelect).toHaveBeenCalledWith('Item 1')
    })

    it('should handle Enter key for toggle', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)
      const onSelect = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        onSelect,
      })

      nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }))

      expect(modelValue.value).toBe('Item 1')
    })

    it('should handle Tab key for navigation', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab' }))
      expect(nav.focusIndex.value).toBe(1)

      nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
      expect(nav.focusIndex.value).toBe(0)
    })

    it('should not handle keys when disabled', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)
      const enabled = ref(false)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        enabled,
      })

      const handled = nav.handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))

      expect(handled).toBe(false)
      expect(nav.focusIndex.value).toBe(0)
    })
  })

  describe('Focus management', () => {
    it('should set focus by index', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)
      const onNavigate = vi.fn()

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
        onNavigate,
      })

      nav.setFocusIndex(2)

      expect(nav.focusIndex.value).toBe(2)
      expect(onNavigate).toHaveBeenCalledWith(2, items.value[2])
    })

    it('should set focus by id', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.setFocusById('2')

      expect(nav.focusIndex.value).toBe(1)
    })

    it('should get focused item', () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.setFocusIndex(1)

      expect(nav.focusedItem.value).toEqual({ id: '2', value: 'Item 2' })
    })

    it('should adjust focus when items list shrinks', async () => {
      const items = ref(createItems())
      const modelValue = ref<string | null>(null)

      const nav = useListNavigation({
        items,
        mode: 'radio',
        modelValue,
      })

      nav.setFocusIndex(2)
      expect(nav.focusIndex.value).toBe(2)

      // Remove last item
      items.value = items.value.slice(0, 2)
      await nextTick()

      expect(nav.focusIndex.value).toBe(1)
    })
  })
})
