# renoma 🩳🕵️

A **re**cursive **no**de **m**odules **a**nalyzer with opinionated package health checks.

## Usage

```bash
# Crawl all dependencies and check for issues (breadth first search)
npx renoma

# Only check 5 packages
npx renoma --limit 5

# Ignore some packages (comma-separated)
npx renoma --ignore my-pkg,other-pkg
```

## License

MIT
