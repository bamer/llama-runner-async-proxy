import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  // Mode configuration - mirrors webpack's mode: 'development'
  mode: 'development',
  
  // Root directory for source files (like webpack's entry)
  root: '.',
  
  // Base URL for assets
  base: '/',
  
  // Build configuration - mirrors webpack's output settings
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: '[name].[hash].chunk.js',
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
    // Enable development mode support
    sourcemap: true,
    minify: false, // Disable minification for development
  },
  
  // Development server configuration - mirrors webpack's devServer
  server: {
    port: 3000,
    host: true,
    hmr: true,
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:8081',
      '/ws': {
        target: 'ws://localhost:8081',
        ws: true,
      },
    },
  },
  
  // Plugins configuration - mirrors webpack's module rules
  plugins: [
    react({
      // JSX support with React plugin (like webpack's babel-loader)
      include: ['**/*.jsx', '**/*.js', '**/*.ts', '**/*.tsx'],
      exclude: ['node_modules/**'],
    }),
  ],
  
  // Resolve configuration - mirrors webpack's resolve
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@public': path.resolve(__dirname, './public'),
    },
  },
  
  // CSS configuration - Vite handles CSS automatically
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    postcss: {
      plugins: [
        autoprefixer(),
      ],
    },
  },
  
  // Development mode support (like webpack's dev mode)
  define: {
    __DEV__: true,
    __PROD__: false,
  },
  
  // Optimization for development
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
});