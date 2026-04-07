'use client'

import { useMemo } from 'react'
import { computeLayout } from '@/lib/tree/layout'
import { buildShortcutTargetMap } from '@/lib/tree/shortcuts'
import type { PersonRow, PartnershipRow, ParentChildRow, RootRow } from '@/lib/supabase/types'
import type { LayoutedRoot } from '@/types'

interface UseTreeLayoutResult {
  /** One entry per root, each with positioned nodes and edges */
  layoutedRoots: LayoutedRoot[]
  /**
   * Map of shortcut person id → { x, y, originalPersonId }
   * Used by canvas to pan-to on shortcut click
   */
  shortcutTargetMap: Map<string, { x: number; y: number; originalPersonId: string }>
  /** Flat list of all people with computed positions (for minimap, search, etc.) */
  allPositionedPeople: Array<PersonRow & { computedX: number; computedY: number }>
}

export function useTreeLayout(
  roots: RootRow[],
  people: PersonRow[],
  partnerships: PartnershipRow[],
  parentChildRows: ParentChildRow[],
): UseTreeLayoutResult {
  const layoutedRoots = useMemo(() => {
    if (roots.length === 0 || people.length === 0) return []
    return computeLayout(roots, people, partnerships, parentChildRows)
  }, [roots, people, partnerships, parentChildRows])

  const shortcutTargetMap = useMemo(() => {
    return buildShortcutTargetMap(layoutedRoots)
  }, [layoutedRoots])

  const allPositionedPeople = useMemo(() => {
    return layoutedRoots.flatMap(lr =>
      lr.allNodes.map(node => ({
        ...node.person,
        computedX: node.x,
        computedY: node.y,
      }))
    )
  }, [layoutedRoots])

  return { layoutedRoots, shortcutTargetMap, allPositionedPeople }
}