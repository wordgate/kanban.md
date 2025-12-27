/**
 * Focus Path Utilities
 *
 * Functions for parsing, building, and matching focus paths.
 */

import type { FocusPath, ParsedFocusPath } from './types'

/**
 * Parse a focus path string into structured components
 *
 * @example
 * parsePath('kanban.board.todo.task-001')
 * // => { layer: 'kanban', area: 'board', container: 'todo', item: 'task-001' }
 *
 * parsePath('fullTask.0.meta.priority-high')
 * // => { layer: 'fullTask', stackIndex: 0, area: 'meta', item: 'priority-high' }
 */
export function parsePath(path: FocusPath): ParsedFocusPath {
  const parts = path.split('.')
  const result: ParsedFocusPath = {
    layer: parts[0] as ParsedFocusPath['layer'],
  }

  if (result.layer === 'kanban') {
    // kanban.sidebar.project-abc
    // kanban.board.todo.task-001
    result.area = parts[1] as 'sidebar' | 'board'
    if (result.area === 'sidebar') {
      result.item = parts[2]
    } else if (result.area === 'board') {
      result.container = parts[2]
      result.item = parts[3]
    }
  } else if (result.layer === 'fullTask') {
    // fullTask.0.meta.priority-high
    // fullTask.1.editor.title
    // fullTask.0.subtasks.new-subtask
    result.stackIndex = parseInt(parts[1], 10)
    result.area = parts[2] as 'meta' | 'editor' | 'subtasks'
    result.item = parts[3]
  } else if (result.layer === 'dialog') {
    // dialog.confirm
    result.item = parts[1]
  } else if (result.layer === 'search') {
    // search.input
    // search.result-0
    result.item = parts[1]
  }

  return result
}

/**
 * Build a focus path from parsed components
 *
 * @example
 * buildPath({ layer: 'kanban', area: 'board', container: 'todo', item: 'task-001' })
 * // => 'kanban.board.todo.task-001'
 */
export function buildPath(parsed: Partial<ParsedFocusPath>): FocusPath {
  const parts: string[] = [parsed.layer || 'kanban']

  if (parsed.layer === 'kanban') {
    if (parsed.area) parts.push(parsed.area)
    if (parsed.area === 'board' && parsed.container) parts.push(parsed.container)
    if (parsed.item) parts.push(parsed.item)
  } else if (parsed.layer === 'fullTask') {
    parts.push(String(parsed.stackIndex ?? 0))
    if (parsed.area) parts.push(parsed.area)
    if (parsed.item) parts.push(parsed.item)
  } else if (parsed.layer === 'dialog') {
    if (parsed.item) parts.push(parsed.item)
  } else if (parsed.layer === 'search') {
    if (parsed.item) parts.push(parsed.item)
  }

  return parts.join('.')
}

/**
 * Check if a path matches a pattern
 *
 * Pattern syntax:
 *   - Exact match: "kanban.board.todo"
 *   - Wildcard (*): "kanban.board.*" matches any column
 *   - Double wildcard (**): "kanban.**" matches everything under kanban
 *
 * @example
 * matchPath('kanban.board.todo.task-001', 'kanban.board.*')  // true
 * matchPath('kanban.board.todo.task-001', 'kanban.board.todo.*')  // true
 * matchPath('kanban.sidebar.project-1', 'kanban.board.*')  // false
 */
export function matchPath(path: FocusPath, pattern: string): boolean {
  const pathParts = path.split('.')
  const patternParts = pattern.split('.')

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]

    // Double wildcard matches everything after
    if (patternPart === '**') {
      return true
    }

    // Single wildcard matches any single segment
    if (patternPart === '*') {
      if (i >= pathParts.length) return false
      continue
    }

    // Exact match required
    if (pathParts[i] !== patternPart) {
      return false
    }
  }

  // Pattern must match at least as many parts as it has
  return pathParts.length >= patternParts.length
}

/**
 * Extract task ID from path item
 *
 * @example
 * extractTaskId('task-001') // => 'TASK-001'
 * extractTaskId('new-task') // => null
 * extractTaskId('priority-high') // => null
 */
export function extractTaskId(item: string | undefined): string | null {
  if (!item) return null
  if (item === 'new-task' || item === 'new-subtask') return null

  // task-001 -> TASK-001
  if (item.startsWith('task-')) {
    return 'TASK-' + item.slice(5).toUpperCase()
  }

  // subtask-001 -> TASK-001
  if (item.startsWith('subtask-')) {
    return 'TASK-' + item.slice(8).toUpperCase()
  }

  return null
}

/**
 * Convert task ID to path item format
 *
 * @example
 * taskIdToPathItem('TASK-001') // => 'task-001'
 */
export function taskIdToPathItem(taskId: string): string {
  return 'task-' + taskId.replace('TASK-', '').toLowerCase()
}

/**
 * Convert project ID to path item format
 *
 * @example
 * projectIdToPathItem('my-project') // => 'project-my-project'
 */
export function projectIdToPathItem(projectId: string): string {
  return 'project-' + projectId
}

/**
 * Extract project ID from path item
 *
 * @example
 * extractProjectId('project-my-project') // => 'my-project'
 */
export function extractProjectId(item: string | undefined): string | null {
  if (!item) return null
  if (item.startsWith('project-')) {
    return item.slice(8)
  }
  return null
}

/**
 * Get the parent path (one level up)
 *
 * @example
 * getParentPath('kanban.board.todo.task-001') // => 'kanban.board.todo'
 * getParentPath('kanban.board.todo') // => 'kanban.board'
 * getParentPath('kanban') // => null
 */
export function getParentPath(path: FocusPath): FocusPath | null {
  const parts = path.split('.')
  if (parts.length <= 1) return null
  return parts.slice(0, -1).join('.')
}

/**
 * Get siblings at the same level (for navigation)
 * Returns the sibling path with a new item
 *
 * @example
 * getSiblingPath('kanban.board.todo.task-001', 'task-002')
 * // => 'kanban.board.todo.task-002'
 */
export function getSiblingPath(path: FocusPath, newItem: string): FocusPath {
  const parts = path.split('.')
  if (parts.length < 2) return path
  parts[parts.length - 1] = newItem
  return parts.join('.')
}
