/** @type {(plugin: import('eslint').ESLint.Plugin) => import('eslint').Linter.Config} */
export const config = (plugin) => ({
  plugins: {
    renoma: plugin
  },
  rules: {
    'renoma/no-suspicious-dependencies': 'warn',
    'renoma/no-unused-dependencies': 'warn'
  }
})
