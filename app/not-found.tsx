import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-parchment flex flex-col items-center justify-center gap-6 px-6">

      {/* Decorative rings */}
      <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[400px] h-[400px] rounded-full border border-gold/10" />
        <div className="absolute w-[560px] h-[560px] rounded-full border border-gold/[0.06]" />
      </div>

      <div className="relative z-10 text-center flex flex-col items-center gap-4 animate-fade-up">

        {/* Large 404 */}
        <p className="font-serif text-8xl font-semibold text-walnut/10 select-none leading-none">
          404
        </p>

        <div className="flex items-center gap-3 -mt-4">
          <div className="h-px w-10 bg-gold/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-gold/60" />
          <div className="h-px w-10 bg-gold/40" />
        </div>

        <h1 className="font-serif text-2xl font-semibold text-walnut">
          الصفحة غير موجودة
        </h1>
        <p className="font-sans text-sm text-walnut-light max-w-xs leading-relaxed">
          هذا الفرع من الشجرة غير موجود. عد إلى الجذر.
        </p>

        <Link
          href="/"
          className="
            mt-2 px-6 py-2.5 rounded-full
            bg-walnut text-parchment
            font-sans text-sm tracking-wide
            hover:bg-walnut-dark transition-colors duration-200
          "
        >
          العودة إلى الرئيسية
        </Link>
      </div>
    </main>
  )
}