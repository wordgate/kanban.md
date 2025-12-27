import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Project Store - Sorting', () => {
  describe('project sorting logic', () => {
    const sortByCreationTime = (projects: Array<{ id: string; lastAccess: number }>) => {
      return [...projects].sort((a, b) => {
        const timeA = parseInt(a.id.replace('project-', '')) || 0
        const timeB = parseInt(b.id.replace('project-', '')) || 0
        return timeA - timeB
      })
    }

    it('should sort projects by creation time (ascending)', () => {
      const projects = [
        { id: 'project-1703001000000', lastAccess: 1703005000000 },
        { id: 'project-1703000000000', lastAccess: 1703006000000 },
        { id: 'project-1703002000000', lastAccess: 1703004000000 },
      ]

      const sorted = sortByCreationTime(projects)

      expect(sorted[0].id).toBe('project-1703000000000')
      expect(sorted[1].id).toBe('project-1703001000000')
      expect(sorted[2].id).toBe('project-1703002000000')
    })

    it('should maintain stable order regardless of lastAccess', () => {
      const projects = [
        { id: 'project-1000', lastAccess: 5000 },
        { id: 'project-2000', lastAccess: 1000 },
        { id: 'project-3000', lastAccess: 9999 },
      ]

      // Simulate multiple sorts (as would happen after each access)
      let sorted = sortByCreationTime(projects)
      sorted = sortByCreationTime(sorted)
      sorted = sortByCreationTime(sorted)

      // Order should always be the same
      expect(sorted[0].id).toBe('project-1000')
      expect(sorted[1].id).toBe('project-2000')
      expect(sorted[2].id).toBe('project-3000')
    })

    it('should handle invalid project ids gracefully', () => {
      const projects = [
        { id: 'project-1000', lastAccess: 1000 },
        { id: 'invalid-id', lastAccess: 2000 },
        { id: 'project-500', lastAccess: 3000 },
      ]

      const sorted = sortByCreationTime(projects)

      // Invalid id should be treated as 0 and come first
      expect(sorted[0].id).toBe('invalid-id')
      expect(sorted[1].id).toBe('project-500')
      expect(sorted[2].id).toBe('project-1000')
    })

    it('should not change order when accessing different projects', () => {
      const projects = [
        { id: 'project-100', lastAccess: 100 },
        { id: 'project-200', lastAccess: 200 },
        { id: 'project-300', lastAccess: 300 },
      ]

      // Simulate accessing project-300 (update lastAccess)
      projects[2].lastAccess = Date.now()
      const sorted1 = sortByCreationTime(projects)

      // Simulate accessing project-100 (update lastAccess)
      projects[0].lastAccess = Date.now() + 1000
      const sorted2 = sortByCreationTime(projects)

      // Order should remain the same
      expect(sorted1.map(p => p.id)).toEqual(sorted2.map(p => p.id))
      expect(sorted1[0].id).toBe('project-100')
      expect(sorted1[1].id).toBe('project-200')
      expect(sorted1[2].id).toBe('project-300')
    })
  })

  describe('old sorting behavior (for comparison)', () => {
    const sortByLastAccess = (projects: Array<{ id: string; lastAccess: number }>) => {
      return [...projects].sort((a, b) => b.lastAccess - a.lastAccess)
    }

    it('demonstrates the problem with lastAccess sorting', () => {
      const projects = [
        { id: 'project-A', lastAccess: 1000 },
        { id: 'project-B', lastAccess: 2000 },
        { id: 'project-C', lastAccess: 3000 },
      ]

      // Initial order: C, B, A (most recent first)
      let sorted = sortByLastAccess(projects)
      expect(sorted[0].id).toBe('project-C')

      // User accesses project A
      projects[0].lastAccess = 4000
      sorted = sortByLastAccess(projects)

      // Order changes to: A, C, B - this is the problem!
      expect(sorted[0].id).toBe('project-A')
      expect(sorted[1].id).toBe('project-C')
      expect(sorted[2].id).toBe('project-B')
    })
  })
})
