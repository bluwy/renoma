import { config as configRecommended } from './configs/recommended.js'
import { rule as ruleNonSuspiciousDependencies } from './rules/no-suspicious-dependencies.js'
import { rule as ruleNonUnusedDependencies } from './rules/no-unused-dependencies.js'

/** @type {Record<string, import('eslint').Rule.RuleModule} */
export const rules = {
  'no-suspicious-dependencies': ruleNonSuspiciousDependencies,
  'no-unused-dependencies': ruleNonUnusedDependencies
}

/** @type {import('eslint').ESLint.Plugin} */
const plugin = { rules }

export const configs = {
  recommended: configRecommended(plugin)
}
