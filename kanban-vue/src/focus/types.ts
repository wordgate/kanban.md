/**
 * Focus Path + Action System Types
 *
 * This module defines the core types for the unified focus management system.
 * Focus is represented as a semantic path (e.g., "kanban.board.todo.task-001")
 * rather than numeric indices.
 */

/**
 * Semantic path identifying a focusable element
 *
 * Format: "layer.area.container.item"
 *
 * Examples:
 *   - "kanban.sidebar.project-abc"
 *   - "kanban.board.todo.new-task"
 *   - "kanban.board.in-progress.task-001"
 *   - "fullTask.0.meta.priority-high"
 *   - "fullTask.0.editor.title"
 *   - "fullTask.1.subtasks.task-002"
 *   - "dialog.confirm"
 *   - "search.input"
 */
export type FocusPath = string

/**
 * Parsed focus path for easy manipulation
 */
export interface ParsedFocusPath {
  /** Top-level layer */
  layer: 'kanban' | 'fullTask' | 'dialog' | 'search'
  /** For fullTask, this is the stack index (0, 1, 2...) */
  stackIndex?: number
  /** The area within the layer */
  area?: 'sidebar' | 'board' | 'meta' | 'editor' | 'subtasks'
  /** Container within the area (column id, section id) */
  container?: string
  /** The specific item (task id, field name) */
  item?: string
}

/**
 * Semantic actions that can be performed
 * These are abstract actions, not tied to specific keys
 */
export type Action =
  | 'up'          // Move focus up
  | 'down'        // Move focus down
  | 'left'        // Move focus left
  | 'right'       // Move focus right
  | 'select'      // Activate focused item (Enter/Space)
  | 'back'        // Go back/close (Escape)
  | 'delete'      // Delete focused item
  | 'move-left'   // Move task to previous column (Cmd+Left)
  | 'move-right'  // Move task to next column (Cmd+Right)
  | 'search'      // Toggle search mode (Cmd+F)
  | 'save'        // Save and close (Cmd+S)

/**
 * Key binding configuration
 */
export interface KeyBinding {
  /** The key (KeyboardEvent.key) */
  key: string
  /** Required modifiers */
  modifiers?: {
    ctrl?: boolean
    meta?: boolean  // Cmd on Mac
    shift?: boolean
    alt?: boolean
  }
  /** The action to trigger */
  action: Action
}

/**
 * Result of handling an action
 */
export interface ActionResult {
  /** Whether the action was handled */
  handled: boolean
  /** New focus path (if focus should change) */
  newPath?: FocusPath
  /** Side effect to execute (if any) */
  effect?: () => void | Promise<void>
}

/**
 * Context available to navigation handlers
 */
export interface NavigationContext {
  /** Current focus path (string) */
  currentPath: FocusPath
  /** Parsed current path */
  parsed: ParsedFocusPath
  /** Access to stores */
  stores: {
    config: ConfigStoreType
    task: TaskStoreType
    ui: UIStoreType
    project: ProjectStoreType
  }
  /** Focus actions */
  focus: {
    setPath: (path: FocusPath) => void
    pushLayer: (path: FocusPath) => void
    popLayer: () => FocusPath | null
  }
}

/**
 * Navigation handler for a specific focus area
 */
export interface NavigationHandler {
  /**
   * Path pattern this handler responds to
   * Can be a string prefix or RegExp
   */
  pattern: string | RegExp

  /**
   * Handle an action at the given path
   * Returns ActionResult if handled, null if not
   */
  handle: (
    path: ParsedFocusPath,
    action: Action,
    context: NavigationContext
  ) => ActionResult | null
}

// Store type placeholders (will be inferred from actual stores)
type ConfigStoreType = ReturnType<typeof import('@/stores').useConfigStore>
type TaskStoreType = ReturnType<typeof import('@/stores').useTaskStore>
type UIStoreType = ReturnType<typeof import('@/stores').useUIStore>
type ProjectStoreType = ReturnType<typeof import('@/stores').useProjectStore>
