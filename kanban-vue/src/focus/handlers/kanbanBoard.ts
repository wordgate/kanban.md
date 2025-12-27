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

    // Determine current item index within column
    // new-task is index 0, tasks are 1+
    let currentItemIndex = 0
    if (path.item === 'new-task') {
      currentItemIndex = 0
    } else if (path.item) {
      const taskId = extractTaskId(path.item)
      const taskIndex = columnTasks.findIndex(t => t.id === taskId)
      currentItemIndex = taskIndex >= 0 ? taskIndex + 1 : 0
    }

    switch (action) {
      case 'up': {
        if (currentItemIndex > 0) {
          // Move up within column
          const newIndex = currentItemIndex - 1
          const newItem = newIndex === 0
            ? 'new-task'
            : taskIdToPathItem(columnTasks[newIndex - 1].id)
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
        if (currentItemIndex < columnTasks.length) {
          const newIndex = currentItemIndex + 1
          const newItem = taskIdToPathItem(columnTasks[newIndex - 1].id)
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
          // Clamp item index to new column's task count
          const newItemIndex = Math.min(currentItemIndex, prevTasks.length)
          const newItem = newItemIndex === 0
            ? 'new-task'
            : taskIdToPathItem(prevTasks[newItemIndex - 1].id)
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
          const newItemIndex = Math.min(currentItemIndex, nextTasks.length)
          const newItem = newItemIndex === 0
            ? 'new-task'
            : taskIdToPathItem(nextTasks[newItemIndex - 1].id)
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
