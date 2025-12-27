/**
 * FullTask Navigation Handler
 *
 * Handles focus navigation within the full task view.
 * Pattern: fullTask.*
 *
 * FullTask has three panels:
 * - meta: Task metadata (priority, category, assignees, tags, dates)
 * - editor: Title, description, notes
 * - subtasks: Subtask kanban board
 *
 * Path format:
 * - fullTask.{stackIndex}.meta.{itemIndex}
 * - fullTask.{stackIndex}.editor.{field} (title, description, notes)
 * - fullTask.{stackIndex}.subtasks.{item}
 */

import type { NavigationHandler, ActionResult, ParsedFocusPath, Action, NavigationContext } from '../types'
import { buildPath, extractTaskId } from '../pathUtils'

// Editor panel fields in order
const EDITOR_FIELDS = ['title', 'description', 'notes']

export const fullTaskHandler: NavigationHandler = {
  pattern: /^fullTask\./,

  handle(
    path: ParsedFocusPath,
    action: Action,
    ctx: NavigationContext
  ): ActionResult | null {
    const { ui, task } = ctx.stores
    const stackIndex = path.stackIndex ?? 0

    // Get the current task from the stack
    const taskId = ui.fullTaskStack[stackIndex]
    if (!taskId) return null

    const currentTask = task.getTask(taskId)
    if (!currentTask) return null

    switch (action) {
      case 'back': {
        // Close this fullTask layer
        return {
          handled: true,
          effect: () => {
            ui.closeFullTask()
            ctx.focus.popLayer()
          },
        }
      }

      case 'save': {
        // Save and close
        return {
          handled: true,
          effect: () => {
            ui.closeFullTask()
            ctx.focus.popLayer()
          },
        }
      }

      default:
        break
    }

    // Panel-specific navigation
    switch (path.area) {
      case 'meta':
        return handleMetaPanel(path, action, ctx, stackIndex)

      case 'editor':
        return handleEditorPanel(path, action, ctx, stackIndex)

      case 'subtasks':
        return handleSubtasksPanel(path, action, ctx, stackIndex, currentTask)

      default:
        return null
    }
  },
}

/**
 * Handle navigation in meta panel (left sidebar)
 * Meta items are navigated by index. The component will handle rendering
 * based on the focusStore path.
 */
function handleMetaPanel(
  path: ParsedFocusPath,
  action: Action,
  ctx: NavigationContext,
  stackIndex: number
): ActionResult | null {
  // Get the item count from configStore
  const { config } = ctx.stores

  // Calculate total meta items count
  // Priority + Category + Assignees + Tags + Date fields (4)
  const itemCount =
    config.priorities.length +
    config.categories.length +
    config.users.length +
    config.tags.length +
    4 // 4 date fields

  // Parse current index from path item (e.g., "0", "1", "2")
  const currentIndex = path.item ? parseInt(path.item, 10) : 0

  switch (action) {
    case 'up': {
      if (currentIndex > 0) {
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'meta',
            item: String(currentIndex - 1),
          }),
        }
      }
      return { handled: true }
    }

    case 'down': {
      if (currentIndex < itemCount - 1) {
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'meta',
            item: String(currentIndex + 1),
          }),
        }
      }
      return { handled: true }
    }

    case 'left': {
      // Already at left edge
      return { handled: true }
    }

    case 'right': {
      // Move to editor panel
      return {
        handled: true,
        newPath: buildPath({
          layer: 'fullTask',
          stackIndex,
          area: 'editor',
          item: 'title',
        }),
      }
    }

    case 'select': {
      // Toggle/select the current meta item
      return {
        handled: true,
        effect: () => {
          const event = new CustomEvent('meta-item-select', {
            detail: { index: currentIndex }
          })
          window.dispatchEvent(event)
        },
      }
    }

    default:
      return null
  }
}

/**
 * Handle navigation in editor panel (center)
 */
function handleEditorPanel(
  path: ParsedFocusPath,
  action: Action,
  _ctx: NavigationContext,
  stackIndex: number
): ActionResult | null {
  const currentIndex = path.item ? EDITOR_FIELDS.indexOf(path.item) : 0

  switch (action) {
    case 'up': {
      if (currentIndex > 0) {
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'editor',
            item: EDITOR_FIELDS[currentIndex - 1],
          }),
        }
      }
      return { handled: true }
    }

    case 'down': {
      if (currentIndex < EDITOR_FIELDS.length - 1) {
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'editor',
            item: EDITOR_FIELDS[currentIndex + 1],
          }),
        }
      }
      return { handled: true }
    }

    case 'left': {
      // Move to meta panel
      return {
        handled: true,
        newPath: buildPath({
          layer: 'fullTask',
          stackIndex,
          area: 'meta',
          item: '0',
        }),
      }
    }

    case 'right': {
      // Move to subtasks panel
      return {
        handled: true,
        newPath: buildPath({
          layer: 'fullTask',
          stackIndex,
          area: 'subtasks',
          item: 'new-subtask',
        }),
      }
    }

    case 'select': {
      // Focus the current field for editing
      return {
        handled: true,
        effect: () => {
          const event = new CustomEvent('editor-field-focus', {
            detail: { field: path.item }
          })
          window.dispatchEvent(event)
        },
      }
    }

    default:
      return null
  }
}

/**
 * Handle navigation in subtasks panel (right bar)
 */
