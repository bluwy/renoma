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

# Hide packages that have no lint errors
npx renoma --hide-passing
```

## License

MIT
