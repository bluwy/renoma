import path from 'node:path'
import fs from 'node:fs'

const extensionsWithSourcemapComment = [
  '.js',
  '.mjs',
  '.cjs',
  '.d.ts',
  '.d.mts',
  '.d.cts',
]
const sourcemapCommentRE =
  /[#@] sourceMappingURL=data:application\/json;base64,([^\s]+)/

// NOTE: This rule only works with the plain text parser
/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow sourcemap sources that point to missing files',
    },
    messages: {
      default: 'Sourcemap "sources" points to missing files',
    },
  },
  create(context) {
    if (
      extensionsWithSourcemapComment.some((ext) =>
        context.filename.endsWith(ext),
      )
    ) {
      return {
        Program() {
          const lastComment = findLastSourcemapComment(context.sourceCode.text)
          if (!lastComment) return

          const match = sourcemapCommentRE.exec(lastComment.value)
          if (!match) return

          const sourcemap = JSON.parse(
            Buffer.from(match[1], 'base64').toString('utf8'),
          )
          validateSourcemap(sourcemap, lastComment, context)
        },
      }
    } else if (context.filename.endsWith('.map')) {
      return {
        Program() {
          const sourcemap = JSON.parse(context.sourceCode.text)
          validateSourcemap(sourcemap, context.sourceCode.ast, context)
        },
      }
    }

    return {}
  },
}

/**
 * @param {Record<string, any>} sourcemap
 * @param {import('eslint').JSSyntaxElement} node
 * @param {import('eslint').Rule.RuleContext} context
 */
function validateSourcemap(sourcemap, node, context) {
  if (typeof sourcemap !== 'object') return true
  if (!sourcemap.sources) return true
  // If the content for each sources is already provided, then we don't really
  // need to check if the files exist
  if (sourcemap.sourcesContent) return true

  for (const source of sourcemap.sources) {
    const sourcePath = path.resolve(path.dirname(context.filename), source)
    if (!fs.existsSync(sourcePath)) {
      context.report({
        node,
        messageId: 'default',
      })
      return false
    }
  }
  return true
}

/**
 * @param {string} rawText
 */
function findLastSourcemapComment(rawText) {
  const a = rawText.lastIndexOf('//# sourceMappingURL=')
  const b = rawText.lastIndexOf('//@ sourceMappingURL=')
  const idx = Math.max(a, b)
  if (idx === -1) return null
  const newLine = rawText.indexOf('\n', idx)
  const value = rawText.slice(idx, newLine === -1 ? undefined : newLine)
  const loc = {
    start: getLineColFromIndex(rawText, idx),
    end: getLineColFromIndex(rawText, idx + rawText.length),
  }
  return { type: 'Line', value: value.slice(2), loc }
}

/**
 * @param {string} text
 * @param {number} index
 */
function getLineColFromIndex(text, index) {
  const lines = text.slice(0, index).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}
