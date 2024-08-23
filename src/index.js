#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { lintPkgDir } from './eslint.js'
import {
  bold,
  crawlDependencies,
  findClosestPkgJsonPath,
  green,
  red
} from './utils.js'

const args = parseArgs({
  options: {
    help: { type: 'boolean', alias: 'h' },
    limit: { type: 'string' },
    'error-limit': { type: 'string' },
    ignore: { type: 'string' },
    'hide-passing': { type: 'boolean' }
  }
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
  --hide-passing  Whether to hide packages with no linting errors.
`)

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
const hidePassing = args.values['hide-passing']

// Metadata
/** @type {Map<string, true | string>} */
const cache = new Map()
let errorCount = 0

const dependencyMetadatas = crawlDependencies(packageJsonPath, crawlLimit)

for (const metadata of dependencyMetadatas) {
  const pkgName = metadata.pkgGraphPath[metadata.pkgGraphPath.length - 1]
  if (ignorePkgNames.includes(pkgName)) continue

  const title = metadata.pkgGraphPath.join(' > ')

  // If hidePassing is not enabled, we can always show the title so that the user knows
  // which packages are being checked now. If it's enabled, we hide it until we know the
  // result of the linting.
  if (!hidePassing) {
    console.log(bold(title + ':'))
  }

  const cacheKey = `${pkgName}@${metadata.pkgVersion}`
  if (cache.has(cacheKey)) {
    const result = cache.get(cacheKey)
    // `true` means there's no linting errors
    if (result === true) {
      if (!hidePassing) {
        console.log(green('✔ No linting errors!') + '\n')
      }
    }
    // `string` points to the first package path that has the linting errors
    else {
      if (hidePassing) {
        console.log(bold(title + ':'))
      }
      console.log(red(`✖ Has lint errors same as ${result}\n`))
    }
    continue
  }

  const resultText = await lintPkgDir(metadata.pkgDir)

  if (resultText) {
    if (hidePassing) {
      console.log(bold(title + ':'))
    }
    console.log(resultText)
    errorCount++

    if (errorLimit && errorCount >= errorLimit) {
      console.log(`Exiting as reached ${errorLimit} error limit`)
      break
    }
  } else if (!hidePassing) {
    console.log(green('✔ No linting errors!') + '\n')
  }

  cache.set(cacheKey, resultText ? title : true)
}

if (errorCount) {
  process.exit(1)
}
