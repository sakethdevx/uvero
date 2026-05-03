/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                /* CSS-var-driven adaptive tokens */
                surface: {
                    0: 'var(--surface-0)',
                    1: 'var(--surface-1)',
                    2: 'var(--surface-2)',
                    glass: 'var(--surface-glass)',
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    subtle: 'var(--accent-subtle)',
                },
            },
            borderColor: {
                glass: 'var(--border-glass)',
            },
            boxShadow: {
                'glow': 'var(--accent-glow)',
                'glow-lg': '0 0 60px rgba(99, 102, 241, 0.2)',
            },
            transitionTimingFunction: {
                'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
                'sheet': 'cubic-bezier(0.32, 0.72, 0, 1)',
            },
            animation: {
                'spin-slow': 'spin 3s linear infinite',
                'fade-in': 'fadeIn 0.6s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                'fade-in-down': 'fadeInDown 0.5s ease-out forwards',
                'slide-in-right': 'slideInRight 0.4s ease-out forwards',
                'scale-in': 'scaleIn 0.3s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'gradient-x': 'gradientX 15s ease infinite',
                'blob': 'blob 7s infinite',
                /* New AI-system animations */
                'orb-breathe': 'orbBreathe 3s ease-in-out infinite',
                'shimmer': 'shimmer 1.5s linear infinite',
                'float-gentle': 'floatGentle 15s ease-in-out infinite',
                'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
                'slide-up': 'slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards',
                'slide-down': 'slideDown 0.25s ease-in forwards',
                'panel-in': 'panelIn 0.35s ease-out forwards',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                fadeInDown: {
                    '0%': { opacity: '0', transform: 'translateY(-10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(-20px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.15)' },
                    '50%': { boxShadow: '0 0 40px rgba(14, 165, 233, 0.3)' },
                },
                gradientX: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
                /* New AI-system keyframes */
                orbBreathe: {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
                    '50%': { transform: 'scale(1.15)', opacity: '1' },
                },
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                floatGentle: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '25%': { transform: 'translate(10px, -15px) scale(1.02)' },
                    '50%': { transform: 'translate(-5px, -25px) scale(0.98)' },
                    '75%': { transform: 'translate(-15px, -10px) scale(1.01)' },
                },
                glowPulse: {
                    '0%, 100%': { boxShadow: '0 0 20px var(--accent-subtle, rgba(99,102,241,0.1))' },
                    '50%': { boxShadow: '0 0 40px var(--accent-subtle, rgba(99,102,241,0.25))' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(0)', opacity: '1' },
                    '100%': { transform: 'translateY(100%)', opacity: '0' },
                },
                panelIn: {
                    '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
                    '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
                },
            },
            backgroundSize: {
                '200%': '200% 200%',
            },
            screens: {
                'pwa': { raw: '(display-mode: standalone)' },
            },
        },
    },
    plugins: [],
}
