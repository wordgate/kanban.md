import { computed } from 'vue'
import { useUIStore, useTaskStore, useConfigStore } from '@/stores'
import type { Task } from '@/types'

export interface SearchSuggestion {
  type: 'tag' | 'category' | 'user' | 'priority' | 'text'
  value: string
  display: string
}

export function useSearch() {
  const uiStore = useUIStore()
  const taskStore = useTaskStore()
  const configStore = useConfigStore()

  // 根据过滤器筛选任务
  const filteredTasks = computed(() => {
    let result = taskStore.tasks

    // 应用过滤器
    uiStore.activeFilters.forEach(filter => {
      result = result.filter(task => matchesFilter(task, filter))
    })

    // 应用搜索文本
    if (uiStore.searchQuery.trim()) {
      const query = uiStore.searchQuery.toLowerCase()
      result = result.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.notes.toLowerCase().includes(query)
      )
    }

    return result
  })

  // 检查任务是否匹配过滤器
  function matchesFilter(task: Task, filter: { type: string; value: string }): boolean {
    switch (filter.type) {
      case 'tag':
        return task.tags.includes(filter.value)
      case 'category':
        return task.category === filter.value
      case 'user':
        return task.assignees.includes(filter.value)
      case 'priority':
        return task.priority.toLowerCase().includes(filter.value.toLowerCase())
      default:
        return true
    }
  }

  // 生成搜索建议
  const suggestions = computed((): SearchSuggestion[] => {
    const query = uiStore.searchQuery.trim()
    if (!query) return []

    const results: SearchSuggestion[] = []

    // 标签建议 (#)
    if (query.startsWith('#')) {
      const tagQuery = query.substring(1).toLowerCase()
      configStore.tags.forEach(tag => {
        if (tag.toLowerCase().includes(tagQuery)) {
          results.push({
            type: 'tag',
            value: tag,
            display: `#${tag}`,
          })
        }
      })
    }
    // 用户建议 (@)
    else if (query.startsWith('@')) {
      const userQuery = query.substring(1).toLowerCase()
      configStore.users.forEach(user => {
        if (user.id.toLowerCase().includes(userQuery) ||
            user.displayName.toLowerCase().includes(userQuery)) {
          results.push({
            type: 'user',
            value: user.id,
            display: `${user.id} (${user.displayName})`,
          })
        }
      })
    }
    // 优先级建议 (!)
    else if (query.startsWith('!')) {
      const priorityQuery = query.substring(1).toLowerCase()
      configStore.priorities.forEach(p => {
        if (p.name.toLowerCase().includes(priorityQuery)) {
          results.push({
            type: 'priority',
            value: p.value,
            display: `${p.icon} ${p.name}`,
          })
        }
      })
    }
    // 分类和文本搜索
    else {
      const lowerQuery = query.toLowerCase()

      // 分类建议
      configStore.categories.forEach(category => {
        if (category.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'category',
            value: category,
            display: category,
          })
        }
      })

      // 标签建议
      configStore.tags.forEach(tag => {
        if (tag.toLowerCase().includes(lowerQuery)) {
          results.push({
            type: 'tag',
            value: tag,
            display: `#${tag}`,
          })
        }
      })

      // 文本搜索选项
      if (query.length >= 2) {
        results.push({
          type: 'text',
          value: query,
          display: `搜索: "${query}"`,
        })
      }
    }

    return results.slice(0, 10) // 最多10个建议
  })

  // 应用建议
  function applySuggestion(suggestion: SearchSuggestion) {
    if (suggestion.type === 'text') {
      // 文本搜索不添加过滤器，只设置搜索词
      uiStore.searchQuery = suggestion.value
    } else {
      uiStore.addFilter({
        type: suggestion.type,
        value: suggestion.value,
      })
      uiStore.searchQuery = ''
    }
  }

  return {
    filteredTasks,
    suggestions,
    matchesFilter,
    applySuggestion,
  }
}
