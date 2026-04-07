// lib/tree/layout.ts
//
// Pure layout engine: takes raw DB rows and returns fully-positioned TreeNodes.
//
// Layout rules (from design spec):
//  - Tree grows top-down
//  - Partners sit side-by-side horizontally, connected by a marriage line
//  - Multiple partners all laid out horizontally
//  - All children listed below the person regardless of which partner is their mother
//  - Children are centered under their parent group

import type { PersonRow, PartnershipRow, ParentChildRow } from '@/lib/supabase/types'
import type { TreeNode, Edge, PartnershipEdge, LayoutedRoot } from '@/types'
import type { RootRow } from '@/lib/supabase/types'

// ── Constants ─────────────────────────────────────────────────────────────────

export const NODE_WIDTH = 150
export const NODE_HEIGHT = 160
export const H_GAP = 50    // horizontal gap between nodes on same level
export const V_GAP = 100   // vertical gap between generations
export const PARTNER_GAP = 24    // tight gap between a person and their partner(s)
export const ROOT_OFFSET_X = 180  // base X offset between separate family roots

// ── Public entry point ────────────────────────────────────────────────────────

/**
 * Given raw DB data, compute layout for all roots.
 * Returns one LayoutedRoot per root, each with fully-positioned nodes and edges.
 */
export function computeLayout(
  roots: RootRow[],
  people: PersonRow[],
  partnerships: PartnershipRow[],
  parentChildRows: ParentChildRow[],
): LayoutedRoot[] {
  // Build lookup maps
  const peopleById = new Map<string, PersonRow>(people.map(p => [p.id, p]))
  const partnerMap = buildPartnerMap(partnerships)
  const childrenMap = buildChildrenMap(parentChildRows)

  const results: LayoutedRoot[] = []
  let canvasOffsetX = 100 // starting X for the first root

  for (const root of roots) {
    // Find root person: the person in this root with no parent in parent_child
    // who is also not a shortcut
    const rootPeople = people.filter(p => p.root_id === root.id && !p.is_shortcut)
    const childIds = new Set(parentChildRows.map(pc => pc.child_id))
    const rootPerson = rootPeople.find(p => !childIds.has(p.id)) ?? rootPeople[0]

    if (!rootPerson) continue

    // Build tree recursively, starting with a temporary position
    const visited = new Set<string>()
    const rootNode = buildTreeNode(
      rootPerson,
      peopleById,
      partnerMap,
      childrenMap,
      visited,
    )

    // Compute subtree widths bottom-up, then assign x/y positions top-down
    const subtreeWidth = computeSubtreeWidth(rootNode)
    assignPositions(rootNode, canvasOffsetX, 100, partnerMap, childrenMap, peopleById)

    // Flatten all nodes
    const allNodes = flattenTree(rootNode)

    // Build edges
    const edges = buildEdges(allNodes)
    const partnershipEdges = buildPartnershipEdges(allNodes)

    results.push({ root, rootNode, allNodes, edges, partnershipEdges })

    // Next root starts after this one with a gap
    canvasOffsetX += subtreeWidth + ROOT_OFFSET_X
  }

  return results
}

// ── Tree building ─────────────────────────────────────────────────────────────

function buildTreeNode(
  person: PersonRow,
  peopleById: Map<string, PersonRow>,
  partnerMap: Map<string, string[]>,
  childrenMap: Map<string, string[]>,
  visited: Set<string>,
): TreeNode {
  visited.add(person.id)

  // Build partner nodes (laid out horizontally, never recursed into)
  const partnerIds = partnerMap.get(person.id) ?? []
  const partnerNodes: TreeNode[] = partnerIds
    .map(pid => peopleById.get(pid))
    .filter((p): p is PersonRow => !!p && !visited.has(p.id))
    .map(p => {
      visited.add(p.id)
      return { person: p, x: 0, y: 0, partners: [], children: [] }
    })

  // Build children nodes recursively.
  // Include children of same-root partners so that a child added through
  // the mother (parent_child.parent_id = mother.id) still appears under
  // the original/father node rather than going orphaned.
  const ownChildIds = childrenMap.get(person.id) ?? []
  const partnerChildIds = partnerNodes
    .filter(pn => pn.person.root_id === person.root_id)
    .flatMap(pn => childrenMap.get(pn.person.id) ?? [])
  const allChildIds = [...new Set([...ownChildIds, ...partnerChildIds])]

  const childNodes: TreeNode[] = allChildIds
    .map(cid => peopleById.get(cid))
    .filter((p): p is PersonRow => !!p && !visited.has(p.id))
    .map(p => buildTreeNode(p, peopleById, partnerMap, childrenMap, visited))

  return { person, x: 0, y: 0, partners: partnerNodes, children: childNodes }
}

