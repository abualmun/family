import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'شجرة العائلة',
  description: 'استكشف تاريخ عائلتك واحفظه',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
