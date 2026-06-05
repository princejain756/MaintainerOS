# MaintainerOS

The open-source command center for healthier repositories.

**Live demo:** [https://maintaineros-inky.vercel.app](https://maintaineros-inky.vercel.app)  
**Custom domain:** [https://maintaineros.prince.sh](https://maintaineros.prince.sh) *(add in Vercel after DNS is configured)*

MaintainerOS helps open-source maintainers reduce repetitive work across documentation, issue triage, pull request review, release preparation, contributor onboarding, and security readiness.

Paste maintainer workflow content or model a repository's files, and get actionable scores, checklists, templates, and recommendations.

## Why MaintainerOS exists

Open-source maintainers do more than write code. They review pull requests, triage issues, prepare releases, improve documentation, help contributors, and protect project quality.

That work is essential, repetitive, and often invisible.

MaintainerOS is built to make those workflows faster and more consistent for solo maintainers, student maintainers, indie open-source developers, and small teams that do not have access to expensive maintainer tooling.

## Features

- **Maintainer Health Dashboard** — combined score across docs, repo health, security readiness, and PR risk
- **Repo Health Scanner** — checks README, license, contributing guide, issue templates, PR templates, CI, changelog, lockfile, and security policy
- **README Audit** — scores structure, missing sections, setup clarity, examples, and contributor usefulness
- **Issue Triage Helper** — suggests labels, priority, missing information, and maintainer response templates
- **PR Review Assistant** — estimates risk, merge readiness, review checklist, and test suggestions
- **Release Notes Generator** — turns commit messages into grouped changelogs and version bump suggestions
- **Security Readiness Check** — reviews disclosure policy, lockfile presence, dependency footprint, and risky scripts

## Tech Stack

- React
- TypeScript
- Vite
- Vitest
- ESLint

## Demo

Try the live app: [https://maintaineros-inky.vercel.app](https://maintaineros-inky.vercel.app)

Custom domain: `maintaineros.prince.sh`

```bash
npm install
```

## Usage

```bash
npm run dev
```

Then open the local URL printed by Vite.

## Test

```bash
npm test -- --run
```

## Build

```bash
npm run build
```

## Project Roadmap

- Public GitHub API repository scanning
- GitHub Actions workflow audit
- Contributor onboarding score
- Stale issue and stale PR detection
- Maintainer workload analytics
- Exportable Markdown reports
- GitHub App integration for automated issue and PR comments
- Security policy and release readiness templates

## Example Use Cases

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

## License

MIT
