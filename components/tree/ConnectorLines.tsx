'use client'

import type { Edge, PartnershipEdge } from '@/types'
import PartnershipLine from '@/components/nodes/PartnershipLine'
import { NODE_HEIGHT } from '@/lib/tree/layout'

interface ConnectorLinesProps {
  edges: Edge[]
  partnershipEdges: PartnershipEdge[]
  /** Total canvas bounding box for SVG dimensions */
  width: number
  height: number
}

export default function ConnectorLines({
  edges,
  partnershipEdges,
  width,
  height,
}: ConnectorLinesProps) {
  return (
    <svg
      className="connector-svg"
      style={{ width, height }}
      aria-hidden
    >
      {/* ── Parent → Child curved lines ── */}
      {edges.map(edge => {
        const { id, fromX, fromY, toX, toY } = edge

        // Cubic bezier: exits bottom of parent, enters top of child
        const cp1Y = fromY + (toY - fromY) * 0.5
        const cp2Y = toY  - (toY - fromY) * 0.5
        const d = `M ${fromX} ${fromY} C ${fromX} ${cp1Y}, ${toX} ${cp2Y}, ${toX} ${toY}`

        return (
          <path
            key={id}
            d={d}
            className="connector-line"
          />
        )
      })}

      {/* ── Marriage / partnership lines ── */}
      {partnershipEdges.map(edge => (
        <PartnershipLine key={edge.id} edge={edge} />
      ))}
    </svg>
  )
}