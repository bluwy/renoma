import { ESLint } from 'eslint'
import depend from 'eslint-plugin-depend'
import regexp from 'eslint-plugin-regexp'
import * as jsoncParser from 'jsonc-eslint-parser'
import * as renoma from './plugin/index.js'
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
  overrideConfig: {
    linterOptions: {
      reportUnusedDisableDirectives: false
    }
  },
  baseConfig: [
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
        '**/repos/**'
      ]
    },

    // custom eslint checks
    renoma.configs.recommended,
    {
      files: ['package.json'],
      languageOptions: {
        parser: jsoncParser
      },
      rules: {
        'renoma/no-suspicious-dependencies': 'warn'
      }
    },

    // eslint-plugin-depend
    depend.configs['flat/recommended'],
    {
      files: ['package.json'],
      languageOptions: {
        parser: jsoncParser
      },
      rules: {
        'depend/ban-dependencies': 'error'
      }
    },

    // eslint-plugin-regexp
    // User explicit config below
    // regexp.configs['flat/recommended'],
    {
      plugins: {
        regexp
      },
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
        'regexp/simplify-set-operations': 'error'
        // Objective readability change
        // 'regexp/sort-alternatives': 'error'
        // Disable since non-ignore case usage can sometimes be faster
        // 'regexp/use-ignore-case': 'error'
      }
    }
  ]
}

/**
 * @param {string} pkgDir
 * @param {(string | RegExp)[]} [filterRules]
 */
export async function lintPkgDir(pkgDir, filterRules) {
  // NOTE: This mutates `baseEslintConfig` but since this is a CLI that only runs once,
  // it's fine and easier to implement for now
  if (filterRules) {
    for (const config of arraify(baseEslintConfig.baseConfig)) {
      if (config?.rules) {
        for (const ruleName of Object.keys(config.rules)) {
          if (!isRuleIncluded(ruleName, filterRules)) {
            config.rules[ruleName] = 'off'
          }
        }
      }
    }
  }

  const eslint = new ESLint({
    ...baseEslintConfig,
    cwd: pkgDir
  })
  const results = await eslint.lintFiles(['./**/*.js', './package.json'])

  for (const result of results) {
    // Delete the `Definition for rule '*' was not found` error
    result.messages = result.messages.filter((message) => {
      if (
        message.message.includes('Definition for rule') &&
        message.message.includes('was not found')
      ) {
        return false
      }
      return true
    })
  }

  const formatter = await eslint.loadFormatter('stylish')
  const resultText = await formatter.format(results)
  return resultText
}

export function listRules() {
  /** @type {Set<string>} */
  const ruleNames = new Set()
  for (const config of arraify(baseEslintConfig.baseConfig)) {
    if (config?.rules) {
      for (const ruleName of Object.keys(config.rules)) {
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
