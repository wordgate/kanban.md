import type { Task, KanbanConfig } from '@/types'

export function generateKanbanMarkdown(
  config: KanbanConfig,
  tasks: Task[],
  lastTaskId: number
): string {
  const lines: string[] = []

  // 标题
  lines.push('# Kanban Board')
  lines.push('')

  // 配置注释
  lines.push(`<!-- Config: Last Task ID: ${lastTaskId} -->`)
  lines.push('')

  // 配置节
  lines.push('## ⚙️ Configuration')
  lines.push('')
  lines.push(`**Columns**: ${config.columns.map(c => `${c.name} (${c.id})`).join(' | ')}`)
  lines.push(`**Categories**: ${config.categories.join(', ')}`)
  lines.push(`**Users**: ${config.users.map(u => u.displayName ? `${u.id} (${u.displayName})` : u.id).join(', ')}`)
  lines.push(`**Priorities**: ${config.priorities.map(p => `${p.icon} ${p.name}`).join(' | ')}`)
  lines.push(`**Tags**: ${config.tags.map(t => `#${t}`).join(' ')}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // 各列任务
  config.columns.forEach(column => {
    lines.push(`## ${column.name}`)
    lines.push('')

    const columnTasks = tasks.filter(t => t.status === column.id)
    columnTasks.forEach(task => {
      lines.push(generateTaskMarkdown(task))
      lines.push('')
    })
  })

  return lines.join('\n')
}

function generateTaskMarkdown(task: Task): string {
  const lines: string[] = []

  // 标题行
  const idNum = task.id.replace('TASK-', '')
  lines.push(`### TASK-${idNum} | ${task.title}`)

  // 元数据行
  const metaParts: string[] = []
  if (task.priority) metaParts.push(`**Priority**: ${task.priority}`)
  if (task.category) metaParts.push(`**Category**: ${task.category}`)
  if (task.assignees.length) metaParts.push(`**Assigned**: ${task.assignees.join(', ')}`)
  if (metaParts.length) lines.push(metaParts.join(' | '))

  // 日期行
  const dateParts: string[] = []
  if (task.created) dateParts.push(`**Created**: ${task.created}`)
  if (task.started) dateParts.push(`**Started**: ${task.started}`)
  if (task.due) dateParts.push(`**Due**: ${task.due}`)
  if (task.completed) dateParts.push(`**Finished**: ${task.completed}`)
  if (dateParts.length) lines.push(dateParts.join(' | '))

  // 标签
  if (task.tags.length) {
    lines.push(`**Tags**: ${task.tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}`)
  }

  // 描述
  if (task.description) {
    lines.push('')
    lines.push(task.description)
  }

  // 子任务
  if (task.subtasks.length) {
    lines.push('')
    lines.push('**Subtasks**:')
    task.subtasks.forEach(st => {
      lines.push(`- [${st.completed ? 'x' : ' '}] ${st.text}`)
    })
  }

  // 备注
  if (task.notes) {
    lines.push('')
    lines.push('**Notes**:')
    lines.push('')
    lines.push(task.notes)
  }

  return lines.join('\n')
}

export function generateArchiveMarkdown(tasks: Task[]): string {
  const lines: string[] = []

  lines.push('# Archived Tasks')
  lines.push('')

  tasks.forEach(task => {
    lines.push(generateTaskMarkdown(task))
    lines.push(`**Original Status**: ${task.status}`)
    lines.push('')
  })

  return lines.join('\n')
}
