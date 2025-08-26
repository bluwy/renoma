#!/usr/bin/env node

import { parseArgs } from 'node:util'
import c from 'picocolors'
import { lintWithEslint, listRules } from './eslint.js'
import { lintWithPublint } from './publint.js'
import { crawlDependencies, findClosestPkgJsonPath } from './utils.js'

const args = parseArgs({
  options: {
    help: { type: 'boolean', alias: 'h' },
    limit: { type: 'string' },
    'error-limit': { type: 'string' },
    ignore: { type: 'string' },
    verbose: { type: 'boolean' },
    'filter-rules': { type: 'string' },
    'list-rules': { type: 'boolean' },
  },
})

if (args.values.help) {
  console.log(`\
$ renoma --help

A recursive node modules analyzer with opinionated package health checks.

Usage
  $ renoma [options]

Options
  -h, --help      Display this message.
  --limit         Set a limit on how many packages are checked.
  --error-limit   Set a limit on how many packages with errors are checked.
  --ignore        Ignore some packages (comma-separated).
  --verbose       Show passing and failing state of all packages.
  --filter-rules  Filter and run specific rules only. Supports * as wildcard (comma-separated).
  --list-rules    List all available lint rules.
`)

  process.exit(0)
}

// CLI args
const rawFilterRules = args.values['filter-rules']
const filterRules = rawFilterRules
  ? rawFilterRules.split(',').map((r) => {
      if (r.includes('*')) {
        return new RegExp(r.replace(/\*/g, '.*'))
      } else {
        return r
      }
    })
  : undefined

if (args.values['list-rules']) {
  /** @type {Record<string, import('picocolors/types.js').Formatter>} */
  const ruleColor = {
    'depend/': c.cyan,
    'regexp/': c.yellow,
    'renoma/': c.magenta,
  }
  const enabledRules = listRules(filterRules)
  // publint is a special rule that's not handled by eslint. it's a separate process instead.
  if (!filterRules?.includes('publint')) {
    enabledRules.push('publint')
  }
  console.log(
    enabledRules
      .map((r) => {
        if (r.includes('/')) {
          return (
            '- ' + c.gray(r.replace(/^.+?\//, (s) => ruleColor[s]?.(s) ?? s))
          )
        } else {
          return '- ' + r
        }
      })
      .join('\n'),
  )

  process.exit(0)
}

const packageJsonPath = findClosestPkgJsonPath(process.cwd())
if (!packageJsonPath) {
  console.error(`No closest package.json found from ${process.cwd()}`)
  process.exit(1)
}

// CLI args
const crawlLimit = args.values.limit ? Number(args.values.limit) : undefined
const ignorePkgNames = args.values.ignore ? args.values.ignore.split(',') : []
const errorLimit = args.values['error-limit']
  ? Number(args.values['error-limit'])
  : undefined
const verbose = !!args.values.verbose

// Metadata
/** @type {Map<string, true | string>} */
const cache = new Map()
let errorCount = 0

// Check if we can skip eslint and publint
const shouldRunEslint =
  !rawFilterRules ||
  rawFilterRules
    .split(',')
    .some(
      (r) =>
        r.startsWith('depend/') ||
        r.startsWith('regexp/') ||
        r.startsWith('renoma/'),
    )
const shouldRunPublint =
  !rawFilterRules || rawFilterRules.split(',').includes('publint')

const dependencyMetadatas = crawlDependencies(packageJsonPath, crawlLimit)

for (const metadata of dependencyMetadatas) {
  const pkgName = metadata.pkgGraphPath[metadata.pkgGraphPath.length - 1]
  if (ignorePkgNames.includes(pkgName)) continue

  const title = metadata.pkgGraphPath.join(' > ')

  // If verbose is enabled, we can always show the title so that the user knows
  // which packages are being checked now. If it's disabled, we hide it until we know the
  // result of the linting.
  if (verbose) {
    console.log(c.bold(title + ':'))
  }

  const cacheKey = `${pkgName}@${metadata.pkgVersion}`
  if (cache.has(cacheKey)) {
    if (verbose) {
      const result = cache.get(cacheKey)
      // `true` means there's no linting errors
      if (result === true) {
        console.log(c.green('✔ No linting errors!') + '\n')
      }
      // `string` points to the first package path that has the linting errors
      else {
        console.log(c.red(`✖ Has lint errors same as ${result}\n`))
      }
    }
    continue
  }

  // Lint the package
  let resultText = ''
  if (shouldRunPublint) {
    const publintResultText = await lintWithPublint(metadata.pkgDir)
    if (publintResultText) resultText += publintResultText
  }
  if (shouldRunEslint) {
    const eslintResultText = await lintWithEslint(metadata.pkgDir, filterRules)
    if (eslintResultText) resultText += eslintResultText
  }

  // Log the results
  if (resultText) {
    if (!verbose) {
      console.log(c.bold(title + ':'))
    }
    // Result text (especially from eslint) sometimes doesn't close its colors,
    // so we reset it here just in case.
    console.log(resultText + c.reset(''))
    errorCount++

    if (errorLimit && errorCount >= errorLimit) {
      console.log(`Exiting as reached ${errorLimit} error limit`)
      break
    }
  } else if (verbose) {
    console.log(c.green('✔ No linting errors!') + '\n')
  }

  cache.set(cacheKey, resultText ? title : true)
}

if (errorCount) {
  console.log(
    c.bold(
      c.blue(
        `Scanned ${dependencyMetadatas.length} packages. ${errorCount} packages have errors.`,
      ),
    ),
  )
  process.exit(1)
} else if (!verbose) {
  console.log(
    c.bold(
      c.green(`Scanned ${dependencyMetadatas.length} packages. All good!`),
    ),
  )
}
