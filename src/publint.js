import fs from 'node:fs/promises'
import path from 'node:path'
import c from 'picocolors'
import { publint } from 'publint'
import { formatMessage } from 'publint/utils'

/**
 * @param {string} pkgDir
 */
export async function lintWithPublint(pkgDir) {
  const pkgJsonPath = path.join(pkgDir, 'package.json')
  const pkgJson = JSON.parse(await fs.readFile(pkgJsonPath, 'utf8'))
  let { messages } = await publint({ pkgDir, pack: false })
  messages = messages.filter((message) => {
    // Currently a lot of package hit with these suggestions that are not really
    // important to be logged
    return (
      message.code !== 'USE_TYPE' && message.code !== 'INVALID_REPOSITORY_VALUE'
    )
  })

  if (messages.length === 0) return ''

  const errors = messages.filter((v) => v.type === 'error')
  const warnings = messages.filter((v) => v.type === 'warning')
  const suggestions = messages.filter((v) => v.type === 'suggestion')
  const messageTypePadLength = suggestions.length ? 11 : warnings.length ? 8 : 5

  // Try to format in a way that's similar to eslint so it looks consistent
  let log = '\n'
  log += c.underline(pkgJsonPath) + ' ' + c.dim('(publint)') + '\n'
  for (const m of errors) {
    log += `  ${c.red(m.type.padEnd(messageTypePadLength))} ${formatMessage(m, pkgJson)}\n`
  }
  for (const m of warnings) {
    log += `  ${c.yellow(m.type.padEnd(messageTypePadLength))} ${formatMessage(m, pkgJson)}\n`
  }
  for (const m of suggestions) {
    log += `  ${c.blue(m.type.padEnd(messageTypePadLength))} ${formatMessage(m, pkgJson)}\n`
  }
  return log
}
