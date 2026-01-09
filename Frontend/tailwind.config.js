/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                surface: 'var(--surface)',
                accent: 'var(--accent)',
                foreground: 'var(--foreground)',
                muted: 'var(--text-muted)',
                border: 'var(--border)',
            }
        },
    },
    plugins: [],
}
