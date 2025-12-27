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

export function createDefaultConfig(): KanbanConfig {
  return {
    columns: [
      { id: 'todo', name: '待办' },
      { id: 'in-progress', name: '进行中' },
      { id: 'in-review', name: '审核中' },
      { id: 'done', name: '已完成' },
    ],
    categories: ['前端', '后端', '设计', '文档'],
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
