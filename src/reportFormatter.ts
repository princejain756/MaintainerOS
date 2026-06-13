import type { GithubScanResult } from './githubClient'
import type { IssueTriage, MaintainerWorkload, PrReview, ReleasePlan, ScoreCard, StaleSummary, WorkflowAudit } from './maintainerEngines'

export type MaintainerReportInput = {
  scan: GithubScanResult
  readmeScore: ScoreCard
  repoScore: ScoreCard
  securityScore: ScoreCard
  issueTriage: IssueTriage
  prReview: PrReview
  prSummary: string
  releasePlan: ReleasePlan
  staleSummary: StaleSummary
  workload: MaintainerWorkload
  workflowAudit: WorkflowAudit
  maintainerScore: number
}

export function formatMaintainerReport(input: MaintainerReportInput) {
  const {
    scan,
    readmeScore,
    repoScore,
    securityScore,
    issueTriage,
    prReview,
    prSummary,
    releasePlan,
    staleSummary,
    workload,
    workflowAudit,
    maintainerScore,
  } = input
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
| Maintainer Workload | ${workload.score} | ${grade(workload.score)} |
| Workflow Audit | ${workflowAudit.score} | ${workflowAudit.grade} |

## Repository Snapshot

- Repository: https://github.com/${scan.fullName}
- Stars: ${scan.stars}
- Open issues sampled: ${scan.openIssues}
- Open pull requests sampled: ${scan.openPullRequests}
- Stale backlog (${staleSummary.thresholdDays}+ days): ${staleSummary.totalStale}
- Workload burden: ${workload.burden}
- Workflows audited: ${workflowAudit.workflowsFound}
- Last pushed: ${scan.lastPushedAt || 'unknown'}

## Next Best Actions

${toList(scan.actions)}

## Stale Backlog

${formatStaleSummary(staleSummary)}

## Maintainer Workload

- Burden level: ${workload.burden}
- Workload score: ${workload.score}/100

${workload.signals.map((signal) => `- **${signal.label}** (${signal.severity}): ${signal.detail}`).join('\n')}

## GitHub Actions Workflow Audit

- Workflows found: ${workflowAudit.workflowsFound}
- Audit score: ${workflowAudit.score}/100 (${workflowAudit.grade})

${workflowAudit.signals.map((signal) => `- **${signal.label}** (${signal.severity}): ${signal.detail}`).join('\n')}

### Workflow recommendations

${toList(workflowAudit.recommendations)}

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

### Maintainer summary

> ${prSummary}

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

export function formatMaintainerReportJson(input: MaintainerReportInput) {
  const {
    scan,
    readmeScore,
    repoScore,
    securityScore,
    issueTriage,
    prReview,
    prSummary,
    releasePlan,
    staleSummary,
    workload,
    workflowAudit,
    maintainerScore,
  } = input

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      repository: {
        fullName: scan.fullName,
        url: `https://github.com/${scan.fullName}`,
        stars: scan.stars,
        openIssues: scan.openIssues,
        openPullRequests: scan.openPullRequests,
        lastPushedAt: scan.lastPushedAt,
      },
      scores: {
        maintainerHealth: maintainerScore,
        readmeQuality: readmeScore.score,
        repoHealth: repoScore.score,
        securityReadiness: securityScore.score,
        prMergeReadiness: prReview.mergeReadiness,
        maintainerWorkload: workload.score,
        workflowAudit: workflowAudit.score,
      },
      grades: {
        maintainerHealth: grade(maintainerScore),
        readmeQuality: readmeScore.grade,
        repoHealth: repoScore.grade,
        securityReadiness: securityScore.grade,
        prMergeReadiness: grade(prReview.mergeReadiness),
        maintainerWorkload: grade(workload.score),
        workflowAudit: workflowAudit.grade,
      },
      actions: scan.actions,
      staleSummary,
      workload,
      workflowAudit,
      prSummary,
      signals: {
        readme: readmeScore.signals,
        repo: repoScore.signals,
        security: securityScore.signals,
        stale: staleSummary.signals,
        workload: workload.signals,
        workflow: workflowAudit.signals,
      },
      issueTriage,
      prReview,
      releasePlan,
      repoFiles: scan.repoFiles,
    },
    null,
    2,
  )
}

function formatStaleSummary(staleSummary: StaleSummary) {
  if (staleSummary.totalStale === 0) {
    return `- No stale issues or pull requests detected in the last ${staleSummary.thresholdDays} day window.`
  }

  const lines = staleSummary.signals.map((signal) => `- **${signal.label}** (${signal.severity}): ${signal.detail}`)
  const staleItems = [...staleSummary.staleIssues, ...staleSummary.stalePullRequests]
    .slice(0, 10)
    .map((item) => `- ${item.type === 'issue' ? 'Issue' : 'PR'} #${item.number}: ${item.title} (${item.daysSinceUpdate} days)`)

  return [...lines, '', ...staleItems].join('\n')
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
