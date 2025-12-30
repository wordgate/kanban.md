export interface Column {
  id: string
  name: string
}

export interface User {
  id: string
  displayName: string
}

export interface Priority {
  icon: string
  name: string
  value: string
}

export interface KanbanConfig {
  columns: Column[]
  categories: string[]
  users: User[]
  priorities: Priority[]
  tags: string[]
}

// 固定的看板列配置（不可修改）
export const FIXED_COLUMNS: Column[] = [
  { id: 'todo', name: 'Todo' },
  { id: 'process', name: 'Process' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' },
]

export function createDefaultConfig(): KanbanConfig {
  return {
    columns: [...FIXED_COLUMNS],
    categories: [],
    users: [],
    priorities: [
      { icon: '🔴', name: '紧急', value: 'critical' },
      { icon: '🟠', name: '高', value: 'high' },
      { icon: '🟡', name: '中', value: 'medium' },
      { icon: '🟢', name: '低', value: 'low' },
    ],
    tags: ['bug', 'feature', 'docs', 'refactor'],
  }
}
