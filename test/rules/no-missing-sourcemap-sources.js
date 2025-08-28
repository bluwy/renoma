import { fileURLToPath } from 'node:url'
import { RuleTester } from 'eslint'
import { parser as plainText } from '../../src/plugin/parsers/plain-text.js'
import { rule } from '../../src/plugin/rules/no-missing-sourcemap-sources.js'

const ruleTester = new RuleTester({
  languageOptions: {
    parser: plainText,
  },
})

/**
 * @param {string} name
 */
const fixturePath = (name) =>
  fileURLToPath(
    new URL(
      `../fixtures/no-missing-sourcemap-sources-1/${name}`,
      import.meta.url,
    ),
  )

/**
 * @param {Record<string, any>} map
 */
function sourcemapComment(map) {
  return `//# sourceMappingURL=data:application/json;base64,${Buffer.from(
    JSON.stringify(map),
  ).toString('base64')}`
}

ruleTester.run('no-missing-sourcemap-sources', rule, {
  valid: [
    {
      code: `export const foo = 'bar'
    ${sourcemapComment({
      version: 3,
      file: 'inline-with-sources-content.js',
      sources: ['src/original.js'],
      sourcesContent: ["export const foo = 'bar'"],
      names: ['foo'],
      mappings: ';;;',
    })}`,
      filename: fixturePath('inline-with-sources-content.js'),
    },
    {
      code: `export const foo = 'bar'`,
      filename: fixturePath('no-sourcemap.js'),
    },
    {
      code: JSON.stringify({
        version: 3,
        file: 'map.js',
        sources: ['src/original.js'],
        sourcesContent: ["export const foo = 'bar'"],
        names: ['foo'],
        mappings: ';;;',
      }),
      filename: fixturePath('sourcemap-with-sources-content.js.map'),
    },
  ],
  invalid: [
    {
      code: `export const foo = 'bar'
  ${sourcemapComment({
    version: 3,
    file: 'inline-missing-sources.js',
    sources: ['src/original.js'],
    names: ['foo'],
    mappings: ';;;',
  })}`,
      filename: fixturePath('inline-missing-sources.js'),
      errors: 1,
    },
    {
      code: `export const foo = 'bar'
  ${sourcemapComment({
    version: 3,
    file: 'multiple-sourcemap.js',
    sources: ['src/original.js'],
    sourcesContent: ["export const foo = 'bar'"],
    names: ['foo'],
    mappings: ';;;',
  })}
  ${sourcemapComment({
    version: 3,
    file: 'multiple-sourcemap.js',
    sources: ['src/original.js'],
    names: ['foo'],
    mappings: ';;;',
  })}`,
      filename: fixturePath('multiple-sourcemap.js'),
      errors: 1,
    },

    {
      code: `export declare const foo: string
  ${sourcemapComment({
    version: 3,
    file: 'inline-missing-sources.d.ts',
    sources: ['src/original.ts'],
    names: ['foo'],
    mappings: ';;;',
  })}`,
      filename: fixturePath('inline-missing-sources.d.ts'),
      errors: 1,
    },
    {
      code: JSON.stringify({
        version: 3,
        file: 'map.js',
        sources: ['src/original.js'],
        names: ['foo'],
        mappings: ';;;',
      }),
      filename: fixturePath('sourcemap.js.map'),
      errors: 1,
    },
    {
      code: JSON.stringify({
        version: 3,
        file: 'sourcemap.d.ts',
        sources: ['src/original.ts'],
        names: ['foo'],
        mappings: ';;;',
      }),
      filename: fixturePath('sourcemap.d.ts.map'),
      errors: 1,
    },
  ],
})
