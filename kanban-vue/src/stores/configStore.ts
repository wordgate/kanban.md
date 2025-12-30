import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, Priority, KanbanConfig } from '@/types'
import { createDefaultConfig, FIXED_COLUMNS } from '@/types'

export const useConfigStore = defineStore('config', () => {
  // 列配置是固定的，不可修改
  const columns = ref([...FIXED_COLUMNS])
  const categories = ref<string[]>([])
  const users = ref<User[]>([])
  const priorities = ref<Priority[]>([])
  const tags = ref<string[]>([])

  function setConfig(config: KanbanConfig) {
    // 忽略传入的 columns，始终使用固定列
    columns.value = [...FIXED_COLUMNS]
    categories.value = config.categories
    users.value = config.users
    priorities.value = config.priorities
    tags.value = config.tags
  }

  function resetToDefault() {
    setConfig(createDefaultConfig())
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
    addCategory,
    addUser,
    addTag,
    getConfig,
  }
})
