# Changelog

All notable changes to MaintainerOS are documented in this file.

## [1.0.3] - 2026-06-13

### Added

- Stale issue and stale PR detection with maintainer backlog signals
- Exportable JSON report format in dashboard and CLI (`--format json`)
- Optional GitHub token support for higher API limits in browser and CI
- Security workflow detection for CodeQL, dependency review, and similar CI checks
- Stronger risky npm script pattern detection
- README ecosystem positioning, roadmap progress, and CLI examples

### Changed

- Dashboard now shows stale backlog panel and JSON export action
- Maintainer reports include stale backlog section
- Security scoring rewards repos with automated security workflows

## [1.0.2] - 2026-06-07

### Added

- README screenshots and demo section
- Root `ROADMAP.md` for repository About visibility
- Preview images for dashboard, repo health, and GitHub Actions report
- SEO and Open Graph metadata for the live site

### Changed

- Updated repository homepage to `maintaineros.prince.sh`
- Improved README polish for reviewers and new visitors

## [1.0.1] - 2026-06-05

### Added

- MaintainerOS report CLI for local and CI report generation
- GitHub Actions maintainer report workflow with artifact upload
- Report formatter with Markdown output for maintainer health summaries
- GitHub repository topics, roadmap issues, and v1.0.0 release metadata
- README security section explaining public access, privacy, and API usage

### Changed

- Improved project documentation for reviewers, visitors, and maintainers

## [1.0.0] - 2026-06-05

### Added

- Live GitHub repository scanning via the public GitHub API
- Maintainer health dashboard with docs, repo health, and security scores
- README audit with structure and missing-section detection
- Repo health scanner for license, contributing guide, templates, CI, and lockfile
- Issue triage helper with labels, priority, and maintainer reply templates
- PR review assistant with risk scoring and merge-readiness checklist
- Release notes generator from recent commit messages
- Security readiness checks for policy, lockfile, and dependency footprint
- Production deployment at maintaineros.prince.sh
- Maintainer infrastructure: LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CI, and GitHub templates

### Changed

- Replaced demo-only scoring with live repository analysis
- Improved README and project positioning for open-source maintainers
