'use client'

import type { PartnershipEdge } from '@/types'

interface PartnershipLineProps {
  edge: PartnershipEdge
}

export default function PartnershipLine({ edge }: PartnershipLineProps) {
  const { personAX, personAY, personBX, personBY } = edge

  const midX = (personAX + personBX) / 2
  const midY = personAY

  return (
    <g>
      <line x1={personAX} y1={personAY} x2={midX - 8} y2={midY} className="marriage-line" />
      <line x1={midX + 8} y1={midY} x2={personBX} y2={personBY} className="marriage-line" />
      {/* Ring icon */}
      <circle cx={midX} cy={midY} r={7} fill="white" stroke="#475569" strokeWidth="1.5" />
      <circle cx={midX} cy={midY} r={3} fill="#1E40AF" />
    </g>
  )
}
