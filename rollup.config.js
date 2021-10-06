import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

function createESMConfig(input, output, production) {
  return defineConfig({
    input,
    output: { file: output, format: 'esm' },
    plugins: [
      typescript({
        tsconfig: 'tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
      production
        ? terser({
            compress: {
              pure_getters: true,
              unsafe: true,
              unsafe_comps: true,
              warnings: false,
            },
            format: {
              comments: RegExp(`${pkg.name}`),
            },
          })
        : [],
    ],
  })
}

function createUMDConfig(input, output, production) {
  return defineConfig({
    input,
    output: { file: output, format: 'umd', name: 'af' },
    plugins: [
      typescript({
        tsconfig: 'tsconfig.json',
        useTsconfigDeclarationDir: true,
      }),
      production
        ? terser({
            compress: {
              pure_getters: true,
              unsafe: true,
              unsafe_comps: true,
              warnings: false,
            },
            format: {
              comments: RegExp(`${pkg.name}`),
            },
          })
        : [],
    ],
  })
}

export default function () {
  return [
    createESMConfig('src/index.ts', 'es/index.js', false),
    createESMConfig('src/index.ts', 'es/index.min.js', true),
    createUMDConfig('src/index.ts', 'dist/ajax-fake.js', false),
    createUMDConfig('src/index.ts', 'dist/ajax-fake.min.js', true),
  ]
}
