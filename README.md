# renoma 🩳🕵️

A **re**cursive **no**de\_**m**odules **a**nalyzer with opinionated package health checks.

> NOTE: Please take every lint errors with a grain of salt! Not all suggested changes are necessary and worth the library maintainers' time to review. Make sure to measure and provide an appealing reason for maintainers to accept your PR.

Internally, the CLI uses these tools:

- [publint](https://publint.dev)
- [eslint-plugin-depend](https://github.com/es-tooling/eslint-plugin-depend)
- [eslint-plugin-regexp](https://ota-meshi.github.io/eslint-plugin-regexp/)
- and [custom eslint rules](#custom-lint-rules) for more dependency checks

## Usage

```bash
# Crawl all dependencies and check for issues (breadth first search)
npx renoma

# Only check 5 packages
npx renoma --limit 5

# If 2 packages have errors, exit automatically (helps with debugging)
npx renoma --error-limit 2

# Ignore some packages (comma-separated)
npx renoma --ignore my-pkg,other-pkg

# Show all passing and failing packages
npx renoma --verbose

# List all rules being used for linting (can be affected by --filter-rules)
npx renoma --list-rules

# Filter and run specific rules only. Supports * as wildcard (comma-separated).
npx renoma --filter-rules "regexp/strict,renoma/*"
```

Common commands:

```bash
# Ignore heavy packages
npx renoma --ignore typescript,prettier,eslint

# Find unused dependencies
npx renoma --filter-rules "renoma/no-unused-dependencies"

# Find unused and suspicious dependencies
npx renoma --filter-rules "renoma/*"

# Run publint only
npx renoma --filter-rules "publint"

# Show alternative dependencies used by packages (includes devDependencies)
npx renoma --filter-rules "depend/*"
```

## Custom lint rules

### `renoma/no-missing-sourcemap-sources`

For `.js` and `.d.ts` files that contain an inline sourcemap comment, and for `.map` files, the sourcemap `"sources"` field should reference an existing file. Missing references causes stacktraces to refer to non-existent code paths, making it harder to debug issues, in which case sourcemaps are doing more harm than good.

Sometimes this may be unintentional as the sourcemaps are useful for local development (as the original files exist there), but when published to npm, the original files are not published and causes the missing sources.

**How to fix (either one of these):**

- Publish the original files to npm (e.g. `.ts` files)
- Include the original files content in the sourcemap `"sourcesContent"` field (e.g. [TypeScript's `inlineSources` option](https://www.typescriptlang.org/tsconfig/#inlineSources))
- Remove the sourcemap entirely. If the built code is still readable, sourcemaps may not be as necessary.

### `renoma/no-suspicious-dependencies`

Dependencies with values such as `link:` or `npm:` are flagged as suspicious. For example, `"vite": "npm:my-vite-fork@1.0.0"` makes it seem like it depends on `vite`, but in reality it depends on the `my-vite-fork` package, which might not be what most users expect.

**How to fix:**

- Specify the dependency and the version directly, e.g. `"my-pkg": "^1.2.3"`

### `renoma/no-unused-dependencies`

Dependencies that are not referenced in the source code are flagged as unused. This check works on a best-effort basis as dynamic references like `import('vi' + 'te')` are not detected, but generally can help identify actual unused dependencies too.

**How to fix:**

- Remove the unused dependency from `package.json`

## Sponsors

<p align="center">
  <a href="https://bjornlu.com/sponsor">
    <img src="https://bjornlu.com/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

MIT
