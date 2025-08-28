import { config as configRecommended } from './configs/recommended.js'
import { rule as ruleNoMissingSourcemapSources } from './rules/no-missing-sourcemap-sources.js'
import { rule as ruleNoSuspiciousDependencies } from './rules/no-suspicious-dependencies.js'
import { rule as ruleNoUnusedDependencies } from './rules/no-unused-dependencies.js'

/** @type {Record<string, import('eslint').Rule.RuleModule>} */
export const rules = {
  'no-missing-sourcemap-sources': ruleNoMissingSourcemapSources,
  'no-suspicious-dependencies': ruleNoSuspiciousDependencies,
  'no-unused-dependencies': ruleNoUnusedDependencies,
}

/** @type {import('eslint').ESLint.Plugin} */
const plugin = { rules }

export const configs = {
  recommended: configRecommended(plugin),
}
