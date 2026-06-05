# Contributing to MaintainerOS

Thanks for helping improve MaintainerOS. This project exists to reduce repetitive work for open-source maintainers, so clear issues and focused pull requests are especially valuable.

## Ways to contribute

- Report bugs with reproduction steps
- Suggest features that help maintainers triage, review, release, or audit repositories
- Improve documentation and onboarding
- Fix issues labeled `good first issue`
- Add tests for scoring and GitHub scanning logic

## Development setup

```bash
git clone https://github.com/princejain756/MaintainerOS.git
cd MaintainerOS
npm install
npm run dev
```

## Before opening a pull request

Run the project checks locally:

```bash
npm test -- --run
npm run lint
npm run build
```

## Pull request guidelines

- Explain the maintainer problem your change solves
- Keep changes focused and easy to review
- Add or update tests when behavior changes
- Update README or docs when user-facing behavior changes
- Mention any GitHub API limitations or trade-offs

## Issue guidelines

When reporting a bug, include:

- Repository URL you scanned
- Expected result
- Actual result
- Browser and environment details

When requesting a feature, explain:

- Which maintainer workflow it improves
- Who benefits from it
- Why existing tools do not solve it well enough

## Code style

- Match the existing TypeScript and React patterns in the repo
- Prefer small, testable functions for analysis logic
- Avoid unnecessary dependencies

## Community standards

Be respectful, constructive, and specific. MaintainerOS is built for people doing invisible open-source work, so keep feedback practical and actionable.
