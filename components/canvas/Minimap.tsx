'use client'

import { useMemo } from 'react'
import type { CanvasTransform } from '@/hooks/useCanvas'

const MINIMAP_WIDTH = 180
const MINIMAP_HEIGHT = 120
const MINIMAP_PADDING = 12

interface MinimapPerson {
  id: string
  is_shortcut: boolean
  computedX: number
  computedY: number
}

interface MinimapProps {
  people: MinimapPerson[]
  transform: CanvasTransform
  viewportWidth: number
  viewportHeight: number
}

export default function Minimap({
  people,
  transform,
  viewportWidth,
  viewportHeight,
}: MinimapProps) {
  // Compute bounding box of all nodes on the canvas
  const bounds = useMemo(() => {
    if (people.length === 0) return { minX: 0, minY: 0, maxX: 800, maxY: 600 }

    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    for (const p of people) {
      minX = Math.min(minX, p.computedX)
      minY = Math.min(minY, p.computedY)
      maxX = Math.max(maxX, p.computedX + 150) // node width
      maxY = Math.max(maxY, p.computedY + 160) // node height
    }

    return { minX, minY, maxX, maxY }
  }, [people])

  const contentW = bounds.maxX - bounds.minX
  const contentH = bounds.maxY - bounds.minY

  const usableW = MINIMAP_WIDTH - MINIMAP_PADDING * 2
  const usableH = MINIMAP_HEIGHT - MINIMAP_PADDING * 2

  const scaleX = usableW / contentW
  const scaleY = usableH / contentH
  const minimapScale = Math.min(scaleX, scaleY)

  // Convert canvas coords → minimap coords
  const toMinimap = (cx: number, cy: number) => ({
    x: MINIMAP_PADDING + (cx - bounds.minX) * minimapScale,
    y: MINIMAP_PADDING + (cy - bounds.minY) * minimapScale,
  })

  // Viewport rectangle on minimap
  const vpLeft = ((-transform.x / transform.scale) - bounds.minX) * minimapScale + MINIMAP_PADDING
  const vpTop = ((-transform.y / transform.scale) - bounds.minY) * minimapScale + MINIMAP_PADDING
  const vpWidth = (viewportWidth / transform.scale) * minimapScale
  const vpHeight = (viewportHeight / transform.scale) * minimapScale

  return (
    <div
      data-no-pan
      className="
        absolute bottom-6 left-6 z-20
        bg-white
        border-2 border-slate-200 rounded-2xl
        shadow-card overflow-hidden
      "
      style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
    >
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="block"
      >
        {/* Person nodes as small dots */}
        {people.map(person => {
          const pos = toMinimap(person.computedX, person.computedY)
          return (
            <rect
              key={person.id}
              x={pos.x}
              y={pos.y}
              width={Math.max(2, 150 * minimapScale)}
              height={Math.max(2, 160 * minimapScale)}
              rx="1"
              fill={person.is_shortcut ? '#4ADE80' : '#1E40AF'}
              opacity={0.6}
            />
          )
        })}

        {/* Viewport rectangle */}
        <rect
          x={vpLeft}
          y={vpTop}
          width={vpWidth}
          height={vpHeight}
          fill="rgba(30, 64, 175, 0.06)"
          stroke="#1E40AF"
          strokeWidth="1"
          rx="2"
        />
      </svg>

      {/* Label */}
      <div className="absolute top-2 right-3 text-xs font-sans font-semibold text-walnut-light">
        خريطة
      </div>
    </div>
  )
}