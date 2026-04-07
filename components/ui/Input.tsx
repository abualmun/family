'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

// ── Shared label + error wrapper ──────────────────────────────────────────────

interface FieldWrapperProps {
  label?: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function FieldWrapper({ label, error, required, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="font-sans text-base font-semibold text-charcoal">
          {label}
          {required && <span className="text-red-600 mr-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="font-sans text-base text-red-600 font-medium">{error}</p>
      )}
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, required, className = '', ...props }: InputProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <input
        className={`
          w-full px-4 py-3.5 rounded-xl
          font-sans text-lg text-charcoal
          bg-white border-2 border-slate-300
          placeholder:text-slate-400
          focus:outline-none focus:border-walnut focus:ring-2 focus:ring-walnut/20
          transition-colors duration-150
          disabled:bg-parchment disabled:cursor-not-allowed
          ${error ? 'border-red-400' : ''}
          ${className}
        `}
        required={required}
        {...props}
      />
    </FieldWrapper>
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, required, className = '', ...props }: TextareaProps) {
  return (
    <FieldWrapper label={label} error={error} required={required}>
      <textarea
        className={`
          w-full px-4 py-3.5 rounded-xl
          font-sans text-lg text-charcoal
          bg-white border-2 border-slate-300
          placeholder:text-slate-400
          focus:outline-none focus:border-walnut focus:ring-2 focus:ring-walnut/20
          transition-colors duration-150
          resize-none
          disabled:bg-parchment disabled:cursor-not-allowed
          ${error ? 'border-red-400' : ''}
          ${className}
        `}
        required={required}
        {...props}
      />
    </FieldWrapper>
  )
}
