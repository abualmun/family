'use client'

interface ZoomControlsProps {
  scale: number
  minScale: number
  maxScale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToScreen: () => void
}

export default function ZoomControls({
  scale,
  minScale,
  maxScale,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
}: ZoomControlsProps) {
  const percent = Math.round(scale * 100)

  return (
    <div
      data-no-pan
      className="
        absolute bottom-6 right-6 z-20
        flex flex-col items-center gap-1.5
        bg-white
        border-2 border-slate-200
        rounded-2xl shadow-card
        p-2
      "
    >
      {/* Fit to screen */}
      <button
        onClick={onFitToScreen}
        title="ملاءمة الشاشة"
        className="
          w-12 h-12 flex items-center justify-center rounded-xl
          text-walnut hover:bg-parchment hover:text-walnut-dark
          transition-colors duration-150
        "
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 7V2.5C2 2.22 2.22 2 2.5 2H7M13 2H17.5C17.78 2 18 2.22 18 2.5V7M18 13V17.5C18 17.78 17.78 18 17.5 18H13M7 18H2.5C2.22 18 2 17.78 2 17.5V13"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          />
        </svg>
      </button>

      <div className="w-7 h-0.5 bg-slate-200 rounded-full" />

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        disabled={scale >= maxScale}
        title="تكبير"
        className="
          w-12 h-12 flex items-center justify-center rounded-xl
          text-walnut hover:bg-parchment hover:text-walnut-dark
          transition-colors duration-150
          disabled:opacity-30 disabled:cursor-not-allowed
        "
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 2V16M2 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Zoom percentage */}
      <span className="text-sm font-sans font-semibold text-walnut-light w-12 text-center leading-none py-1">
        {percent}%
      </span>

      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        disabled={scale <= minScale}
        title="تصغير"
        className="
          w-12 h-12 flex items-center justify-center rounded-xl
          text-walnut hover:bg-parchment hover:text-walnut-dark
          transition-colors duration-150
          disabled:opacity-30 disabled:cursor-not-allowed
        "
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
