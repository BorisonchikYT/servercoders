root: resolve(__dirname, 'client/frontend'),
build: {
  outDir: resolve(__dirname, 'client/frontend/assets/build'),
  emptyOutDir: true,           // ← теперь safe, чистим только build
  assetsDir: '',
  rollupOptions: {
    input: { main: resolve(__dirname, 'src/main.js') },
    output: {
      entryFileNames: 'js/[name].[hash].js',
      chunkFileNames: 'js/chunk-[name].[hash].js',
      assetFileNames: (info) =>
        info.name?.endsWith('.css')
          ? 'css/[name].[hash][extname]'
          : '[name].[hash][extname]',
    },
  },
},