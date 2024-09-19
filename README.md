# renoma 🩳🕵️

A **re**cursive **no**de **m**odules **a**nalyzer with opinionated package health checks.

> NOTE: Please take every lint errors with a grain of salt! Not all suggested changes are necessary and worth the library maintainers' time to review. Make sure to measure and provide an appealing reason for maintainers to accept your PR.

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

# List all rules being used for linting
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

# Show alternative dependencies used by packages (includes devDependencies)
npx renoma --filter-rules "depend/*"
```

## Sponsors

<p align="center">
  <a href="https://bjornlu.com/sponsor">
    <img src="https://bjornlu.com/sponsors.svg" alt="Sponsors" />
  </a>
</p>

## License

MIT
