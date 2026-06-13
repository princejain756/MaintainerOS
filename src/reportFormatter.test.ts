import { describe, expect, it } from 'vitest'
import { formatMaintainerReport, formatMaintainerReportJson } from './reportFormatter'

const score = {
  score: 100,
  grade: 'A',
  summary: 'Strong',
  signals: [{ label: 'License present', detail: 'License makes usage rights clear.', severity: 'good' as const }],
}

const staleSummary = {
  thresholdDays: 30,
  staleIssues: [],
  stalePullRequests: [],
  totalStale: 0,
  signals: [{ label: 'No stale backlog detected', detail: 'Open issues and pull requests were updated within the last 30 days.', severity: 'good' as const }],
}

const baseInput = {
  scan: {
    owner: 'princejain756',
    repo: 'MaintainerOS',
    fullName: 'princejain756/MaintainerOS',
    readme: '# MaintainerOS',
    repoFiles: {},
    commits: 'feat: add scan',
    issueTitle: 'Bug',
    issueBody: 'Bug body',
    prTitle: 'PR',
    prBody: 'PR body',
    changedFiles: 'src/App.tsx',
    openIssues: 1,
    openPullRequests: 1,
    openIssueItems: [{ number: 1, title: 'Bug', updated_at: '2026-06-05T00:00:00Z' }],
    openPullItems: [{ number: 2, title: 'PR', updated_at: '2026-06-05T00:00:00Z' }],
    workflowContents: ['name: CI\npermissions:\n  contents: read\njobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4'],
    stars: 4,
    lastPushedAt: '2026-06-05T00:00:00Z',
    actions: ['Add a changelog.'],
  },
  readmeScore: score,
  repoScore: score,
  securityScore: score,
  issueTriage: {
    labels: ['bug'],
    priority: 'medium' as const,
    missingInfo: ['reproduction steps'],
    responseTemplate: 'Please share reproduction steps.',
  },
  prReview: {
    risk: 'low' as const,
    mergeReadiness: 80,
    checklist: ['Confirm tests pass.'],
    testSuggestions: ['Run test suite.'],
  },
  prSummary: 'PR "PR" is rated low risk with merge readiness 80/100.',
  releasePlan: {
    versionSuggestion: 'minor' as const,
    changelog: '## Added\n- add scan',
    checklist: ['Publish release notes.'],
  },
  staleSummary,
  workload: {
    score: 90,
    burden: 'low' as const,
    summary: 'Workload is manageable.',
    signals: [{ label: 'Issue queue is manageable', detail: '1 open issue(s) sampled.', severity: 'good' as const }],
  },
  workflowAudit: {
    score: 88,
    grade: 'B',
    summary: 'Workflows look healthy.',
    workflowsFound: 1,
    signals: [{ label: 'Explicit permissions', detail: 'Workflows declare permissions.', severity: 'good' as const }],
    recommendations: ['Workflow setup looks healthy.'],
  },
  maintainerScore: 95,
}

describe('formatMaintainerReport', () => {
  it('creates a markdown report with scores and maintainer actions', () => {
    const report = formatMaintainerReport(baseInput)

    expect(report).toContain('# MaintainerOS Report: princejain756/MaintainerOS')
    expect(report).toContain('| Maintainer Health | 95 | A |')
    expect(report).toContain('Add a changelog.')
    expect(report).toContain('## Stale Backlog')
    expect(report).toContain('## Maintainer Workload')
    expect(report).toContain('## GitHub Actions Workflow Audit')
    expect(report).toContain('### Maintainer summary')
    expect(report).toContain('## Pull Request Review')
  })

  it('creates a JSON report with structured scores and stale summary', () => {
    const report = formatMaintainerReportJson(baseInput)
    const parsed = JSON.parse(report) as {
      repository: { fullName: string }
      scores: { maintainerHealth: number }
      staleSummary: { totalStale: number }
    }

    expect(parsed.repository.fullName).toBe('princejain756/MaintainerOS')
    expect(parsed.scores.maintainerHealth).toBe(95)
    expect(parsed.staleSummary.totalStale).toBe(0)
  })
})
