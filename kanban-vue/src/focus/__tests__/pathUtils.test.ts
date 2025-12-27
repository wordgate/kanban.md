import { describe, it, expect } from 'vitest'
import {
  parsePath,
  buildPath,
  matchPath,
  extractTaskId,
  taskIdToPathItem,
  extractProjectId,
  projectIdToPathItem,
  getParentPath,
} from '../pathUtils'

describe('pathUtils', () => {
  describe('parsePath', () => {
    it('should parse kanban sidebar path', () => {
      const parsed = parsePath('kanban.sidebar.project-abc')
      expect(parsed).toEqual({
        layer: 'kanban',
        area: 'sidebar',
        item: 'project-abc',
      })
    })

    it('should parse kanban board path', () => {
      const parsed = parsePath('kanban.board.todo.task-001')
      expect(parsed).toEqual({
        layer: 'kanban',
        area: 'board',
        container: 'todo',
        item: 'task-001',
      })
    })

    it('should parse fullTask path', () => {
      const parsed = parsePath('fullTask.0.meta.priority')
      expect(parsed).toEqual({
        layer: 'fullTask',
        stackIndex: 0,
        area: 'meta',
        item: 'priority',
      })
    })

    it('should parse dialog path', () => {
      const parsed = parsePath('dialog.confirm')
      expect(parsed).toEqual({
        layer: 'dialog',
        item: 'confirm',
      })
    })

    it('should parse search path', () => {
      const parsed = parsePath('search.input')
      expect(parsed).toEqual({
        layer: 'search',
        item: 'input',
      })
    })

    it('should parse fullTask editor path', () => {
      const parsed = parsePath('fullTask.1.editor.title')
      expect(parsed).toEqual({
        layer: 'fullTask',
        stackIndex: 1,
        area: 'editor',
        item: 'title',
      })
    })
  })

  describe('buildPath', () => {
    it('should build kanban sidebar path', () => {
      const path = buildPath({
        layer: 'kanban',
        area: 'sidebar',
        item: 'project-abc',
      })
      expect(path).toBe('kanban.sidebar.project-abc')
    })

    it('should build kanban board path', () => {
      const path = buildPath({
        layer: 'kanban',
        area: 'board',
        container: 'todo',
        item: 'task-001',
      })
      expect(path).toBe('kanban.board.todo.task-001')
    })

    it('should build fullTask path with stack index', () => {
      const path = buildPath({
        layer: 'fullTask',
        stackIndex: 0,
        area: 'meta',
        item: 'priority',
      })
      expect(path).toBe('fullTask.0.meta.priority')
    })

    it('should build dialog path', () => {
      const path = buildPath({
        layer: 'dialog',
        item: 'confirm',
      })
      expect(path).toBe('dialog.confirm')
    })
  })

  describe('matchPath', () => {
    it('should match exact paths', () => {
      expect(matchPath('kanban.board.todo.task-001', 'kanban.board.todo.task-001')).toBe(true)
    })

    it('should match single wildcard', () => {
      expect(matchPath('kanban.board.todo.task-001', 'kanban.board.*.task-001')).toBe(true)
      expect(matchPath('kanban.board.todo.task-001', 'kanban.board.todo.*')).toBe(true)
    })

    it('should match double wildcard', () => {
      expect(matchPath('kanban.board.todo.task-001', 'kanban.board.**')).toBe(true)
      expect(matchPath('kanban.sidebar.project-abc', 'kanban.**')).toBe(true)
    })

    it('should not match different paths', () => {
      expect(matchPath('kanban.board.todo.task-001', 'kanban.sidebar.*')).toBe(false)
      expect(matchPath('fullTask.0.meta.priority', 'kanban.**')).toBe(false)
    })
  })

  describe('extractTaskId and taskIdToPathItem', () => {
    it('should extract task id from path item (converts to uppercase)', () => {
      // Implementation converts to uppercase TASK-XXX format
      expect(extractTaskId('task-001')).toBe('TASK-001')
      expect(extractTaskId('new-task')).toBe(null)
    })

    it('should convert task id to path item (lowercase)', () => {
      // Implementation expects uppercase TASK-XXX and converts to lowercase
      expect(taskIdToPathItem('TASK-001')).toBe('task-001')
    })
  })

  describe('extractProjectId and projectIdToPathItem', () => {
    it('should extract project id from path item', () => {
      expect(extractProjectId('project-abc')).toBe('abc')
    })

    it('should convert project id to path item', () => {
      expect(projectIdToPathItem('my-project')).toBe('project-my-project')
    })
  })

  describe('getParentPath', () => {
    it('should get parent path', () => {
      expect(getParentPath('kanban.board.todo.task-001')).toBe('kanban.board.todo')
      expect(getParentPath('kanban.board.todo')).toBe('kanban.board')
      expect(getParentPath('kanban.board')).toBe('kanban')
    })

    it('should return null for root path', () => {
      expect(getParentPath('kanban')).toBe(null)
    })
  })
})
