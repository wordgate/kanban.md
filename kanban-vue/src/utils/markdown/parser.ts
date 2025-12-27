import type { Task, KanbanConfig, Column, User, Priority } from '@/types'

export interface ParseResult {
  config: KanbanConfig
  tasks: Task[]
  lastTaskId: number
}

export function parseKanbanMarkdown(content: string): ParseResult {
  const result: ParseResult = {
    config: {
      columns: [],
      categories: [],
      users: [],
      priorities: [],
      tags: [],
    },
    tasks: [],
    lastTaskId: 0,
  }

  if (!content.trim()) return result

  // 解析配置注释
  const configMatch = content.match(/<!-- Config: Last Task ID: (\d+) -->/)
  if (configMatch) {
    result.lastTaskId = parseInt(configMatch[1])
  }

  // 解析配置节
  const configSection = content.match(/## ⚙️ Configuration\s+([\s\S]*?)---/)
  if (configSection) {
    result.config = parseConfigSection(configSection[1])
  }

  // 解析各列任务
  result.config.columns.forEach(column => {
    const tasks = parseTasksFromSection(content, column.name, column.id)
    result.tasks.push(...tasks)
  })

  return result
}

function parseConfigSection(text: string): KanbanConfig {
  const config: KanbanConfig = {
    columns: [],
    categories: [],
    users: [],
    priorities: [],
    tags: [],
  }

  // 解析列配置
  const columnsMatch = text.match(/\*\*Columns\*\*:\s*(.+)/)
  if (columnsMatch) {
    config.columns = columnsMatch[1].split('|').map(col => {
      const match = col.trim().match(/(.+?)\s*\((.+?)\)/)
      return match ? { name: match[1].trim(), id: match[2].trim() } : null
    }).filter(Boolean) as Column[]
  }

  // 解析分类
  const categoriesMatch = text.match(/\*\*Categories\*\*:\s*(.+)/)
  if (categoriesMatch) {
    config.categories = categoriesMatch[1].split(',').map(c => c.trim()).filter(Boolean)
  }

  // 解析用户
  const usersMatch = text.match(/\*\*Users\*\*:\s*(.+)/)
  if (usersMatch) {
    config.users = usersMatch[1].split(',').map(u => {
      const match = u.trim().match(/(@\S+)\s*(?:\((.+?)\))?/)
      if (match) {
        return { id: match[1], displayName: match[2] || match[1].substring(1) }
      }
      return null
    }).filter(Boolean) as User[]
  }

  // 解析优先级
  const prioritiesMatch = text.match(/\*\*Priorities\*\*:\s*(.+)/)
  if (prioritiesMatch) {
    config.priorities = prioritiesMatch[1].split('|').map(p => {
      const trimmed = p.trim()
      // 匹配 emoji + 名称
      const match = trimmed.match(/^(\S+)\s+(.+)$/)
      if (match) {
        return {
          icon: match[1],
          name: match[2].trim(),
          value: match[2].trim().toLowerCase(),
        }
      }
      return null
    }).filter(Boolean) as Priority[]
  }

  // 解析标签
  const tagsMatch = text.match(/\*\*Tags\*\*:\s*(.+)/)
  if (tagsMatch) {
    config.tags = tagsMatch[1].split(/\s+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean)
  }

  return config
}

function parseTasksFromSection(content: string, sectionName: string, statusId: string): Task[] {
  const tasks: Task[] = []

  // 分割获取对应节
  const sections = content.split(/\n##\s+/)
  let sectionContent: string | null = null

  for (const section of sections) {
    if (section.startsWith(sectionName) || section.includes(`(${statusId})`)) {
      sectionContent = section.substring(section.indexOf('\n')).trim()
      break
    }
  }

  if (!sectionContent) return tasks

  // 按 ### TASK- 分割任务块
  const taskBlocks = sectionContent.split(/###\s+TASK-/).slice(1)

  taskBlocks.forEach(block => {
    const task = parseTaskBlock(block, statusId)
    if (task) tasks.push(task)
  })

  return tasks
}

function parseTaskBlock(block: string, status: string): Task | null {
  const lines = block.split('\n')
  const firstLine = lines[0].trim()

  const pipeIndex = firstLine.indexOf('|')
  if (pipeIndex <= 0) return null

  const idPart = firstLine.substring(0, pipeIndex).trim()
  const titlePart = firstLine.substring(pipeIndex + 1).trim()

  const idMatch = idPart.match(/^(\d+)$/)
  if (!idMatch || !titlePart) return null

  const taskContent = lines.slice(1).join('\n')

  const task: Task = {
    id: `TASK-${idPart.padStart(3, '0')}`,
    title: titlePart,
    status,
    priority: '',
    category: '',
    assignees: [],
    tags: [],
    created: '',
    started: '',
    due: '',
    completed: '',
    description: '',
    subtasks: [],
    notes: '',
  }

  // 解析元数据
  parseTaskMetadata(taskContent, task)

  return task
}

function parseTaskMetadata(content: string, task: Task): void {
  const lines = content.split('\n')
  let inNotes = false
  let inSubtasks = false
  const notesLines: string[] = []
  const descriptionLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('**Notes**:')) {
      inNotes = true
      inSubtasks = false
      continue
    }

    if (line.startsWith('**Subtasks**:')) {
      inSubtasks = true
      inNotes = false
      continue
    }

    if (inNotes) {
      notesLines.push(line)
      continue
    }

    if (inSubtasks) {
      const subtaskMatch = line.match(/^-\s*\[(x| )\]\s*(.+)/)
      if (subtaskMatch) {
        task.subtasks.push({
          completed: subtaskMatch[1] === 'x',
          text: subtaskMatch[2].trim(),
        })
      }
      continue
    }

    // 解析优先级
    const priorityMatch = line.match(/\*\*Priority\*\*:\s*([^|]+)/)
    if (priorityMatch) {
      task.priority = priorityMatch[1].trim()
    }

    // 解析分类
    const categoryMatch = line.match(/\*\*Category\*\*:\s*([^|]+)/)
    if (categoryMatch) {
      task.category = categoryMatch[1].trim()
    }

    // 解析分配人
    const assignedMatch = line.match(/\*\*Assigned\*\*:\s*([^|]+)/)
    if (assignedMatch) {
      task.assignees = assignedMatch[1].split(',').map(a => a.trim()).filter(Boolean)
    }

    // 解析日期
    const createdMatch = line.match(/\*\*Created\*\*:\s*([^|]+)/)
    if (createdMatch) {
      task.created = createdMatch[1].trim()
    }

    const startedMatch = line.match(/\*\*Started\*\*:\s*([^|]+)/)
    if (startedMatch) {
      task.started = startedMatch[1].trim()
    }

    const dueMatch = line.match(/\*\*Due\*\*:\s*([^|]+)/)
    if (dueMatch) {
      task.due = dueMatch[1].trim()
    }

    const finishedMatch = line.match(/\*\*Finished\*\*:\s*([^|]+)/)
    if (finishedMatch) {
      task.completed = finishedMatch[1].trim()
    }

    // 解析标签
    const tagsMatch = line.match(/\*\*Tags\*\*:\s*(.+)/)
    if (tagsMatch) {
      task.tags = tagsMatch[1].split(/\s+/).map(t => t.replace(/^#/, '').trim()).filter(Boolean)
    }

    // 描述（不以 ** 开头且不为空的行）
    if (!line.startsWith('**') && line.trim() && !line.startsWith('-')) {
      descriptionLines.push(line)
    }
  }

  task.description = descriptionLines.join('\n').trim()
  task.notes = notesLines.join('\n').trim()
}

// 解析归档文件
export function parseArchiveMarkdown(content: string): Task[] {
  const tasks: Task[] = []

  if (!content.trim()) return tasks

  // 归档文件格式较简单，直接解析所有任务
  const taskBlocks = content.split(/###\s+TASK-/).slice(1)

  taskBlocks.forEach(block => {
    // 获取状态信息
    const statusMatch = block.match(/\*\*Original Status\*\*:\s*(\S+)/)
    const status = statusMatch ? statusMatch[1].trim() : 'done'

    const task = parseTaskBlock(block, status)
    if (task) tasks.push(task)
  })

  return tasks
}
