'use client'

import { useCallback, useRef, useState } from 'react'

const MIN_SCALE = 0.15
const MAX_SCALE = 2.0
const SCROLL_SENSITIVITY = 0.001
const FIT_PADDING = 80

export interface CanvasTransform {
  x: number
  y: number
  scale: number
}

interface UseCanvasOptions {
  initialTransform?: Partial<CanvasTransform>
}

export function useCanvas({ initialTransform }: UseCanvasOptions = {}) {
  // Source of truth lives in a ref — never triggers re-renders during pan/zoom
  const transformRef = useRef<CanvasTransform>({
    x: initialTransform?.x ?? 0,
    y: initialTransform?.y ?? 0,
    scale: initialTransform?.scale ?? 1,
  })

  // The DOM element we write to directly
  const canvasInnerRef = useRef<HTMLDivElement | null>(null)

  // Throttled React state — only used by Minimap / ZoomControls
  const [displayTransform, setDisplayTransform] = useState<CanvasTransform>(transformRef.current)
  const rafRef = useRef<number | null>(null)

  // Apply a new transform: write to DOM immediately, schedule a React state update
  const applyTransform = useCallback((t: CanvasTransform) => {
    transformRef.current = t
    if (canvasInnerRef.current) {
      canvasInnerRef.current.style.transform =
        `translate(${t.x}px, ${t.y}px) scale(${t.scale})`
    }
    // Batch React state updates via RAF so the minimap re-renders at most once per frame
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(() => {
        setDisplayTransform({ ...transformRef.current })
        rafRef.current = null
      })
    }
  }, [])

  // ── Drag state (refs only, no React state) ──────────────────
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const transformAtDragStart = useRef<CanvasTransform>({ x: 0, y: 0, scale: 1 })

  // ── Mouse pan ───────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('[data-no-pan]')) return
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    transformAtDragStart.current = { ...transformRef.current }
    e.preventDefault()
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const t = transformAtDragStart.current
    applyTransform({ ...t, x: t.x + dx, y: t.y + dy })
  }, [applyTransform])

  const onMouseUp = useCallback(() => { isDragging.current = false }, [])
  const onMouseLeave = useCallback(() => { isDragging.current = false }, [])

  // ── Touch pan + pinch-zoom ──────────────────────────────────
  const lastTouchDistance = useRef<number | null>(null)
  const lastTouchCenter = useRef({ x: 0, y: 0 })

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      transformAtDragStart.current = { ...transformRef.current }
    }
    if (e.touches.length === 2) {
      isDragging.current = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDistance.current = Math.hypot(dx, dy)
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      }
    }
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - dragStart.current.x
      const dy = e.touches[0].clientY - dragStart.current.y
      const t = transformAtDragStart.current
      applyTransform({ ...t, x: t.x + dx, y: t.y + dy })
    }
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.hypot(dx, dy)
      const scaleDelta = distance / lastTouchDistance.current
      const center = lastTouchCenter.current
      const prev = transformRef.current

      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * scaleDelta))
      const scaleRatio = newScale / prev.scale
      applyTransform({
        x: center.x - scaleRatio * (center.x - prev.x),
        y: center.y - scaleRatio * (center.y - prev.y),
        scale: newScale,
      })

      lastTouchDistance.current = distance
    }
  }, [applyTransform])

  const onTouchEnd = useCallback(() => {
    isDragging.current = false
    lastTouchDistance.current = null
  }, [])

  // ── Scroll to zoom ──────────────────────────────────────────
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * SCROLL_SENSITIVITY
    const scaleMultiplier = 1 + delta * 8
    const prev = transformRef.current
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * scaleMultiplier))
    if (newScale === prev.scale) return

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const scaleRatio = newScale / prev.scale

    applyTransform({
      x: mouseX - scaleRatio * (mouseX - prev.x),
      y: mouseY - scaleRatio * (mouseY - prev.y),
      scale: newScale,
    })
  }, [applyTransform])

  // ── Programmatic zoom ───────────────────────────────────────
  const zoomIn = useCallback(() => {
    const prev = transformRef.current
    const newScale = Math.min(MAX_SCALE, prev.scale * 1.25)
    applyTransform({ ...prev, scale: newScale })
  }, [applyTransform])

  const zoomOut = useCallback(() => {
    const prev = transformRef.current
    const newScale = Math.max(MIN_SCALE, prev.scale / 1.25)
    applyTransform({ ...prev, scale: newScale })
  }, [applyTransform])

  // ── Fit to screen ───────────────────────────────────────────
  const fitToScreen = useCallback((
    contentWidth: number,
    contentHeight: number,
    viewportWidth: number,
    viewportHeight: number,
  ) => {
    const scaleX = (viewportWidth - FIT_PADDING * 2) / contentWidth
    const scaleY = (viewportHeight - FIT_PADDING * 2) / contentHeight
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(scaleX, scaleY)))
    const scaledW = contentWidth * newScale
    const scaledH = contentHeight * newScale
    applyTransform({
      x: (viewportWidth - scaledW) / 2,
      y: (viewportHeight - scaledH) / 2,
      scale: newScale,
    })
  }, [applyTransform])

  // ── Animated pan to canvas coordinate ──────────────────────
  const panTo = useCallback((
    canvasX: number,
    canvasY: number,
    viewportWidth: number,
    viewportHeight: number,
    animated = true,
  ) => {
    const { x: startX, y: startY, scale } = transformRef.current
    const targetX = viewportWidth / 2 - canvasX * scale
    const targetY = viewportHeight / 2 - canvasY * scale

    if (animated) {
      const startTime = performance.now()
      const duration = 600

      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

      const animate = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1)
        const eased = easeInOut(progress)
        applyTransform({
          scale,
          x: startX + (targetX - startX) * eased,
          y: startY + (targetY - startY) * eased,
        })
        if (progress < 1) requestAnimationFrame(animate)
      }

      requestAnimationFrame(animate)
    } else {
      applyTransform({ scale, x: targetX, y: targetY })
    }
  }, [applyTransform])

  return {
    // Ref to attach to the canvas-inner DOM element (Canvas sets the transform directly)
    canvasInnerRef,
    // Throttled transform for UI consumers (Minimap, ZoomControls) — not for animation
    transform: displayTransform,
    // Event handlers
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onWheel,
    // Actions
    zoomIn,
    zoomOut,
    fitToScreen,
    panTo,
    // Constants
    MIN_SCALE,
    MAX_SCALE,
  }
}

export type UseCanvasReturn = ReturnType<typeof useCanvas>
