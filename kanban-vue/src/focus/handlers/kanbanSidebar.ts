/**
 * Kanban Sidebar Navigation Handler
 *
 * Handles focus navigation within the sidebar area.
 * Pattern: kanban.sidebar.*
 */

import type { NavigationHandler, ActionResult, ParsedFocusPath, Action, NavigationContext } from '../types'
import { buildPath, extractProjectId, projectIdToPathItem } from '../pathUtils'
import { useProjectData } from '@/composables/useProjectData'

export const kanbanSidebarHandler: NavigationHandler = {
  pattern: /^kanban\.sidebar/,

  handle(
    path: ParsedFocusPath,
    action: Action,
    ctx: NavigationContext
  ): ActionResult | null {
    const { project, config, ui } = ctx.stores

    // Get all projects for navigation
    const projects = project.projects

    // Find current project index
    let currentIndex = -1
    const currentProjectId = extractProjectId(path.item)
    if (currentProjectId) {
      currentIndex = projects.findIndex(p => p.name === currentProjectId)
    }

    switch (action) {
      case 'up': {
        if (currentIndex > 0) {
          const prevProject = projects[currentIndex - 1]
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'sidebar',
              item: projectIdToPathItem(prevProject.name),
            }),
          }
        }
        return { handled: true } // At top, do nothing
      }

      case 'down': {
        if (currentIndex < projects.length - 1) {
          const nextProject = projects[currentIndex + 1]
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'sidebar',
              item: projectIdToPathItem(nextProject.name),
            }),
          }
        }
        return { handled: true } // At bottom, do nothing
      }

      case 'left': {
        // Already at left edge
        return { handled: true }
      }

      case 'right': {
        // Move to board - first column, new-task
        const columns = config.columns
        if (columns.length > 0) {
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: columns[0].id,
              item: 'new-task',
            }),
          }
        }
        return { handled: true }
      }

      case 'select': {
        // Load/switch to selected project
        if (currentProjectId) {
          const projectData = projects.find(p => p.name === currentProjectId)
          if (projectData) {
            return {
              handled: true,
              effect: async () => {
                const { switchProject } = useProjectData()
                await switchProject(projectData.id)
              },
            }
          }
        }
        return null
      }

      case 'back': {
        // Move focus to board
        const columns = config.columns
        if (columns.length > 0) {
          return {
            handled: true,
            newPath: buildPath({
              layer: 'kanban',
              area: 'board',
              container: columns[0].id,
              item: 'new-task',
            }),
          }
        }
        return { handled: true }
      }

      case 'delete': {
        // Show delete project dialog
        if (currentProjectId) {
          const projectData = projects.find(p => p.name === currentProjectId)
          if (projectData) {
            return {
              handled: true,
              effect: () => {
                ui.showConfirm(
                  '删除项目',
                  `确定要删除项目 "${projectData.name}" 吗？`,
                  () => {
                    project.deleteProject(projectData.name)
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

      default:
        return null
    }
  },
}
