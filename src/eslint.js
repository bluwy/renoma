import { ESLint } from 'eslint'
import json from '@eslint/json'
import depend from 'eslint-plugin-depend'
import regexp from 'eslint-plugin-regexp'
import renoma from './plugin/index.js'
import { parser as plainText } from './plugin/parsers/plain-text.js'
import { arraify } from './utils.js'

// Click on table of https://ota-meshi.github.io/eslint-plugin-regexp/rules/#best-practices
// and run this to get all best practices name
// let str = ''
// $0.querySelectorAll('td:first-child').forEach((el) => {
//   str += `'regexp/${el.textContent}': 'error',\n`
// })
// console.log(str)

/**
 * @type {ESLint.Options}
 */
const baseEslintConfig = {
  errorOnUnmatchedPattern: false, // dts libraries
  overrideConfigFile: true,
  overrideConfig: [
    {
      ignores: [
        // common ignores
        '**/node_modules/**',
        // testing
        '**/coverage/**',
        '**/test-results/**',
        '**/tests/**',
        '**/test/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/e2e/**',
        // vendoring
        '**/vendor/**',
        '**/repos/**',
      ],
    },

    {
      linterOptions: {
        reportUnusedDisableDirectives: false,
      },
    },

    // custom languages
    {
      files: ['**/*.json'],
      language: 'json/json',
      plugins: { json },
    },
    {
      files: ['**/*.d.ts', '**/*.d.mts', '**/*.d.cts', '**/*.map'],
      languageOptions: {
        // for renoma checks
        // TODO: rewrite as proper eslint language plugin (like `@eslint/json`)
        parser: plainText,
      },
    },

    // custom renoma eslint checks
    {
      plugins: { renoma },
      rules: {
        'renoma/no-missing-sourcemap-sources': 'error',
      },
    },
    {
      files: ['package.json'],
      plugins: { renoma },
      rules: {
        'renoma/no-suspicious-dependencies': 'warn',
        'renoma/no-unused-dependencies': 'warn',
      },
    },

    // eslint-plugin-depend
    {
      files: ['package.json'],
      plugins: { depend },
      rules: {
        'depend/ban-dependencies': 'error',
      },
    },

    // eslint-plugin-regexp
    {
      files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
      plugins: { regexp },
      rules: {
        // === regexp possible errors ===
        'regexp/no-contradiction-with-assertion': 'error',
        // Subjective
        // 'regexp/no-control-character': 'error',
        'regexp/no-dupe-disjunctions': 'error',
        'regexp/no-empty-alternative': 'error',
        'regexp/no-empty-capturing-group': 'error',
        'regexp/no-empty-character-class': 'error',
        'regexp/no-empty-group': 'error',
        'regexp/no-empty-lookarounds-assertion': 'error',
        'regexp/no-escape-backspace': 'error',
        'regexp/no-invalid-regexp': 'error',
        'regexp/no-lazy-ends': 'error',
        'regexp/no-misleading-capturing-group': 'error',
        'regexp/no-misleading-unicode-character': 'error',
        'regexp/no-missing-g-flag': 'error',
        'regexp/no-optional-assertion': 'error',
        'regexp/no-potentially-useless-backreference': 'error',
        'regexp/no-super-linear-backtracking': 'error',
        'regexp/no-super-linear-move': 'error',
        'regexp/no-useless-assertions': 'error',
        'regexp/no-useless-backreference': 'error',
        'regexp/no-useless-dollar-replacements': 'error',
        'regexp/strict': 'error',
        // === regexp best practices ===
        'regexp/confusing-quantifier': 'error',
        'regexp/control-character-escape': 'error',
        'regexp/negation': 'error',
        'regexp/no-dupe-characters-character-class': 'error',
        'regexp/no-empty-string-literal': 'error',
        'regexp/no-extra-lookaround-assertions': 'error',
        'regexp/no-invisible-character': 'error',
        'regexp/no-legacy-features': 'error',
        'regexp/no-non-standard-flag': 'error',
        // Libraries may have legitimate reasons to use obscure ranges
        // 'regexp/no-obscure-range': 'error',
        'regexp/no-octal': 'error',
        'regexp/no-standalone-backslash': 'error',
        'regexp/no-trivially-nested-assertion': 'error',
        'regexp/no-trivially-nested-quantifier': 'error',
        'regexp/no-unused-capturing-group': 'error',
        'regexp/no-useless-character-class': 'error',
        'regexp/no-useless-flag': 'error',
        'regexp/no-useless-lazy': 'error',
        'regexp/no-useless-quantifier': 'error',
        'regexp/no-useless-range': 'error',
        'regexp/no-useless-set-operand': 'error',
        'regexp/no-useless-string-literal': 'error',
        'regexp/no-useless-two-nums-quantifier': 'error',
        'regexp/no-zero-quantifier': 'error',
        'regexp/optimal-lookaround-quantifier': 'error',
        'regexp/optimal-quantifier-concatenation': 'error',
        'regexp/prefer-escape-replacement-dollar-char': 'error',
        'regexp/prefer-predefined-assertion': 'error',
        'regexp/prefer-quantifier': 'error',
        'regexp/prefer-range': 'error',
        'regexp/prefer-regexp-exec': 'error',
        'regexp/prefer-regexp-test': 'error',
        'regexp/prefer-set-operation': 'error',
        // A little spammy and not sure it's beneficial for libraries by default
        // 'regexp/require-unicode-regexp': 'error',
        // Temporarily disable as v flag is quite new (node20 and above)
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicodeSets
        // 'regexp/require-unicode-sets-regexp': 'error',
        'regexp/simplify-set-operations': 'error',
        // Objective readability change
        // 'regexp/sort-alternatives': 'error'
        // Disable since non-ignore case usage can sometimes be faster
        // 'regexp/use-ignore-case': 'error'
      },
    },
  ],
}

