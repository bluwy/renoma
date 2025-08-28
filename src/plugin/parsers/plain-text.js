import { Linter } from 'eslint'

/** @type {Linter.ESTreeParser} */
export const parser = {
  parse(text) {
    return {
      type: 'Program',
      body: [],
      sourceType: 'module',
      comments: [],
      tokens: [],
      range: [0, text.length],
      loc: {
        start: { line: 1, column: 0 },
        end: { line: text.split('\n').length, column: 0 },
      },
    }
  },
}
