import { RuleTester } from 'eslint'
import * as jsoncParser from 'jsonc-eslint-parser'
import { rule } from '../../src/plugin/rules/no-suspicious-dependencies.js'

const ruleTester = new RuleTester({
  languageOptions: { parser: jsoncParser }
})

ruleTester.run('no-suspicious-dependencies', rule, {
  valid: [
    {
      code: `{}`,
      filename: 'package.json'
    },
    {
      code: `{ "dependencies": { "foo": "^1.0.0" } }`,
      filename: 'package.json'
    },
    {
      code: `{ "dependencies": { "foo": "latest" } }`,
      filename: 'package.json'
    },
    {
      code: `{ "dependencies": {  "foo": "^1.0.0", "bar": "latest" } }`,
      filename: 'package.json'
    },
    {
      code: `{ "dependencies": {  "foo": "workspace:*" } }`,
      filename: 'package.json'
    }
  ],
  invalid: [
    {
      code: `{ "dependencies": { "foo": "https://example.com" } }`,
      filename: 'package.json',
      errors: 1
    },
    {
      code: `{ "dependencies": { "foo": "git+ssh://git@github.com:npm/cli.git" } }`,
      filename: 'package.json',
      errors: 1
    },
    {
      code: `{ "dependencies": { "foo": "npm:bar@latest" } }`,
      filename: 'package.json',
      errors: 1
    }
  ]
})
