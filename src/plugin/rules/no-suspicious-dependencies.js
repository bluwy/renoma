/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow any suspicious dependencies, e.g. from external URLs',
    },
    messages: {
      default: 'Suspicious dependency "{{dependency}}": "{{value}}" found',
    },
  },
  create(context) {
    if (context.filename.endsWith('package.json')) {
      return {
        'Program > JSONExpressionStatement > JSONObjectExpression > JSONProperty[key.value="dependencies"] > JSONObjectExpression > JSONProperty':
          (node) => {
            /** @type {string} */
            const dependency = node.key.value
            /** @type {string} */
            const value = node.value.value
            if (
              (value.includes('/') || value.includes(':')) &&
              !value.startsWith('workspace:') &&
              !value.startsWith('file:') &&
              !value.startsWith('link:')
            ) {
              context.report({
                node,
                messageId: 'default',
                data: {
                  dependency,
                  value,
                },
              })
            }
          },
      }
    }

    return {}
  },
}
