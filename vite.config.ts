/**
 * Vite 빌드 설정
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@components': resolve(__dirname, './src/components'),
            '@pages': resolve(__dirname, './src/pages'),
            '@services': resolve(__dirname, './src/services'),
            '@utils': resolve(__dirname, './src/utils'),
            '@types': resolve(__dirname, './src/types'),
        },
    },
    build: {
        target: 'es2020',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    markdown: ['react-markdown', 'remark-math', 'remark-gfm', 'rehype-katex'],
                },
            },
        },
    },
});
