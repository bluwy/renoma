import path from 'node:path'
import fs from 'node:fs'
import { findPkgJsonPath } from '../../utils.js'

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
            /** @type {Map<string, any>} */
            const dependencyToNode = new Map()
            /** @type {Set<string>} */
            const dependencies = new Set(
              node.properties.map((p) => {
                dependencyToNode.set(p.key.value, p)
                return p.key.value
              })
            )

            node.properties.forEach((p) => {
              const dependency = p.key.value
              const pkgJsonPath = findPkgJsonPath(
                dependency,
                path.dirname(context.filename)
              )
              if (!pkgJsonPath) return []

              const depPkgJson = JSON.parse(
                fs.readFileSync(pkgJsonPath, 'utf8')
              )
              for (let peer of Object.keys(depPkgJson.peerDependencies || {})) {
                if (peer.startsWith('@types/')) {
                  peer = peer.slice(7).replace('__', '/')
                }
                dependencies.delete(peer)
              }
            })

            // Visit all files from this directory
            const packageDir = path.dirname(context.filename)
            const files = fs
              .readdirSync(packageDir, { withFileTypes: true })
              .map((d) => ({
                filePath: fs.realpathSync(path.join(packageDir, d.name)),
                dirent: d
              }))
            for (const file of files) {
              if (file.dirent.isFile()) {
                if (
                  !['.js', '.ts', '.jsx', '.tsx', '.svelte', '.vue'].includes(
                    path.extname(file.filePath)
                  )
                ) {
                  continue
                }

                const content = fs.readFileSync(file.filePath, 'utf-8')
                for (const dependency of dependencies) {
                  if (
                    content.includes(`"${dependency}"`) ||
                    content.includes(`'${dependency}'`) ||
                    content.includes(`\`${dependency}\``) ||
                    content.includes(`"${dependency}/`) ||
                    content.includes(`'${dependency}/`) ||
                    content.includes(`\`${dependency}/`)
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
                      filePath: fs.realpathSync(
                        path.join(file.filePath, d.name)
                      ),
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
