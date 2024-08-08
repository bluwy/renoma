#!/usr/bin/env node

import mri from 'mri'
import { lintPkgDir } from './eslint.js'
import {
  bold,
  crawlDependencies,
  findClosestPkgJsonPath,
  green,
  red
} from './utils.js'

const args = mri(process.argv.slice(2), {
  string: ['limit', 'ignore'],
  boolean: ['help'],
  alias: {
    h: 'help'
  }
})

if (args.help) {
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
`)

  process.exit(0)
}

const packageJsonPath = findClosestPkgJsonPath(process.cwd())
if (!packageJsonPath) {
  console.error(`No closest package.json found from ${process.cwd()}`)
  process.exit(1)
}

const crawlLimit = Number(args.limit)
const dependencyMetadatas = crawlDependencies(
  packageJsonPath,
  Number.isNaN(crawlLimit) ? undefined : crawlLimit
)

const ignorePkgNames = args.ignore ? args.ignore.split(',') : []
const errorLimit = args['error-limit'] ? Number(args['error-limit']) : undefined

/** @type {Map<string, true | string>} */
const cache = new Map()
let errorCount = 0

for (const metadata of dependencyMetadatas) {
  const pkgName = metadata.pkgGraphPath[metadata.pkgGraphPath.length - 1]
  if (ignorePkgNames.includes(pkgName)) continue

  const title = metadata.pkgGraphPath.join(' > ')
  console.log(bold(title + ':'))

  const cacheKey = `${pkgName}@${metadata.pkgVersion}`
  if (cache.has(cacheKey)) {
    const result = cache.get(cacheKey)
    if (result === true) {
      console.log(green('✔ No linting errors!') + '\n')
    } else {
      console.log(red(`✖ Has lint errors same as ${result}\n`))
    }
    continue
  }

  const resultText = await lintPkgDir(metadata.pkgDir)

  if (resultText) {
    console.log(resultText)
    errorCount++

    if (errorLimit && errorCount >= errorLimit) {
      console.log(`Exiting as reached ${errorLimit} error limit`)
      break
    }
  } else {
    console.log(green('✔ No linting errors!') + '\n')
  }

  cache.set(cacheKey, resultText ? title : true)
}

if (errorCount) {
  process.exit(1)
}
