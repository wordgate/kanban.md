import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'

/**
 * 列表项类型
 */
export interface ListItem<T = string> {
  id: string
  value: T
  disabled?: boolean
}

/**
 * 列表导航选项
 */
export interface ListNavigationOptions<T = string> {
  /** 列表项 */
  items: Ref<ListItem<T>[]> | ComputedRef<ListItem<T>[]>
  /** 选择模式: radio(单选) 或 checkbox(多选) */
  mode: 'radio' | 'checkbox'
  /** 当前选中值 (radio: 单值, checkbox: 数组) */
  modelValue: Ref<T | T[] | null>
  /** 是否循环导航 */
  loop?: boolean
  /** 是否启用 */
  enabled?: Ref<boolean> | ComputedRef<boolean>
  /** 选择变更回调 */
  onSelect?: (value: T | T[] | null) => void
  /** 导航变更回调 */
  onNavigate?: (index: number, item: ListItem<T>) => void
}

/**
 * 列表导航 composable
 * 提供键盘导航、Space 切换、Tab 导航等功能
 */
export function useListNavigation<T = string>(options: ListNavigationOptions<T>) {
  const {
    items,
    mode,
    modelValue,
    loop = true,
    enabled = ref(true),
    onSelect,
    onNavigate,
  } = options

  // 当前聚焦索引
  const focusIndex = ref(0)

  // 当前聚焦的项
  const focusedItem = computed(() => {
    const list = items.value
    if (focusIndex.value >= 0 && focusIndex.value < list.length) {
      return list[focusIndex.value]
    }
    return null
  })

  // 是否选中某项
  function isSelected(item: ListItem<T>): boolean {
    if (mode === 'radio') {
      return modelValue.value === item.value
    } else {
      const values = modelValue.value as T[] | null
      return values?.includes(item.value) ?? false
    }
  }

  // 移动焦点
  function move(direction: 'up' | 'down'): boolean {
    if (!enabled.value) return false
    const list = items.value
    if (list.length === 0) return false

    const delta = direction === 'up' ? -1 : 1
    let newIndex = focusIndex.value + delta

    if (loop) {
      if (newIndex < 0) newIndex = list.length - 1
      if (newIndex >= list.length) newIndex = 0
    } else {
      newIndex = Math.max(0, Math.min(list.length - 1, newIndex))
    }

    // 跳过禁用项
    let attempts = 0
    while (list[newIndex]?.disabled && attempts < list.length) {
      newIndex = loop
        ? (newIndex + delta + list.length) % list.length
        : Math.max(0, Math.min(list.length - 1, newIndex + delta))
      attempts++
    }

    if (newIndex !== focusIndex.value) {
      focusIndex.value = newIndex
      onNavigate?.(newIndex, list[newIndex])
      return true
    }
    return false
  }

  // 切换选中状态
  function toggle(): boolean {
    if (!enabled.value) return false
    const item = focusedItem.value
    if (!item || item.disabled) return false

    if (mode === 'radio') {
      // 单选：直接选中
      modelValue.value = item.value
      onSelect?.(item.value)
    } else {
      // 多选：切换
      const values = (modelValue.value as T[] | null) ?? []
      const index = values.indexOf(item.value)
      if (index >= 0) {
        const newValues = values.filter((_, i) => i !== index)
        modelValue.value = newValues as T[]
        onSelect?.(newValues as T[])
      } else {
        const newValues = [...values, item.value]
        modelValue.value = newValues as T[]
        onSelect?.(newValues as T[])
      }
    }
    return true
  }

  // 直接选中某项（用于点击）
  function select(item: ListItem<T>): boolean {
    if (!enabled.value || item.disabled) return false

    // 找到索引并聚焦
    const index = items.value.findIndex(i => i.id === item.id)
    if (index >= 0) {
      focusIndex.value = index
    }

    if (mode === 'radio') {
      modelValue.value = item.value
      onSelect?.(item.value)
    } else {
      const values = (modelValue.value as T[] | null) ?? []
      const valueIndex = values.indexOf(item.value)
      if (valueIndex >= 0) {
        const newValues = values.filter((_, i) => i !== valueIndex)
        modelValue.value = newValues as T[]
        onSelect?.(newValues as T[])
      } else {
        const newValues = [...values, item.value]
        modelValue.value = newValues as T[]
        onSelect?.(newValues as T[])
      }
    }
    return true
  }

  // 设置焦点到指定索引
  function setFocusIndex(index: number): void {
    const list = items.value
    if (index >= 0 && index < list.length) {
      focusIndex.value = index
      onNavigate?.(index, list[index])
    }
  }

  // 设置焦点到指定项
  function setFocusById(id: string): void {
    const index = items.value.findIndex(item => item.id === id)
    if (index >= 0) {
      setFocusIndex(index)
    }
  }

  // 键盘事件处理
  function handleKeyDown(event: KeyboardEvent): boolean {
    if (!enabled.value) return false

    switch (event.key) {
      case 'ArrowUp':
      case 'k':
        event.preventDefault()
        return move('up')

      case 'ArrowDown':
      case 'j':
        event.preventDefault()
        return move('down')

      case ' ':
      case 'Enter':
        event.preventDefault()
        return toggle()

      case 'Tab':
        event.preventDefault()
        return move(event.shiftKey ? 'up' : 'down')

      default:
        return false
    }
  }

  // 监听 items 变化，调整焦点
  watch(items, (newItems) => {
    if (focusIndex.value >= newItems.length) {
      focusIndex.value = Math.max(0, newItems.length - 1)
    }
  })

  return {
    focusIndex,
    focusedItem,
    isSelected,
    move,
    toggle,
    select,
    setFocusIndex,
    setFocusById,
    handleKeyDown,
  }
}
