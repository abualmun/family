'use client'

import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}

export default function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={backdropRef}
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-charcoal/50
        animate-fade-in
        p-4
      "
      onClick={e => {
        if (e.target === backdropRef.current) onClose()
      }}
    >
      <div
        className={`
          relative w-full ${maxWidth}
          bg-white rounded-3xl
          shadow-popup
          animate-fade-up
          overflow-hidden overflow-y-auto
          max-h-[calc(100vh-2rem)]
        `}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
