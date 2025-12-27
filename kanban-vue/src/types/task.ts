export interface Subtask {
  text: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  status: string
  priority: string
  category: string
  assignees: string[]
  tags: string[]
  created: string
  started: string
  due: string
  completed: string
  description: string
  subtasks: Subtask[]
  notes: string
  parentId?: string  // 父任务ID（用于子任务关联）
}

export function createEmptyTask(id: string, status: string): Task {
  return {
    id,
    title: '',
    status,
    priority: '',
    category: '',
    assignees: [],
    tags: [],
    created: new Date().toISOString().split('T')[0],
    started: '',
    due: '',
    completed: '',
    description: '',
    subtasks: [],
    notes: '',
  }
}
