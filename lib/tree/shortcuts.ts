// lib/tree/shortcuts.ts
//
// Resolves shortcut nodes: when a person from another family is a partner
// in this family, they appear as a shortcut node with a distinct color.
// Clicking them pans the canvas to their original position.

import type { PersonRow } from '@/lib/supabase/types'
import type { TreeNode, LayoutedRoot } from '@/types'

/**
 * Given all laid-out roots and all people, return a map of:
 *   shortcut person id → original TreeNode position
 *
 * This is used by the canvas to know where to pan when a shortcut is clicked.
 */
export function buildShortcutTargetMap(
  layoutedRoots: LayoutedRoot[],
): Map<string, { x: number; y: number; originalPersonId: string }> {
  const map = new Map<string, { x: number; y: number; originalPersonId: string }>()

  // Flatten all nodes across all roots
  const allNodes = layoutedRoots.flatMap(lr => lr.allNodes)

  for (const node of allNodes) {
    if (node.person.is_shortcut && node.person.original_person_id) {
      // DB shortcut node (cross-family): key = shortcut's id, value = original's position.
      // handleNavigateToOriginal reaches this via the value-search fallback.
      const originalNode = allNodes.find(
        n => n.person.id === node.person.original_person_id
      )
      if (originalNode) {
        map.set(node.person.id, {
          x: originalNode.x,
          y: originalNode.y,
          originalPersonId: originalNode.person.id,
        })
      }
    } else if (node.isReference) {
      // Virtual reference node (same- or cross-family partner already placed elsewhere).
      // key = the real person's id so handleNavigateToOriginal finds it via direct lookup.
      const realNode = allNodes.find(
        n => n.person.id === node.person.id && !n.isReference
      )
      if (realNode) {
        map.set(node.person.id, {
          x: realNode.x,
          y: realNode.y,
          originalPersonId: realNode.person.id,
        })
      }
    }
  }

  return map
}

/**
 * When creating a cross-family partnership (cousin marriage scenario),
 * we create a shortcut node in the target family pointing to the original person.
 *
 * This helper returns the data needed to insert the shortcut person row.
 */
export function buildShortcutPersonData(
  originalPerson: PersonRow,
  targetRootId: string,
  placeholderX: number,
  placeholderY: number,
): Omit<PersonRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    name: originalPerson.name,
    nickname: originalPerson.nickname,
    birth_date: originalPerson.birth_date,
    bio: originalPerson.bio,
    photo_url: originalPerson.photo_url,
    mother_id: null,      // shortcuts don't carry lineage
    root_id: targetRootId,
    is_shortcut: true,
    original_person_id: originalPerson.id,
    gender: originalPerson.gender,
    canvas_x: placeholderX,
    canvas_y: placeholderY,
  }
}

/**
 * Checks whether two people are already linked via a shortcut
 * (either direction) to avoid creating duplicate shortcuts.
 */
export function shortcutAlreadyExists(
  personAId: string,
  personBId: string,
  allPeople: PersonRow[],
): boolean {
  return allPeople.some(
    p =>
      p.is_shortcut &&
      (
        (p.id === personAId && p.original_person_id === personBId) ||
        (p.id === personBId && p.original_person_id === personAId) ||
        p.original_person_id === personAId ||
        p.original_person_id === personBId
      )
  )
}