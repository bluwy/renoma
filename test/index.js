import fs from 'node:fs'

// We need to create this file because `node --test` globs are dumb and just not work

// Import all files from 'rules/*.js`
const ruleFiles = fs.readdirSync(new URL('./rules', import.meta.url))
for (const ruleFile of ruleFiles) {
  import(`./rules/${ruleFile}`)
}
