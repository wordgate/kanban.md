import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Column, User, Priority, KanbanConfig } from '@/types'
import { createDefaultConfig } from '@/types'

export const useConfigStore = defineStore('config', () => {
  const columns = ref<Column[]>([])
  const categories = ref<string[]>([])
  const users = ref<User[]>([])
  const priorities = ref<Priority[]>([])
  const tags = ref<string[]>([])

  function setConfig(config: KanbanConfig) {
    columns.value = config.columns
    categories.value = config.categories
    users.value = config.users
    priorities.value = config.priorities
    tags.value = config.tags
  }

  function resetToDefault() {
    setConfig(createDefaultConfig())
  }

  function addColumn(column: Column) {
    columns.value.push(column)
  }

  function updateColumn(id: string, data: Partial<Column>) {
    const index = columns.value.findIndex(c => c.id === id)
    if (index !== -1) {
      columns.value[index] = { ...columns.value[index], ...data }
    }
  }

  function removeColumn(id: string) {
    columns.value = columns.value.filter(c => c.id !== id)
  }

  function moveColumn(id: string, direction: 'up' | 'down') {
    const index = columns.value.findIndex(c => c.id === id)
    if (index === -1) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= columns.value.length) return
    const temp = columns.value[index]
    columns.value[index] = columns.value[newIndex]
    columns.value[newIndex] = temp
  }

  function addCategory(category: string) {
    if (!categories.value.includes(category)) {
      categories.value.push(category)
    }
  }

  function addUser(user: User) {
    if (!users.value.find(u => u.id === user.id)) {
      users.value.push(user)
    }
  }

  function addTag(tag: string) {
    if (!tags.value.includes(tag)) {
      tags.value.push(tag)
    }
  }

  function getConfig(): KanbanConfig {
    return {
      columns: columns.value,
      categories: categories.value,
      users: users.value,
      priorities: priorities.value,
      tags: tags.value,
    }
  }

  // 初始化默认配置
  resetToDefault()

  return {
    columns,
    categories,
    users,
    priorities,
    tags,
    setConfig,
    resetToDefault,
    addColumn,
    updateColumn,
    removeColumn,
    moveColumn,
    addCategory,
    addUser,
    addTag,
    getConfig,
  }
})
