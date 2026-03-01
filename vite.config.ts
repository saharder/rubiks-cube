import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  if (mode === 'pages') {
    return {
      base: '/rubiks-cube/',
    }
  }

  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'RubiksCube',
        fileName: 'index',
      },
      rollupOptions: {
        external: ['three'],
        output: {
          globals: {
            three: 'THREE',
          },
        },
      },
    },
  }
})