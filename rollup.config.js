import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'

export default defineConfig({
  input: './src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'ha',
    },
    {
      file: 'es/index.js',
      format: 'es',
    },
  ],
  plugins: [
    typescript({
      tsconfig: 'tsconfig.json',
      useTsconfigDeclarationDir: true,
    }),
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
      },
    }),
  ],
})
