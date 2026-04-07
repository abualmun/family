'use client'

import PersonNode from '@/components/nodes/PersonNode'
import ShortcutNode from '@/components/nodes/ShortcutNode'
import ConnectorLines from '@/components/tree/ConnectorLines'
import type { LayoutedRoot } from '@/types'

interface FamilyRootProps {
  layoutedRoot: LayoutedRoot
  isEditable: boolean
  highlightedPersonId: string | null
  activeNodeId: string | null
  onClickPerson: (personId: string) => void
  onActivateNode: (personId: string) => void
  onAddPartner: (personId: string) => void
  onAddChild: (personId: string) => void
  onNavigateToOriginal: (originalPersonId: string) => void
}

export default function FamilyRoot({
  layoutedRoot,
  isEditable,
  highlightedPersonId,
  activeNodeId,
  onClickPerson,
  onActivateNode,
  onAddPartner,
  onAddChild,
  onNavigateToOriginal,
}: FamilyRootProps) {
  const { allNodes, edges, partnershipEdges } = layoutedRoot

  // Compute bounding box for SVG canvas size
  const maxX = Math.max(...allNodes.map(n => n.x + 160)) + 100
  const maxY = Math.max(...allNodes.map(n => n.y + 80)) + 100

  return (
    <>
      {/* SVG connector lines layer (rendered first, behind nodes) */}
      <ConnectorLines
        edges={edges}
        partnershipEdges={partnershipEdges}
        width={maxX}
        height={maxY}
      />

      {/* Root family label */}
      <div
        style={{
          position: 'absolute',
          left: layoutedRoot.rootNode.x,
          top: layoutedRoot.rootNode.y - 32,
        }}
        className="font-serif text-xs text-walnut/40 tracking-widest uppercase select-none"
      >
        {layoutedRoot.root.name}
      </div>

      {/* Person nodes */}
      {allNodes.map(node => {
        const person = node.person

        if (person.is_shortcut) {
          return (
            <ShortcutNode
              key={person.id}
              person={person}
              x={node.x}
              y={node.y}
              isEditable={isEditable}
              onClickPerson={onClickPerson}
              onNavigateToOriginal={onNavigateToOriginal}
            />
          )
        }

        return (
          <PersonNode
            key={person.id}
            person={person}
            x={node.x}
            y={node.y}
            isEditable={isEditable}
            isHighlighted={highlightedPersonId === person.id}
            isActive={activeNodeId === person.id}
            onClickPerson={onClickPerson}
            onActivate={onActivateNode}
            onAddPartner={isEditable ? onAddPartner : undefined}
            onAddChild={isEditable ? onAddChild : undefined}
          />
        )
      })}
    </>
  )
}