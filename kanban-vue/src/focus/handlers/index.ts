/**
 * Navigation Handlers Registry
 *
 * This module exports all navigation handlers in the order they should be checked.
 * Order matters: more specific handlers should come before general ones.
 *
 * Each handler is responsible for a specific focus area:
 * - dialog: Modal dialogs (confirm, prompt, etc.)
 * - search: Search overlay
 * - fullTask: Full task view with meta, editor, subtasks panels
 * - kanbanBoard: Kanban board columns and tasks
 * - kanbanSidebar: Sidebar with projects
 * - global: Cross-cutting actions (search toggle, save)
 */

import type { NavigationHandler } from '../types'
import { dialogHandler } from './dialog'
import { searchHandler } from './search'
import { fullTaskHandler } from './fullTask'
import { kanbanBoardHandler } from './kanbanBoard'
import { kanbanSidebarHandler } from './kanbanSidebar'
import { globalHandler } from './global'

/**
 * All navigation handlers in priority order
 *
 * The order here is important:
 * 1. Dialog - highest priority, modal blocking
 * 2. Search - overlay, should handle before underlying content
 * 3. FullTask - task detail modal
 * 4. Kanban Board - main board content
 * 5. Kanban Sidebar - sidebar navigation
 * 6. Global - catch-all for global actions
 */
export const navigationHandlers: NavigationHandler[] = [
  dialogHandler,
  searchHandler,
  fullTaskHandler,
  kanbanBoardHandler,
  kanbanSidebarHandler,
  globalHandler,
]

// Re-export individual handlers for testing
export {
  dialogHandler,
  searchHandler,
  fullTaskHandler,
  kanbanBoardHandler,
  kanbanSidebarHandler,
  globalHandler,
}
