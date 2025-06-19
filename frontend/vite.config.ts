import { defineConfig } from 'vite';

export default defineConfig({
    root: './src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'src/main.ts'
        }
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000'
        }
    }
});