import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: './src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'index.html'
        }
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000'
        }
    },
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, '../shared')
        }
    }
});