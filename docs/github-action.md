# MaintainerOS GitHub Action

MaintainerOS can run inside GitHub Actions to generate an automated maintainer health report for a repository.

This moves MaintainerOS from a website-only scanner into workflow infrastructure that maintainers can run on demand or on a schedule.

## What the workflow does

The report workflow:

1. Checks out the repository
2. Installs dependencies
3. Scans the public GitHub repository through the GitHub API
4. Generates `maintaineros-report.md`
5. Uploads the report as a workflow artifact
6. Optionally fails if the maintainer health score is below a configured threshold

## Included workflow

This repository includes:

```text
.github/workflows/maintaineros-report.yml
```

It runs:

- manually with `workflow_dispatch`
- weekly on Monday at 09:00 UTC

## Manual usage

Run locally:

```bash
npm run report -- --repo princejain756/MaintainerOS --output maintaineros-report.md
```

Require a minimum score:

```bash
npm run report -- --repo princejain756/MaintainerOS --output maintaineros-report.md --min-score 80
```

Export JSON for automation pipelines:

```bash
npm run report -- --repo princejain756/MaintainerOS --output maintaineros-report.json --format json
```

Use a GitHub token for higher API limits in CI or local runs:

```bash
GITHUB_TOKEN=ghp_xxx npm run report -- --repo princejain756/MaintainerOS --output maintaineros-report.md
```

## Copy into another repository

A maintainer can copy the workflow into another project and use MaintainerOS as a reference implementation for repo health reporting.

```yaml
name: MaintainerOS Report

on:
  workflow_dispatch:
  schedule:
    - cron: "0 9 * * 1"

permissions:
  contents: read

jobs:
  maintaineros-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run report -- --repo "$GITHUB_REPOSITORY" --output maintaineros-report.md --min-score 70
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: maintaineros-report
          path: maintaineros-report.md
```

## Report sections

The generated report includes:

- Maintainer health summary
- README quality score
- Repo health score
- Security readiness score
- PR merge-readiness score
- Repository snapshot
- Next best maintainer actions
- README, repo, and security signals
- Issue triage output
- Pull request review checklist
- Generated release plan

## API limits

The current workflow uses the public GitHub API. Unauthenticated requests are limited, so future versions will support a `GITHUB_TOKEN` or custom token for higher limits.
