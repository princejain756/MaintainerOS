import type { GithubScanResult } from './githubClient'
import type { IssueTriage, PrReview, ReleasePlan, ScoreCard } from './maintainerEngines'

export type MaintainerReportInput = {
  scan: GithubScanResult
  readmeScore: ScoreCard
  repoScore: ScoreCard
  securityScore: ScoreCard
  issueTriage: IssueTriage
  prReview: PrReview
  releasePlan: ReleasePlan
  maintainerScore: number
}

export function formatMaintainerReport(input: MaintainerReportInput) {
  const { scan, readmeScore, repoScore, securityScore, issueTriage, prReview, releasePlan, maintainerScore } = input
  const generatedAt = new Date().toISOString()

  return `# MaintainerOS Report: ${scan.fullName}

Generated at: ${generatedAt}

## Executive Summary

| Metric | Score | Grade |
| --- | ---: | :---: |
| Maintainer Health | ${maintainerScore} | ${grade(maintainerScore)} |
| README Quality | ${readmeScore.score} | ${readmeScore.grade} |
| Repo Health | ${repoScore.score} | ${repoScore.grade} |
| Security Readiness | ${securityScore.score} | ${securityScore.grade} |
| PR Merge Readiness | ${prReview.mergeReadiness} | ${grade(prReview.mergeReadiness)} |

## Repository Snapshot

- Repository: https://github.com/${scan.fullName}
- Stars: ${scan.stars}
- Open issues sampled: ${scan.openIssues}
- Open pull requests sampled: ${scan.openPullRequests}
- Last pushed: ${scan.lastPushedAt || 'unknown'}

## Next Best Actions

${toList(scan.actions)}

## Repository Health Signals

${formatSignals(repoScore)}

## README Quality Signals

${formatSignals(readmeScore)}

## Security Signals

${formatSignals(securityScore)}

## Issue Triage

- Suggested priority: ${issueTriage.priority}
- Suggested labels: ${issueTriage.labels.join(', ')}
- Missing information: ${issueTriage.missingInfo.length ? issueTriage.missingInfo.join(', ') : 'none detected'}

### Suggested maintainer reply

> ${issueTriage.responseTemplate}

## Pull Request Review

- Risk level: ${prReview.risk}
- Merge readiness: ${prReview.mergeReadiness}/100

### Review checklist

${toList(prReview.checklist)}

### Test suggestions

${toList(prReview.testSuggestions)}

## Release Plan

- Suggested version bump: ${releasePlan.versionSuggestion}

### Generated changelog

${releasePlan.changelog}

### Release checklist

${toList(releasePlan.checklist)}

## How to improve this score

1. Add missing maintainer infrastructure files.
2. Keep README setup and usage commands copy-pasteable.
3. Add issue and pull request templates that request actionable context.
4. Keep CI, tests, changelog, and security policy active.
5. Review stale issues and pull requests regularly.
`
}

function formatSignals(card: ScoreCard) {
  return card.signals
    .map((signal) => `- **${signal.label}** (${signal.severity}): ${signal.detail}`)
    .join('\n')
}

function toList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- None'
}

function grade(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}
