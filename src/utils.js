import fs from 'node:fs'
import path from 'node:path'

/**
 * @typedef {{
 *   pkgDir: string,
 *   pkgGraphPath: string[],
 *   pkgVersion: string
 * }} DependencyMetadata
 */

/**
 * @param {string} pkgJsonPath
 * @param {number} [limit]
 * @returns {DependencyMetadata[]}
 */
export function crawlDependencies(pkgJsonPath, limit) {
  /** @type {DependencyMetadata[]} */
  const metadatas = []

  crawl(path.dirname(pkgJsonPath), [], true)

  if (limit != null && metadatas.length >= limit) {
    return metadatas.slice(0, limit)
  }

  for (const metadata of metadatas) {
    crawl(metadata.pkgDir, metadata.pkgGraphPath)

    if (limit != null && metadatas.length >= limit) {
      break
    }
  }

  return metadatas

  /**
   * @param {string} pkgDir
   * @param {string[]} parentDepNames
   * @param {boolean} isRoot
   */
  function crawl(pkgDir, parentDepNames, isRoot = false) {
    const pkgJsonContent = fs.readFileSync(
      path.join(pkgDir, 'package.json'),
      'utf8',
    )
    const pkgJson = JSON.parse(pkgJsonContent)
    const pkgDependencies = Object.keys(pkgJson.dependencies || {})

    if (isRoot) {
      pkgDependencies.push(...Object.keys(pkgJson.devDependencies || {}))
    }

    for (const depName of pkgDependencies) {
      // Prevent dep loop
      if (parentDepNames.includes(depName)) continue

      const depPkgJsonPath = findPkgJsonPath(depName, pkgDir)
      if (!depPkgJsonPath) continue

      const depPkgJson = JSON.parse(fs.readFileSync(depPkgJsonPath, 'utf8'))

      metadatas.push({
        pkgDir: path.dirname(depPkgJsonPath),
        pkgGraphPath: parentDepNames.concat(depPkgJson.name),
        pkgVersion: depPkgJson.version,
      })

      if (limit != null && metadatas.length >= limit) {
        break
      }
    }
  }
}

/**
 * @param {string} dir
 */
export function findClosestPkgJsonPath(dir) {
  while (dir) {
    const pkg = path.join(dir, 'package.json')
    try {
      if (fs.existsSync(pkg)) {
        return pkg
      }
    } catch {}
    const nextDir = path.dirname(dir)
    if (nextDir === dir) break
    dir = nextDir
  }
  return undefined
}

/**
 * @param {string} pkgName
 * @param {string} basedir
 */
export function findPkgJsonPath(pkgName, basedir) {
  while (basedir) {
    const pkg = path.join(basedir, 'node_modules', pkgName, 'package.json')
    try {
      if (fs.existsSync(pkg)) {
        return fs.realpathSync(pkg)
      }
    } catch {}
    const nextBasedir = path.dirname(basedir)
    if (nextBasedir === basedir) break
    basedir = nextBasedir
  }
  return undefined
}

/**
 * @param {T | T[]} target
 * @template T
 * @returns {T[]}
 */
export function arraify(target) {
  return Array.isArray(target) ? target : [target]
}
