# MaintainerOS

The open-source command center for healthier repositories.

[![Live Demo](https://img.shields.io/badge/demo-maintaineros.prince.sh-66e3ff)](https://maintaineros.prince.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/princejain756/MaintainerOS/actions/workflows/ci.yml/badge.svg)](https://github.com/princejain756/MaintainerOS/actions/workflows/ci.yml)

**Live demo:** [https://maintaineros.prince.sh](https://maintaineros.prince.sh)

MaintainerOS helps open-source maintainers reduce repetitive work across documentation, issue triage, pull request review, release preparation, contributor onboarding, and security readiness.

Paste a public GitHub repository URL and MaintainerOS fetches live data from the GitHub API — README, repository files, recent commits, open issues, and open pull requests — then generates actionable scores and maintainer recommendations.

## Why MaintainerOS exists

Open-source maintainers do more than write code. They review pull requests, triage issues, prepare releases, improve documentation, help contributors, and protect project quality.

That work is essential, repetitive, and often invisible.

MaintainerOS is built to make those workflows faster and more consistent for solo maintainers, student maintainers, indie open-source developers, and small teams that do not have access to expensive maintainer tooling.

## Features

- **Live GitHub repository scanning** — fetches README, repo files, commits, issues, and pull requests from the public GitHub API
- **MaintainerOS Report Workflow** — generates a Markdown maintainer health report in GitHub Actions on demand or weekly
- **Repo Health Scanner** — checks README, license, contributing guide, issue templates, PR templates, CI, changelog, lockfile, and security policy
- **README Audit** — scores structure, missing sections, setup clarity, examples, and contributor usefulness
- **Issue Triage Helper** — suggests labels, priority, missing information, and maintainer response templates
- **PR Review Assistant** — estimates risk, merge readiness, review checklist, and test suggestions
- **Release Notes Generator** — turns commit messages into grouped changelogs and version bump suggestions
- **Security Readiness Check** — reviews disclosure policy, lockfile presence, dependency footprint, and risky scripts

## Quick start

### Try the live app

Open [https://maintaineros.prince.sh](https://maintaineros.prince.sh), paste a public GitHub repository URL, and click **Analyze repository**.

### Run locally

```bash
git clone https://github.com/princejain756/MaintainerOS.git
cd MaintainerOS
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev
```

Example repositories to scan:

- `https://github.com/princejain756/MaintainerOS`
- `https://github.com/facebook/react`
- `https://github.com/vercel/next.js`

## Test

```bash
npm test -- --run
```

## Build

```bash
npm run build
```

## Tech Stack

- React
- TypeScript
- Vite
- Vitest
- ESLint
- GitHub REST API

## Project structure

```text
src/
  App.tsx                 # Maintainer dashboard UI
  githubClient.ts         # Live GitHub repository scanning
  maintainerEngines.ts    # Scoring and analysis logic
```

## MaintainerOS GitHub Action

MaintainerOS now includes workflow infrastructure, not only a web dashboard.

Run a maintainer health report locally:

```bash
npm run report -- --repo princejain756/MaintainerOS --output maintaineros-report.md
```

Or use the included GitHub Actions workflow:

```text
.github/workflows/maintaineros-report.yml
```

The workflow runs manually or weekly, generates `maintaineros-report.md`, uploads it as an artifact, and can fail when the maintainer score drops below a minimum threshold.

See [docs/github-action.md](docs/github-action.md).

## Project Roadmap

- GitHub token support for higher API limits
- GitHub Actions workflow audit
- Contributor onboarding score
- Stale issue and stale PR detection
- Maintainer workload analytics
- Exportable Markdown reports
- GitHub App integration for automated issue and PR comments

## Example use cases

### For maintainers

- Understand whether a repository is ready for contributors
- Improve issue quality with response templates
- Review pull requests with consistent risk checklists
- Prepare cleaner changelogs and releases
- Identify missing security and contribution infrastructure

### For contributors

- Understand what a project expects before opening an issue or PR
- See what information maintainers need
- Improve project documentation before asking for adoption

### For open-source programs

- Evaluate repository readiness
- Surface maintenance risks
- Encourage healthier contribution workflows

## Why this repository qualifies for maintainer support

MaintainerOS directly supports open-source maintainers by reducing repetitive maintenance work across documentation, issue triage, pull request review, release preparation, contributor onboarding, and repository health checks.

Open-source maintainers often spend significant time answering incomplete issues, reviewing unclear pull requests, preparing releases, improving documentation, and preserving project quality. MaintainerOS provides a free browser-based command center that gives maintainers actionable scores, checklists, templates, and recommendations for these workflows.

The project is public, open source, and built with React, TypeScript, Vite, and Vitest. Its goal is to make high-quality maintainer tooling accessible without requiring paid infrastructure or complex setup.

## Security

MaintainerOS is a **public web tool**. Anyone can visit [maintaineros.prince.sh](https://maintaineros.prince.sh) and scan **public** GitHub repositories. That is intentional.

### What is public

- The website itself is publicly accessible over HTTPS
- Anyone can paste a public GitHub repository URL and run a scan
- Scan results are generated in the browser from publicly available GitHub data

### What MaintainerOS does not store or expose

- No OpenAI API keys in the frontend
- No GitHub personal access tokens in the website
- No user accounts or login system
- No backend database of scanned repositories
- No access to private repositories
- No access to a visitor's GitHub account

The live app uses the **public GitHub REST API without authentication**. It only requests repository data that GitHub already exposes for public repos, such as README content, repository files, commits, open issues, and open pull requests.

### CLI and GitHub Actions

The report CLI and GitHub Actions workflow run in trusted environments:

- Locally on a maintainer's machine, or
- Inside GitHub Actions using the repository context

Optional tokens such as `GITHUB_TOKEN` are only intended for CI or local automation. They should never be embedded in frontend code or committed to the repository.

### Current limitations

- Public GitHub API rate limits apply to unauthenticated scans
- Only public repositories can be analyzed in the current version
- The web app does not yet include abuse protection or authenticated private-repo scanning

### Reporting vulnerabilities

If you discover a security issue in MaintainerOS itself, please report it responsibly. Do not open a public GitHub issue for vulnerabilities.

See [SECURITY.md](SECURITY.md) for the disclosure process.

## Contributing

## License

MIT. See [LICENSE](LICENSE).
