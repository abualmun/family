import type { Config } from 'tailwindcss'

const config: Config = {
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './lib/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // background / surface
                parchment:      '#F1F5F9',   // light blue-grey page bg
                // primary text colours — high contrast on white
                walnut:         '#1E40AF',   // strong blue (primary actions + text)
                'walnut-light': '#475569',   // dark slate — readable secondary text
                'walnut-dark':  '#0F172A',   // near-black (hover/emphasis)
                charcoal:       '#0F172A',   // near-black body text
                // accent
                gold:           '#D97706',   // amber — clearly distinct from blue
                'gold-light':   '#FEF3C7',   // light amber
                // node shortcut tint
                shortcut:       '#F0FDF4',   // light green
            },
            fontFamily: {
                serif: ['Cairo', 'system-ui', 'sans-serif'],
                sans:  ['Cairo', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'node':  '0 2px 10px rgba(15,23,42,0.09)',
                'popup': '0 10px 48px rgba(15,23,42,0.18)',
                'card':  '0 1px 5px rgba(15,23,42,0.08)',
            },
            borderRadius: {
                'node': '14px',
            },
            animation: {
                'fade-up': 'fadeUp 0.5s ease both',
                'fade-in': 'fadeIn 0.3s ease both',
            },
            keyframes: {
                fadeUp: {
                    '0%':   { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeIn: {
                    '0%':   { opacity: '0' },
                    '100%': { opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}

export default config
