import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

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

          const sourcemap = tryJsonParse(
            Buffer.from(match[1], 'base64').toString('utf8'),
          )
          if (!sourcemap) return
          validateSourcemap(sourcemap, lastComment, context)
        },
      }
    } else if (context.filename.endsWith('.map')) {
      return {
        Program() {
          const sourcemap = tryJsonParse(context.sourceCode.text)
          if (!sourcemap) return
          validateSourcemap(sourcemap, context.sourceCode.ast, context)
        },
      }
    }

    return {}
  },
}

/**
 * @param {string} text
 */
function tryJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * @param {Record<string, any>} sourcemap
 * @param {import('eslint').JSSyntaxElement} node
 * @param {import('eslint').Rule.RuleContext} context
 */
function validateSourcemap(sourcemap, node, context) {
  if (typeof sourcemap !== 'object') return true
  if (!sourcemap.sources) return true
  const sourceRoot = sourcemap.sourceRoot || ''
  const sourcePrefix = sourceRoot
    ? sourceRoot.endsWith('/')
      ? sourceRoot
      : `${sourceRoot}/`
    : ''
  const mapURL = pathToFileURL(context.filename)

  for (const [index, source] of sourcemap.sources.entries()) {
    // Embedded content only covers the source at the same index. An empty
    // string is also valid content, while null means it must be retrieved.
    if (
      source === null ||
      typeof sourcemap.sourcesContent?.[index] === 'string'
    ) {
      continue
    }

    let sourceURL
    try {
      sourceURL = new URL(`${sourcePrefix}${source}`, mapURL)
    } catch {
      // An invalid URL cannot point to an available source file.
    }
    // External and virtual sources cannot be checked on the local filesystem.
    if (sourceURL && sourceURL.protocol !== 'file:') continue

    if (!sourceURL || !fs.existsSync(sourceURL)) {
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
