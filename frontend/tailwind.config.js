/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#00DC82',
                    dark: '#00b86b',
                    light: '#1be7a7',
                    50: '#eff6ff',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                },
                background: {
                    DEFAULT: '#18181b',
                    sidebar: '#23272f',
                    card: '#23272f',
                },
                border: {
                    DEFAULT: '#23272f',
                },
                muted: {
                    DEFAULT: '#23272f',
                },
                good: {
                    DEFAULT: '#0f5132',
                    bg: '#1e2d24',
                },
                risky: {
                    DEFAULT: '#664d03',
                    bg: '#2d291e',
                },
                bad: {
                    DEFAULT: '#842029',
                    bg: '#2d1e22',
                },
            },
        },
    },
    plugins: [],
} 