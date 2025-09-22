import { rule as ruleNoMissingSourcemapSources } from './rules/no-missing-sourcemap-sources.js'
import { rule as ruleNoSuspiciousDependencies } from './rules/no-suspicious-dependencies.js'
import { rule as ruleNoUnusedDependencies } from './rules/no-unused-dependencies.js'

/** @type {import('eslint').ESLint.Plugin} */
export default {
  meta: {
    name: 'renoma',
  },
  rules: {
    'no-missing-sourcemap-sources': ruleNoMissingSourcemapSources,
    'no-suspicious-dependencies': ruleNoSuspiciousDependencies,
    'no-unused-dependencies': ruleNoUnusedDependencies,
  },
}
