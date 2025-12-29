/**
 * Kanban Board Navigation Handler
 *
 * Handles focus navigation within the kanban board area.
 * Pattern: kanban.board.*
 */

import type { NavigationHandler, ActionResult, ParsedFocusPath, Action, NavigationContext } from '../types'
import { buildPath, extractTaskId, taskIdToPathItem } from '../pathUtils'

export const kanbanBoardHandler: NavigationHandler = {
  pattern: /^kanban\.board\./,

  handle(
    path: ParsedFocusPath,
    action: Action,
    ctx: NavigationContext
  ): ActionResult | null {
    const { config, task, ui } = ctx.stores
    const columns = config.columns

    // Find current column index
    const currentColIndex = columns.findIndex(c => c.id === path.container)
    if (currentColIndex === -1 && path.container) return null

    const column = columns[currentColIndex]
    const columnTasks = column ? task.tasksByColumn(column.id) : []

    // Determine if this is the first column (only first column has new-task)
    const isFirstColumn = currentColIndex === 0

    // Determine current item index within column
    // For first column: new-task is index 0, tasks are 1+
    // For other columns: tasks start at index 0
    let currentItemIndex = 0
    if (path.item === 'new-task') {
      currentItemIndex = 0
    } else if (path.item) {
      const taskId = extractTaskId(path.item)
      const taskIndex = columnTasks.findIndex(t => t.id === taskId)
      // For first column, tasks start at index 1; for others, at index 0
      currentItemIndex = taskIndex >= 0 ? (isFirstColumn ? taskIndex + 1 : taskIndex) : 0
    }

    switch (action) {
      case 'up': {
        if (currentItemIndex > 0) {
          // Move up within column
          const newIndex = currentItemIndex - 1
          let newItem: string
          if (isFirstColumn) {
            // First column has new-task at index 0
            newItem = newIndex === 0
              ? 'new-task'
              : taskIdToPathItem(columnTasks[newIndex - 1].id)
          } else {
            // Other columns: directly use task at newIndex
            newItem = taskIdToPathItem(columnTasks[newIndex].id)
          }
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: path.container,
              item: newItem,
            }),
          }
        }
        return { handled: true } // At top, do nothing
      }

      case 'down': {
        // Calculate max index based on column type
        const maxIndex = isFirstColumn ? columnTasks.length : columnTasks.length - 1
        if (currentItemIndex < maxIndex) {
          const newIndex = currentItemIndex + 1
          // For first column, tasks are at index 1+, so use newIndex - 1
          // For other columns, tasks are at index 0+, so use newIndex
          const taskArrayIndex = isFirstColumn ? newIndex - 1 : newIndex
          const newItem = taskIdToPathItem(columnTasks[taskArrayIndex].id)
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: path.container,
              item: newItem,
            }),
          }
        }
        return { handled: true } // At bottom, do nothing
      }

      case 'left': {
        if (currentColIndex > 0) {
          // Move to previous column
          const prevColumn = columns[currentColIndex - 1]
          const prevTasks = task.tasksByColumn(prevColumn.id)
          const prevIsFirstColumn = currentColIndex - 1 === 0

          // Calculate new item index for previous column
          let newItem: string
          if (prevIsFirstColumn) {
            // Previous column has new-task, clamp to available items (0 = new-task, 1+ = tasks)
            const newItemIndex = Math.min(currentItemIndex, prevTasks.length)
            newItem = newItemIndex === 0
              ? 'new-task'
              : taskIdToPathItem(prevTasks[newItemIndex - 1].id)
          } else {
            // Previous column has no new-task, clamp to tasks only
            const newItemIndex = Math.min(currentItemIndex, Math.max(0, prevTasks.length - 1))
            newItem = prevTasks.length > 0
              ? taskIdToPathItem(prevTasks[newItemIndex].id)
              : taskIdToPathItem('') // Empty column edge case
          }
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: prevColumn.id,
              item: newItem,
            }),
          }
        } else {
          // Move to sidebar
          return {
            handled: true,
            newPath: 'kanban.sidebar',
          }
        }
      }

      case 'right': {
        if (currentColIndex < columns.length - 1) {
          const nextColumn = columns[currentColIndex + 1]
          const nextTasks = task.tasksByColumn(nextColumn.id)
          // Next column is never the first column, so no new-task
          const newItemIndex = Math.min(currentItemIndex, Math.max(0, nextTasks.length - 1))
          const newItem = nextTasks.length > 0
            ? taskIdToPathItem(nextTasks[newItemIndex].id)
            : taskIdToPathItem('') // Empty column edge case
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: nextColumn.id,
              item: newItem,
            }),
          }
        }
        return { handled: true } // At rightmost column
      }

      case 'select': {
        if (path.item === 'new-task') {
          // Create new task and open in fullTask
          return {
            handled: true,
            effect: () => {
              const newTask = task.createTask(path.container!, { title: '' })
              ui.openFullTask(newTask.id, true)
              ctx.focus.pushLayer(`fullTask.${ui.fullTaskStack.length - 1}.editor.title`)
            },
          }
        } else {
          // Open existing task
          const taskId = extractTaskId(path.item)
          if (taskId) {
            return {
              handled: true,
              effect: () => {
                ui.openFullTask(taskId)
                ctx.focus.pushLayer(`fullTask.${ui.fullTaskStack.length - 1}.editor.title`)
              },
            }
          }
        }
        return null
      }

      case 'delete': {
        const taskId = extractTaskId(path.item)
        if (taskId) {
          return {
            handled: true,
            effect: () => {
              const theTask = task.getTask(taskId)
              if (theTask) {
                ui.showConfirm(
                  '删除任务',
                  `确定要删除任务 "${theTask.title}" 吗？`,
                  () => {
                    task.deleteTask(taskId)
                    ui.hideConfirm()
                  }
                )
                ctx.focus.pushLayer('dialog.confirm')
              }
            },
          }
        }
        return null
      }

      case 'move-left': {
        const taskId = extractTaskId(path.item)
        if (taskId && currentColIndex > 0) {
          const prevColumn = columns[currentColIndex - 1]
          return {
            handled: true,
            effect: () => {
              task.moveTask(taskId, prevColumn.id)
            },
            // Focus follows the task to the new column
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: prevColumn.id,
              item: path.item,
            }),
          }
        }
        return { handled: true }
      }

      case 'move-right': {
        const taskId = extractTaskId(path.item)
        if (taskId && currentColIndex < columns.length - 1) {
          const nextColumn = columns[currentColIndex + 1]
          return {
            handled: true,
            effect: () => {
              task.moveTask(taskId, nextColumn.id)
            },
            // Focus follows the task to the new column
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: nextColumn.id,
              item: path.item,
            }),
          }
        }
        return { handled: true }
      }

      default:
        return null
    }
  },
}
