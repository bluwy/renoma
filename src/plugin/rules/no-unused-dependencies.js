import path from 'node:path'
import fs from 'node:fs'
import { findPkgJsonPath } from '../../utils.js'

const extensionsWithDependencies = [
  '', // some bin paths are JS but have no extension
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.cts',
  '.mts',
  '.jsx',
  '.tsx',
  '.svelte',
  '.vue',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.styl',
  '.stylus',
  '.pcss',
  '.postcss',
  '.sss'
]

/** @type {import('eslint').Rule.RuleModule} */
export const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow any unused dependencies'
    },
    messages: {
      default: 'Unused dependency "{{dependency}}" found'
    }
  },
  create(context) {
    if (context.filename.endsWith('package.json')) {
      return {
        'Program > JSONExpressionStatement > JSONObjectExpression > JSONProperty[key.value="dependencies"] > JSONObjectExpression':
          (node) => {
            const packageDir = path.dirname(context.physicalFilename)
            /** @type {Map<string, any>} */
            const dependencyToNode = new Map()
            /** @type {Set<string>} */
            const dependencies = new Set(
              node.properties.map((p) => {
                dependencyToNode.set(p.key.value, p)
                return p.key.value
              })
            )

            for (const p of node.properties) {
              const dependency = p.key.value
              const pkgJsonPath = findPkgJsonPath(dependency, packageDir)
              if (!pkgJsonPath) continue

              const depPkgJson = JSON.parse(
                fs.readFileSync(pkgJsonPath, 'utf8')
              )
              const peerDeps = Object.keys(depPkgJson.peerDependencies || {})
              for (const peer of peerDeps) {
                dependencies.delete(normalizeDependencyName(peer))
              }
            }

            // Visit all files from this directory
            const files = fs
              .readdirSync(packageDir, { withFileTypes: true })
              .map((d) => ({
                filePath: path.join(packageDir, d.name),
                dirent: d
              }))
            for (const file of files) {
              if (file.dirent.isFile()) {
                if (
                  !extensionsWithDependencies.includes(
                    path.extname(file.filePath)
                  )
                ) {
                  continue
                }

                const content = fs.readFileSync(file.filePath, 'utf-8')
                for (const dependency of dependencies) {
                  const depName = normalizeDependencyName(dependency)
                  if (
                    content.includes(`"${depName}"`) ||
                    content.includes(`'${depName}'`) ||
                    content.includes(`\`${depName}\``) ||
                    content.includes(`"${depName}/`) ||
                    content.includes(`'${depName}/`) ||
                    content.includes(`\`${depName}/`)
                  ) {
                    dependencies.delete(dependency)
                  }
                }
                if (dependencies.size === 0) {
                  break
                }
              } else if (file.dirent.isDirectory()) {
                if (file.dirent.name === 'node_modules') {
                  continue
                }

                files.push(
                  ...fs
                    .readdirSync(file.filePath, { withFileTypes: true })
                    .map((d) => ({
                      filePath: path.join(file.filePath, d.name),
                      dirent: d
                    }))
                )
              }
            }

            if (dependencies.size) {
              for (const dependency of dependencies) {
                context.report({
                  node: dependencyToNode.get(dependency),
                  messageId: 'default',
                  data: {
                    dependency: dependency
                  }
                })
              }
            }
          }
      }
    }

    return {}
  }
}

function normalizeDependencyName(dependency) {
  if (dependency.startsWith('@types/')) {
    dependency = dependency.slice(7)
    if (dependency.includes('__')) {
      return '@' + dependency.replace('__', '/')
    } else {
      return dependency
    }
  } else {
    return dependency
  }
}
