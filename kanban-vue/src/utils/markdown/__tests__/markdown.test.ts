import { describe, it, expect } from 'vitest'
import { parseKanbanMarkdown, parseArchiveMarkdown } from '../parser'
import { generateKanbanMarkdown, generateArchiveMarkdown } from '../generator'
import type { KanbanConfig, Task } from '@/types'

describe('Markdown Parser', () => {
  describe('parseKanbanMarkdown', () => {
    it('should parse empty content', () => {
      const result = parseKanbanMarkdown('')
      expect(result.tasks).toEqual([])
      expect(result.lastTaskId).toBe(0)
    })

    it('should parse lastTaskId from config comment', () => {
      const content = `# Kanban Board

<!-- Config: Last Task ID: 42 -->

## ⚙️ Configuration

**Columns**: 待办 (todo) | 进行中 (in-progress)
**Categories**: Frontend, Backend
**Users**: @alice, @bob
**Priorities**: 🔴 紧急 | 🟠 高 | 🟡 中 | 🟢 低
**Tags**: #bug #feature

---

## 待办

## 进行中
`
      const result = parseKanbanMarkdown(content)
      expect(result.lastTaskId).toBe(42)
    })

    it('should parse columns from config', () => {
      const content = `# Kanban Board

## ⚙️ Configuration

**Columns**: 待办 (todo) | 进行中 (in-progress) | 已完成 (done)
**Categories**: Frontend
**Users**: @alice
**Priorities**: 🔴 紧急
**Tags**: #bug

---

## 待办

## 进行中

## 已完成
`
      const result = parseKanbanMarkdown(content)
      expect(result.config.columns).toHaveLength(3)
      expect(result.config.columns[0]).toEqual({ name: '待办', id: 'todo' })
      expect(result.config.columns[1]).toEqual({ name: '进行中', id: 'in-progress' })
      expect(result.config.columns[2]).toEqual({ name: '已完成', id: 'done' })
    })

    it('should parse priorities from config', () => {
      const content = `# Kanban Board

## ⚙️ Configuration

**Columns**: 待办 (todo)
**Categories**: Frontend
**Users**: @alice
**Priorities**: 🔴 紧急 | 🟠 高 | 🟡 中 | 🟢 低
**Tags**: #bug

---

## 待办
`
      const result = parseKanbanMarkdown(content)
      expect(result.config.priorities).toHaveLength(4)
      expect(result.config.priorities[0]).toEqual({ icon: '🔴', name: '紧急', value: '紧急' })
      expect(result.config.priorities[1]).toEqual({ icon: '🟠', name: '高', value: '高' })
    })

    it('should parse a simple task', () => {
      const content = `# Kanban Board

<!-- Config: Last Task ID: 1 -->

## ⚙️ Configuration

**Columns**: 待办 (todo)
**Categories**: Frontend
**Users**: @alice
**Priorities**: 🔴 紧急
**Tags**: #bug

---

## 待办

### TASK-001 | Fix login bug

**Priority**: 🔴 紧急 | **Category**: Frontend | **Assigned**: @alice
**Created**: 2025-01-20

This is the description.
`
      const result = parseKanbanMarkdown(content)
      expect(result.tasks).toHaveLength(1)
      expect(result.tasks[0].id).toBe('TASK-001')
      expect(result.tasks[0].title).toBe('Fix login bug')
      expect(result.tasks[0].status).toBe('todo')
      expect(result.tasks[0].priority).toBe('🔴 紧急')
      expect(result.tasks[0].category).toBe('Frontend')
      expect(result.tasks[0].assignees).toContain('@alice')
      expect(result.tasks[0].created).toBe('2025-01-20')
      expect(result.tasks[0].description).toBe('This is the description.')
    })

    it('should parse task with subtasks', () => {
      const content = `# Kanban Board

## ⚙️ Configuration

**Columns**: 待办 (todo)
**Categories**: Frontend
**Users**: @alice
**Priorities**: 🔴 紧急
**Tags**: #bug

---

## 待办

### TASK-001 | Task with subtasks

**Priority**: 🔴 紧急 | **Category**: Frontend
**Created**: 2025-01-20

**Subtasks**:
- [x] First subtask completed
- [ ] Second subtask pending
`
      const result = parseKanbanMarkdown(content)
      expect(result.tasks[0].subtasks).toHaveLength(2)
      expect(result.tasks[0].subtasks[0]).toEqual({ completed: true, text: 'First subtask completed' })
      expect(result.tasks[0].subtasks[1]).toEqual({ completed: false, text: 'Second subtask pending' })
    })

    it('should parse task with notes', () => {
      const content = `# Kanban Board

## ⚙️ Configuration

**Columns**: 待办 (todo)
**Categories**: Frontend
**Users**: @alice
**Priorities**: 🔴 紧急
**Tags**: #bug

---

## 待办

### TASK-001 | Task with notes

**Priority**: 🔴 紧急 | **Category**: Frontend
**Created**: 2025-01-20

**Notes**:
This is a note.
Multiple lines are supported.
`
      const result = parseKanbanMarkdown(content)
      expect(result.tasks[0].notes).toContain('This is a note.')
      expect(result.tasks[0].notes).toContain('Multiple lines are supported.')
    })

    it('should parse multiple tasks in different columns', () => {
      const content = `# Kanban Board

## ⚙️ Configuration

**Columns**: 待办 (todo) | 进行中 (in-progress) | 已完成 (done)
**Categories**: Frontend
**Users**: @alice
**Priorities**: 🔴 紧急
**Tags**: #bug

---

## 待办

### TASK-001 | Todo task

**Priority**: 🔴 紧急 | **Category**: Frontend
**Created**: 2025-01-20

## 进行中

### TASK-002 | In progress task

**Priority**: 🟠 高 | **Category**: Frontend
**Created**: 2025-01-21

## 已完成

### TASK-003 | Done task

**Priority**: 🟢 低 | **Category**: Frontend
**Created**: 2025-01-19 | **Finished**: 2025-01-22
`
      const result = parseKanbanMarkdown(content)
      expect(result.tasks).toHaveLength(3)
      expect(result.tasks.find(t => t.id === 'TASK-001')?.status).toBe('todo')
      expect(result.tasks.find(t => t.id === 'TASK-002')?.status).toBe('in-progress')
      expect(result.tasks.find(t => t.id === 'TASK-003')?.status).toBe('done')
    })
  })

  describe('parseArchiveMarkdown', () => {
    it('should parse empty content', () => {
      const result = parseArchiveMarkdown('')
      expect(result).toEqual([])
    })

    it('should parse archived task with original status', () => {
      const content = `# Archived Tasks

### TASK-001 | Archived task

**Priority**: 🔴 紧急 | **Category**: Frontend
**Created**: 2025-01-15 | **Finished**: 2025-01-20
**Original Status**: done
`
      const result = parseArchiveMarkdown(content)
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('TASK-001')
      expect(result[0].status).toBe('done')
    })
  })
})