function handleSubtasksPanel(
  path: ParsedFocusPath,
  action: Action,
  ctx: NavigationContext,
  stackIndex: number,
  parentTask: NonNullable<ReturnType<typeof ctx.stores.task.getTask>>
): ActionResult | null {
  const { task, ui, config } = ctx.stores

  // Get subtasks
  const parentTaskId = parentTask.id
  const subtasks = task.getSubtasks(parentTaskId)
  const columns = config.columns

  // Parse current position
  let currentColIndex = 0
  let currentItemIndex = 0 // 0 = new-subtask, 1+ = tasks

  if (path.item === 'new-subtask') {
    currentItemIndex = 0
  } else if (path.item?.startsWith('subtask-')) {
    const subtaskId = extractTaskId(path.item)
    if (subtaskId) {
      const subtask = task.getTask(subtaskId)
      if (subtask) {
        currentColIndex = columns.findIndex(c => c.id === subtask.status)
        const colSubtasks = subtasks.filter(s => s.status === subtask.status)
        currentItemIndex = colSubtasks.findIndex(s => s.id === subtaskId) + 1
      }
    }
  }

  const currentColumn = columns[currentColIndex]
  const columnSubtasks = currentColumn
    ? subtasks.filter(s => s.status === currentColumn.id)
    : []

  switch (action) {
    case 'up': {
      if (currentItemIndex > 0) {
        const newIndex = currentItemIndex - 1
        const newItem = newIndex === 0
          ? 'new-subtask'
          : `subtask-${columnSubtasks[newIndex - 1].id.replace('TASK-', '').toLowerCase()}`
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'subtasks',
            item: newItem,
          }),
        }
      }
      return { handled: true }
    }

    case 'down': {
      if (currentItemIndex < columnSubtasks.length) {
        const newIndex = currentItemIndex + 1
        const newItem = `subtask-${columnSubtasks[newIndex - 1].id.replace('TASK-', '').toLowerCase()}`
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'subtasks',
            item: newItem,
          }),
        }
      }
      return { handled: true }
    }

    case 'left': {
      if (currentColIndex > 0) {
        // Move to previous column in subtasks
        const prevColumn = columns[currentColIndex - 1]
        const prevSubtasks = subtasks.filter(s => s.status === prevColumn.id)
        const newItemIndex = Math.min(currentItemIndex, prevSubtasks.length)
        const newItem = newItemIndex === 0
          ? 'new-subtask'
          : `subtask-${prevSubtasks[newItemIndex - 1].id.replace('TASK-', '').toLowerCase()}`
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'subtasks',
            item: newItem,
          }),
        }
      }
      // Move to editor panel
      return {
        handled: true,
        newPath: buildPath({
          layer: 'fullTask',
          stackIndex,
          area: 'editor',
          item: 'title',
        }),
      }
    }

    case 'right': {
      if (currentColIndex < columns.length - 1) {
        const nextColumn = columns[currentColIndex + 1]
        const nextSubtasks = subtasks.filter(s => s.status === nextColumn.id)
        const newItemIndex = Math.min(currentItemIndex, nextSubtasks.length)
        const newItem = newItemIndex === 0
          ? 'new-subtask'
          : `subtask-${nextSubtasks[newItemIndex - 1].id.replace('TASK-', '').toLowerCase()}`
        return {
          handled: true,
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'subtasks',
            item: newItem,
          }),
        }
      }
      return { handled: true }
    }

    case 'select': {
      if (path.item === 'new-subtask') {
        // Create new subtask and open it
        return {
          handled: true,
          effect: () => {
            const newSubtask = task.createTask(
              currentColumn?.id || columns[0].id,
              { title: '', parentId: parentTaskId }
            )
            ui.openFullTask(newSubtask.id, true)
            ctx.focus.pushLayer(`fullTask.${ui.fullTaskStack.length - 1}.editor.title`)
          },
        }
      } else {
        // Open existing subtask
        const subtaskId = extractTaskId(path.item)
        if (subtaskId) {
          return {
            handled: true,
            effect: () => {
              ui.openFullTask(subtaskId)
              ctx.focus.pushLayer(`fullTask.${ui.fullTaskStack.length - 1}.editor.title`)
            },
          }
        }
      }
      return null
    }

    case 'delete': {
      const subtaskId = extractTaskId(path.item)
      if (subtaskId) {
        const subtask = task.getTask(subtaskId)
        if (subtask) {
          return {
            handled: true,
            effect: () => {
              ui.showConfirm(
                '删除子任务',
                `确定要删除子任务 "${subtask.title}" 吗？`,
                () => {
                  task.deleteTask(subtaskId)
                  ui.hideConfirm()
                }
              )
              ctx.focus.pushLayer('dialog.confirm')
            },
          }
        }
      }
      return null
    }

    case 'move-left': {
      const subtaskId = extractTaskId(path.item)
      if (subtaskId && currentColIndex > 0) {
        const prevColumn = columns[currentColIndex - 1]
        return {
          handled: true,
          effect: () => {
            task.moveTask(subtaskId, prevColumn.id)
          },
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'subtasks',
            item: path.item,
          }),
        }
      }
      return { handled: true }
    }

    case 'move-right': {
      const subtaskId = extractTaskId(path.item)
      if (subtaskId && currentColIndex < columns.length - 1) {
        const nextColumn = columns[currentColIndex + 1]
        return {
          handled: true,
          effect: () => {
            task.moveTask(subtaskId, nextColumn.id)
          },
          newPath: buildPath({
            layer: 'fullTask',
            stackIndex,
            area: 'subtasks',
            item: path.item,
          }),
        }
      }
      return { handled: true }
    }

    default:
      return null
  }
}