// ── Width computation (bottom-up) ─────────────────────────────────────────────

function computeSubtreeWidth(node: TreeNode): number {
  // Width of the couple group: person + all partners
  const coupleCount = 1 + node.partners.length
  const coupleWidth = coupleCount * NODE_WIDTH + (coupleCount - 1) * PARTNER_GAP

  if (node.children.length === 0) return coupleWidth

  // Width of all children subtrees
  const childrenTotalWidth = node.children.reduce((sum, child) => {
    return sum + computeSubtreeWidth(child)
  }, 0) + (node.children.length - 1) * H_GAP

  return Math.max(coupleWidth, childrenTotalWidth)
}

// ── Position assignment (top-down) ────────────────────────────────────────────

function assignPositions(
  node: TreeNode,
  x: number,
  y: number,
  partnerMap: Map<string, string[]>,
  childrenMap: Map<string, string[]>,
  peopleById: Map<string, PersonRow>,
): void {
  const coupleCount = 1 + node.partners.length
  const coupleWidth = coupleCount * NODE_WIDTH + (coupleCount - 1) * PARTNER_GAP

  // Center the couple within the allocated subtree space so that children
  // (which may be wider than the couple) don't bleed into sibling territory.
  const subtreeW = computeSubtreeWidth(node)
  const coupleX = x + Math.max(0, subtreeW - coupleWidth) / 2

  // Place the main person
  node.x = coupleX
  node.y = y

  // Place partners immediately to the right
  let partnerX = coupleX + NODE_WIDTH + PARTNER_GAP
  for (const partner of node.partners) {
    partner.x = partnerX
    partner.y = y
    partnerX += NODE_WIDTH + PARTNER_GAP
  }

  if (node.children.length === 0) return

  // Total width needed for children row
  const childrenWidths = node.children.map(computeSubtreeWidth)
  const totalChildrenWidth =
    childrenWidths.reduce((a, b) => a + b, 0) +
    (node.children.length - 1) * H_GAP

  // Center children under the couple group
  const coupleMidX = coupleX + coupleWidth / 2
  let childX = coupleMidX - totalChildrenWidth / 2

  const childY = y + NODE_HEIGHT + V_GAP

  for (let i = 0; i < node.children.length; i++) {
    assignPositions(node.children[i], childX, childY, partnerMap, childrenMap, peopleById)
    childX += childrenWidths[i] + H_GAP
  }
}

// ── Flatten ───────────────────────────────────────────────────────────────────

export function flattenTree(node: TreeNode, result: TreeNode[] = []): TreeNode[] {
  result.push(node)
  for (const p of node.partners) result.push(p)
  for (const c of node.children) flattenTree(c, result)
  return result
}

// ── Edge building ─────────────────────────────────────────────────────────────

function buildEdges(nodes: TreeNode[]): Edge[] {
  const edges: Edge[] = []
  const nodeById = new Map(nodes.map(n => [n.person.id, n]))

  for (const node of nodes) {
    for (const child of node.children) {
      edges.push({
        id: `${node.person.id}->${child.person.id}`,
        fromX: node.x + NODE_WIDTH / 2,
        fromY: node.y + NODE_HEIGHT,
        toX: child.x + NODE_WIDTH / 2,
        toY: child.y,
      })
    }
  }

  return edges
}

function buildPartnershipEdges(nodes: TreeNode[]): PartnershipEdge[] {
  const edges: PartnershipEdge[] = []

  for (const node of nodes) {
    for (const partner of node.partners) {
      edges.push({
        id: `${node.person.id}--${partner.person.id}`,
        personAX: node.x + NODE_WIDTH,
        personAY: node.y + NODE_HEIGHT / 2,
        personBX: partner.x,
        personBY: partner.y + NODE_HEIGHT / 2,
      })
    }
  }

  return edges
}

// ── Helper maps ───────────────────────────────────────────────────────────────

function buildPartnerMap(partnerships: PartnershipRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const ps of partnerships) {
    if (!map.has(ps.person_a_id)) map.set(ps.person_a_id, [])
    if (!map.has(ps.person_b_id)) map.set(ps.person_b_id, [])
    map.get(ps.person_a_id)!.push(ps.person_b_id)
    map.get(ps.person_b_id)!.push(ps.person_a_id)
  }
  return map
}

function buildChildrenMap(parentChild: ParentChildRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const pc of parentChild) {
    if (!map.has(pc.parent_id)) map.set(pc.parent_id, [])
    map.get(pc.parent_id)!.push(pc.child_id)
  }
  return map
}