describe('Markdown Generator', () => {
  const baseConfig: KanbanConfig = {
    columns: [
      { id: 'todo', name: '待办' },
      { id: 'in-progress', name: '进行中' },
      { id: 'done', name: '已完成' },
    ],
    categories: ['Frontend', 'Backend'],
    users: [{ id: '@alice', displayName: 'Alice' }],
    priorities: [
      { icon: '🔴', name: '紧急', value: 'critical' },
      { icon: '🟢', name: '低', value: 'low' },
    ],
    tags: ['bug', 'feature'],
  }

  describe('generateKanbanMarkdown', () => {
    it('should generate valid markdown for empty tasks', () => {
      const markdown = generateKanbanMarkdown(baseConfig, [], 0)

      expect(markdown).toContain('# Kanban Board')
      expect(markdown).toContain('<!-- Config: Last Task ID: 0 -->')
      expect(markdown).toContain('## ⚙️ Configuration')
      expect(markdown).toContain('**Columns**: 待办 (todo) | 进行中 (in-progress) | 已完成 (done)')
      expect(markdown).toContain('**Categories**: Frontend, Backend')
      expect(markdown).toContain('**Users**: @alice (Alice)')
      expect(markdown).toContain('**Priorities**: 🔴 紧急 | 🟢 低')
      expect(markdown).toContain('**Tags**: #bug #feature')
    })

    it('should generate markdown with tasks', () => {
      const tasks: Task[] = [
        {
          id: 'TASK-001',
          title: 'Test task',
          status: 'todo',
          priority: '🔴 紧急',
          category: 'Frontend',
          assignees: ['@alice'],
          tags: ['bug'],
          created: '2025-01-20',
          started: '',
          due: '',
          completed: '',
          description: 'Task description',
          subtasks: [
            { text: 'Subtask 1', completed: true },
            { text: 'Subtask 2', completed: false },
          ],
          notes: 'Some notes here',
        },
      ]

      const markdown = generateKanbanMarkdown(baseConfig, tasks, 1)

      expect(markdown).toContain('<!-- Config: Last Task ID: 1 -->')
      expect(markdown).toContain('### TASK-001 | Test task')
      expect(markdown).toContain('**Priority**: 🔴 紧急')
      expect(markdown).toContain('**Category**: Frontend')
      expect(markdown).toContain('**Assigned**: @alice')
      expect(markdown).toContain('**Created**: 2025-01-20')
      expect(markdown).toContain('**Tags**: #bug')
      expect(markdown).toContain('Task description')
      expect(markdown).toContain('**Subtasks**:')
      expect(markdown).toContain('- [x] Subtask 1')
      expect(markdown).toContain('- [ ] Subtask 2')
      expect(markdown).toContain('**Notes**:')
      expect(markdown).toContain('Some notes here')
    })
  })

  describe('generateArchiveMarkdown', () => {
    it('should generate markdown for archived tasks', () => {
      const tasks: Task[] = [
        {
          id: 'TASK-001',
          title: 'Archived task',
          status: 'done',
          priority: '🔴 紧急',
          category: 'Frontend',
          assignees: [],
          tags: [],
          created: '2025-01-15',
          started: '',
          due: '',
          completed: '2025-01-20',
          description: '',
          subtasks: [],
          notes: '',
        },
      ]

      const markdown = generateArchiveMarkdown(tasks)

      expect(markdown).toContain('# Archived Tasks')
      expect(markdown).toContain('### TASK-001 | Archived task')
      expect(markdown).toContain('**Original Status**: done')
    })
  })

  describe('Round-trip: parse -> generate -> parse', () => {
    it('should preserve data through round-trip', () => {
      const originalTasks: Task[] = [
        {
          id: 'TASK-001',
          title: 'Test task',
          status: 'todo',
          priority: '🔴 紧急',
          category: 'Frontend',
          assignees: ['@alice', '@bob'],
          tags: ['bug', 'urgent'],
          created: '2025-01-20',
          started: '2025-01-21',
          due: '2025-01-25',
          completed: '',
          description: 'This is a test task',
          subtasks: [
            { text: 'Step 1', completed: true },
            { text: 'Step 2', completed: false },
          ],
          notes: 'Important notes',
        },
      ]

      // Generate markdown
      const markdown = generateKanbanMarkdown(baseConfig, originalTasks, 1)

      // Parse it back
      const parsed = parseKanbanMarkdown(markdown)

      // Verify
      expect(parsed.tasks).toHaveLength(1)
      const task = parsed.tasks[0]
      expect(task.id).toBe('TASK-001')
      expect(task.title).toBe('Test task')
      expect(task.status).toBe('todo')
      expect(task.priority).toBe('🔴 紧急')
      expect(task.category).toBe('Frontend')
      expect(task.assignees).toEqual(['@alice', '@bob'])
      expect(task.tags).toEqual(['bug', 'urgent'])
      expect(task.created).toBe('2025-01-20')
      expect(task.started).toBe('2025-01-21')
      expect(task.due).toBe('2025-01-25')
      expect(task.subtasks).toHaveLength(2)
      expect(task.subtasks[0]).toEqual({ text: 'Step 1', completed: true })
      expect(task.notes).toContain('Important notes')
    })
  })
})
