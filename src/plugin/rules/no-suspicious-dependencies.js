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
        'Document > Object > Member[name.value="dependencies"] > Object > Member':
          (_node) => {
            /** @type {import('@humanwhocodes/momoa').MemberNode} */
            const node = _node
            if (node.name.type !== 'String' || node.value.type !== 'String')
              return

            const dependency = node.name.value
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
