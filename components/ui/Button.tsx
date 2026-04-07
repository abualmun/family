'use client'

import { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size    = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary: `
    bg-walnut text-white
    hover:bg-walnut-dark
    disabled:bg-walnut/40
  `,
  secondary: `
    bg-white text-walnut
    border-2 border-walnut
    hover:bg-walnut hover:text-white
    disabled:opacity-40
  `,
  ghost: `
    bg-transparent text-walnut-light
    hover:bg-parchment hover:text-walnut
    disabled:opacity-40
  `,
  danger: `
    bg-white text-red-700
    border-2 border-red-400
    hover:bg-red-600 hover:text-white hover:border-red-600
    disabled:opacity-40
  `,
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-6 py-4 text-base rounded-xl',
  md: 'px-8 py-5 text-lg rounded-2xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-sans font-semibold
        transition-all duration-150
        focus:outline-none focus-visible:ring-4 focus-visible:ring-walnut/40
        disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  )
}