/**
 * @param {string} pkgDir
 * @param {(string | RegExp)[] | undefined} filterRules
 */
export async function lintWithEslint(pkgDir, filterRules) {
  const eslint = new ESLint({
    ...baseEslintConfig,
    cwd: pkgDir,
    ruleFilter({ ruleId }) {
      // Ignore all core rules. I don't know why they're logged in the first place.
      if (!ruleId.includes('/')) return false
      if (filterRules) return isRuleIncluded(ruleId, filterRules)
      return true
    },
  })
  const results = await eslint.lintFiles([
    // For regexp and sourcemap checks
    './**/*.js',
    './**/*.mjs',
    './**/*.cjs',
    // For sourcemap checks
    './**/*.d.ts',
    './**/*.d.mts',
    './**/*.d.cts',
    './**/*.map',
    // For package.json deps checks
    './package.json',
  ])

  for (const result of results) {
    // Filter out unrelated messages
    result.messages = result.messages.filter((message) => {
      // Delete the `Definition for rule '*' was not found` error
      if (
        message.message.includes('Definition for rule') &&
        message.message.includes('was not found')
      ) {
        return false
      }
      // Delete the `Rule "*" is already configured by another configuration comment in the preceding code. This configuration is ignored` error
      if (
        message.message.includes(
          'is already configured by another configuration comment in the preceding code',
        )
      ) {
        return false
      }
      // Delete any parsing errors as sometimes it's not necessarily relevant. e.g. `simple-git-hooks`
      // `cli.js` has `Parsing error: 'return' outside of function`. This is because ESLint only allows
      // configuring the `sourceType` for every JS file, but if a JS file is CJS, we can't quite change
      // it to `sourceType: 'commonjs`` specifically.
      if (message.message.startsWith('Parsing error:')) {
        return false
      }
      return true
    })
  }

  const formatter = await eslint.loadFormatter('stylish')
  let resultText = await formatter.format(results)

  if (resultText) {
    // Strip out the `✖ 11 problems (11 errors, 0 warnings)` part. The result may also contain
    // publint results, and we don't want to confuse the numbers.
    resultText = resultText.replace(/✖ \d+ problem.*$/s, '')
  }

  return resultText
}

/**
 * @param {(string | RegExp)[] | undefined} filterRules
 */
export function listRules(filterRules) {
  /** @type {Set<string>} */
  const ruleNames = new Set()
  for (const config of arraify(baseEslintConfig.overrideConfig)) {
    if (config?.rules) {
      for (const ruleName of Object.keys(config.rules)) {
        if (filterRules && !isRuleIncluded(ruleName, filterRules)) {
          continue
        }
        ruleNames.add(ruleName)
      }
    }
  }
  return [...ruleNames].sort()
}

/**
 * @param {string} ruleName
 * @param {(string | RegExp)[]} filterRules
 */
function isRuleIncluded(ruleName, filterRules) {
  for (const filteredRule of filterRules) {
    if (typeof filteredRule === 'string') {
      if (filteredRule === ruleName) {
        return true
      }
    } else {
      if (filteredRule.test(ruleName)) {
        return true
      }
    }
  }
  return false
}
