import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-parchment flex flex-col items-center justify-center px-6">

      {/* ── Icon ── */}
      <div className="mb-8 animate-fade-up">
        <div className="w-24 h-24 rounded-3xl bg-walnut flex items-center justify-center shadow-lg">
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden>
            <path
              d="M26 6 C18 6, 8 14, 8 24 C8 32 14 38 20 40 L20 48 L32 48 L32 40 C38 38 44 32 44 24 C44 14 34 6 26 6Z"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M26 48 L26 30" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M26 38 C22 36, 16 32, 14 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M26 34 C30 32, 36 28, 37 22" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* ── Title ── */}
      <h1
        className="font-sans text-5xl sm:text-6xl font-bold text-charcoal text-center leading-tight mb-4 animate-fade-up"
        style={{ animationDelay: '0.08s' }}
      >
        شجرة عائلتنا
      </h1>

      {/* ── Subtitle ── */}
      <p
        className="font-sans text-xl text-walnut-light text-center max-w-md leading-relaxed mb-12 animate-fade-up"
        style={{ animationDelay: '0.15s' }}
      >
        استكشف أجيالاً من التاريخ والقصص والروابط — كل ذلك في مكان واحد.
      </p>

      {/* ── Buttons ── */}
      <div
        className="flex flex-col sm:flex-row items-center gap-4 animate-fade-up"
        style={{ animationDelay: '0.22s' }}
      >
        <Link
          href="/view"
          className="
            flex items-center justify-center
            w-64 sm:w-auto px-12 py-6
            rounded-2xl bg-walnut text-white
            font-sans text-xl font-semibold
            shadow-lg hover:bg-walnut-dark
            transition-colors duration-200
          "
        >
          ادخل الشجرة
        </Link>

        <Link
          href="/edit"
          className="
            flex items-center justify-center
            w-64 sm:w-auto px-12 py-6
            rounded-2xl bg-white text-walnut
            font-sans text-xl font-semibold
            border-2 border-walnut
            shadow-md hover:bg-walnut hover:text-white
            transition-colors duration-200
          "
        >
          وضع التعديل
        </Link>
      </div>

    </main>
  )
}
