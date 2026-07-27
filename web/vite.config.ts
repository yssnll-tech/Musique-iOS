import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Base relative ('./') : les assets sont référencés relativement à index.html,
// ce qui permet de charger l'app depuis le schéma custom `app://local/` de la
// coquille iOS (WKWebView) aussi bien que depuis un serveur de dev.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    base: './',
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        target: 'es2021',
        emptyOutDir: true,
    },
})
