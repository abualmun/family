'use client'

import Image from 'next/image'

interface AvatarProps {
  name: string
  photoUrl?: string | null
  size?: number
  className?: string
}

/** Returns up to 2 initials from a name */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** Deterministic warm hue from name string */
function getMonogramColor(name: string): string {
  const hues = [16, 28, 38, 200, 170, 340, 260]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = hues[Math.abs(hash) % hues.length]
  return `hsl(${hue}, 38%, 72%)`
}

export default function Avatar({ name, photoUrl, size = 44, className = '' }: AvatarProps) {
  const initials = getInitials(name)
  const bg       = getMonogramColor(name)

  if (photoUrl) {
    return (
      <div
        className={`relative rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`
        flex-shrink-0 rounded-full flex items-center justify-center
        font-serif font-medium select-none ${className}
      `}
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.36,
        color: 'white',
        letterSpacing: '0.02em',
      }}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  )
}