/**
 * Task Binding Composable
 *
 * Provides reactive task data binding using Vue's computed getter/setter pattern.
 * This ensures single source of truth (the store) while allowing v-model style bindings.
 *
 * Usage:
 * ```ts
 * const { task, title, description, updateField } = useTaskBinding(taskId)
 *
 * // In template:
 * <input v-model="title" />
 * <textarea v-model="description" />
 * ```
 */

import { computed, type ComputedRef, type Ref, toRef } from 'vue'
import { useTaskStore } from '@/stores'
import type { Task } from '@/types'

export interface TaskBinding {
  // The reactive task object (read-only, use field setters to update)
  task: ComputedRef<Task | undefined>

  // Individual field bindings with v-model support
  title: ComputedRef<string>
  description: ComputedRef<string>
  notes: ComputedRef<string>
  priority: ComputedRef<string>
  category: ComputedRef<string>
  assignees: ComputedRef<string[]>
  tags: ComputedRef<string[]>
  created: ComputedRef<string>
  started: ComputedRef<string>
  due: ComputedRef<string>
  completed: ComputedRef<string>
  status: ComputedRef<string>
  parentId: ComputedRef<string | undefined>

  // Update methods
  updateField: <K extends keyof Task>(field: K, value: Task[K]) => void
  updateFields: (updates: Partial<Task>) => void
}

/**
 * Create reactive bindings to a task in the store
 *
 * @param taskId - The task ID (can be a ref or getter for reactivity)
 */
export function useTaskBinding(
  taskId: string | Ref<string> | (() => string)
): TaskBinding {
  const taskStore = useTaskStore()

  // Normalize taskId to a getter function
  const getId = (): string => {
    if (typeof taskId === 'function') return taskId()
    if (typeof taskId === 'object' && 'value' in taskId) return taskId.value
    return taskId
  }

  // Core task computed - reactive to store changes
  const task = computed(() => taskStore.getTask(getId()))

  // Helper to create a computed with getter/setter for a field
  function createFieldBinding<K extends keyof Task>(field: K) {
    return computed({
      get: () => {
        const t = task.value
        return t ? t[field] : ('' as Task[K])
      },
      set: (value: Task[K]) => {
        const id = getId()
        if (id) {
          taskStore.updateTask(id, { [field]: value } as Partial<Task>)
        }
      },
    })
  }

  // Update a single field
  function updateField<K extends keyof Task>(field: K, value: Task[K]) {
    const id = getId()
    if (id) {
      taskStore.updateTask(id, { [field]: value } as Partial<Task>)
    }
  }

  // Update multiple fields at once
  function updateFields(updates: Partial<Task>) {
    const id = getId()
    if (id) {
      taskStore.updateTask(id, updates)
    }
  }

  return {
    task,
    title: createFieldBinding('title'),
    description: createFieldBinding('description'),
    notes: createFieldBinding('notes'),
    priority: createFieldBinding('priority'),
    category: createFieldBinding('category'),
    assignees: createFieldBinding('assignees'),
    tags: createFieldBinding('tags'),
    created: createFieldBinding('created'),
    started: createFieldBinding('started'),
    due: createFieldBinding('due'),
    completed: createFieldBinding('completed'),
    status: createFieldBinding('status'),
    parentId: createFieldBinding('parentId'),
    updateField,
    updateFields,
  }
}

/**
 * Check if a task is empty (no meaningful content)
 */
export function isTaskEmpty(task: Task | undefined): boolean {
  if (!task) return true
  return !task.title.trim()
}
