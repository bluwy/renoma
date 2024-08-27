import { fileURLToPath } from 'node:url'
import { RuleTester } from 'eslint'
import * as jsoncParser from 'jsonc-eslint-parser'
import { rule } from '../../src/plugin/rules/no-unused-dependencies.js'

const ruleTester = new RuleTester({
  languageOptions: { parser: jsoncParser }
})

const fixturePath = (name) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))

ruleTester.run('no-unused-dependencies', rule, {
  valid: [
    {
      code: `{ "dependencies": { "used": "^1.0.0" } }`,
      filename: fixturePath('no-unused-dependencies-1/package.json')
    }
  ],
  invalid: [
    {
      code: `{ "dependencies": { "unused": "^1.0.0" } }`,
      filename: fixturePath('no-unused-dependencies-1/package.json'),
      errors: 1
    }
  ]
})
