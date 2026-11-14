import { fileURLToPath, pathToFileURL } from 'node:url'
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

// Both inline and external maps use the map's location as the resolution base.
const sourceCases = [
  {
    sources: ['present.js'],
    sourceRoot: 'source-files',
    valid: true,
  },
  {
    sources: ['present.js'],
    sourceRoot: 'source-files/',
    valid: true,
  },
  {
    sources: ['../source-files/present.js'],
    sourceRoot: 'missing/',
    valid: true,
  },
  {
    sources: ['source-files/present.js'],
    sourceRoot: '',
    valid: true,
  },
  {
    sources: ['missing.js'],
    sourceRoot: 'source-files',
    valid: false,
  },
  {
    sources: ['https://example.com/source.js'],
    valid: true,
  },
  {
    sources: ['source.js'],
    sourceRoot: 'https://example.com/src',
    valid: true,
  },
  {
    sources: ['webpack:///src/original.js'],
    valid: true,
  },
  {
    sources: [pathToFileURL(fixturePath('source-files/present.js')).href],
    valid: true,
  },
  {
    sources: [pathToFileURL(fixturePath('source-files/missing.js')).href],
    valid: false,
  },
  {
    sources: ['source-files/with%20space.js'],
    valid: true,
  },
  {
    sources: ['http://[invalid'],
    valid: false,
  },
  {
    sources: ['source-files/present.js?version=1#source'],
    valid: true,
  },
  {
    sources: [null],
    valid: true,
  },
  {
    sources: ['missing.js'],
    sourcesContent: [''],
    valid: true,
  },
  {
    sources: ['embedded.js', 'source-files/present.js'],
    sourcesContent: ['', null],
    valid: true,
  },
  {
    sources: ['embedded.js', 'missing.js'],
    sourcesContent: ['', null],
    valid: false,
  },
  {
    sources: ['missing.js', 'embedded.js'],
    sourcesContent: [null, 'export const foo = 1'],
    valid: false,
  },
  {
    sources: ['missing.js'],
    sourcesContent: [],
    valid: false,
  },
  {
    sources: ['embedded.js', 'missing.js'],
    sourcesContent: ['export const foo = 1'],
    valid: false,
  },
  {
    sources: ['https://example.com/remote.js', 'missing.js'],
    sourcesContent: [null, null],
    valid: false,
  },
]

const validSources = []
const invalidSources = []
for (const { valid, ...sourceFields } of sourceCases) {
  const map = { version: 3, names: [], mappings: '', ...sourceFields }
  for (const inline of [false, true]) {
    const testCase = {
      code: inline ? sourcemapComment(map) : JSON.stringify(map),
      filename: fixturePath(inline ? 'sources.js' : 'sources.js.map'),
    }
    if (valid) {
      validSources.push(testCase)
    } else {
      invalidSources.push({ ...testCase, errors: [{ messageId: 'default' }] })
    }
  }
}

ruleTester.run('no-missing-sourcemap-sources resolution', rule, {
  valid: validSources,
  invalid: invalidSources,
})
