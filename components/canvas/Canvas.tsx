'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UseCanvasReturn } from '@/hooks/useCanvas'
import ZoomControls from './ZoomControls'
import Minimap from './Minimap'
import SearchBar from './SearchBar'
import type { PersonRow, PartnershipRow, ParentChildRow, RootRow } from '@/lib/supabase/types'

interface SearchablePerson extends PersonRow {
  computedX: number
  computedY: number
  root_name?: string
}

interface CanvasProps {
  canvas: UseCanvasReturn
  isEditable: boolean
  people: SearchablePerson[]
  roots: RootRow[]
  partnerships: PartnershipRow[]
  parentChildRows: ParentChildRow[]
  /** Called when user selects a search result — parent handles panTo */
  onSearchSelect?: (x: number, y: number, id: string) => void
  children?: React.ReactNode
  /** Overlay UI rendered outside the pannable canvas (stays fixed to viewport) */
  overlay?: React.ReactNode
}

export default function Canvas({
  canvas,
  isEditable,
  people,
  onSearchSelect,
  children,
  overlay,
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState({ width: 1440, height: 900 })

  // ── Measure viewport ──────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) {
        setViewport({
          width: wrapperRef.current.clientWidth,
          height: wrapperRef.current.clientHeight,
        })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const {
    canvasInnerRef,
    transform,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onWheel,
    zoomIn,
    zoomOut,
    fitToScreen,
    MIN_SCALE,
    MAX_SCALE,
  } = canvas

  // ── Fit to screen ─────────────────────────────────────────
  const handleFitToScreen = useCallback(() => {
    if (people.length === 0) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of people) {
      minX = Math.min(minX, p.computedX)
      minY = Math.min(minY, p.computedY)
      maxX = Math.max(maxX, p.computedX + 160)
      maxY = Math.max(maxY, p.computedY + 80)
    }
    fitToScreen(maxX - minX, maxY - minY, viewport.width, viewport.height)
  }, [people, viewport, fitToScreen])

  // ── Block native scroll on canvas ────────────────────────
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const handler = (e: WheelEvent) => e.preventDefault()
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="canvas-wrapper"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >

      {/* ── Search bar (top center) ── */}
      {!isEditable && (
        <SearchBar
          people={people}
          onSelectPerson={(x, y, id) => onSearchSelect?.(x, y, id)}
        />
      )}

      {/* ── Edit mode badge (top center, replaces search in edit mode) ── */}
      {isEditable && (
        <div
          data-no-pan
          className="
            absolute top-4 left-1/2 -translate-x-1/2 z-20
            flex items-center gap-2.5 px-7 py-4
            bg-walnut text-white text-lg font-sans font-semibold
            rounded-full shadow-md select-none
          "
        >
          <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
          وضع التعديل
        </div>
      )}

      {/* ── Infinite canvas inner ── */}
      <div
        ref={canvasInnerRef}
        className="canvas-inner"
      >
        {children}

      </div>

      {/* Empty state — outside canvas-inner so it stays fixed to viewport */}
      {people.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="
              text-center p-10 rounded-2xl pointer-events-auto
              border border-dashed border-walnut/20
              bg-white/60
            "
          >
            <p className="font-serif text-xl text-walnut mb-1">No families yet</p>
            <p className="font-sans text-sm text-walnut-light">
              {isEditable
                ? 'Add your first family root to get started.'
                : 'The family tree is empty.'}
            </p>
            {!isEditable && (
              <a
                href="/edit"
                className="mt-4 inline-block font-sans text-sm text-walnut underline"
              >
                Go to Edit to add a family
              </a>
            )}
          </div>
        </div>
      )}

      {/* Overlay — viewport-fixed UI (e.g. EditToolbar) */}
      {overlay}

      {/* ── Minimap ── */}
      {/* <Minimap
        people={people}
        transform={transform}
        viewportWidth={viewport.width}
        viewportHeight={viewport.height}
      /> */}

      {/* ── Zoom controls ── */}
      <ZoomControls
        scale={transform.scale}
        minScale={MIN_SCALE}
        maxScale={MAX_SCALE}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitToScreen={handleFitToScreen}
      />
    </div>
  )
}