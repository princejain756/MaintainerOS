import { describe, expect, it } from 'vitest'
import { formatMaintainerReport } from './reportFormatter'

const score = {
  score: 100,
  grade: 'A',
  summary: 'Strong',
  signals: [{ label: 'License present', detail: 'License makes usage rights clear.', severity: 'good' as const }],
}

describe('formatMaintainerReport', () => {
  it('creates a markdown report with scores and maintainer actions', () => {
    const report = formatMaintainerReport({
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
        stars: 4,
        lastPushedAt: '2026-06-05T00:00:00Z',
        actions: ['Add a changelog.'],
      },
      readmeScore: score,
      repoScore: score,
      securityScore: score,
      issueTriage: {
        labels: ['bug'],
        priority: 'medium',
        missingInfo: ['reproduction steps'],
        responseTemplate: 'Please share reproduction steps.',
      },
      prReview: {
        risk: 'low',
        mergeReadiness: 80,
        checklist: ['Confirm tests pass.'],
        testSuggestions: ['Run test suite.'],
      },
      releasePlan: {
        versionSuggestion: 'minor',
        changelog: '## Added\n- add scan',
        checklist: ['Publish release notes.'],
      },
      maintainerScore: 95,
    })

    expect(report).toContain('# MaintainerOS Report: princejain756/MaintainerOS')
    expect(report).toContain('| Maintainer Health | 95 | A |')
    expect(report).toContain('Add a changelog.')
    expect(report).toContain('## Pull Request Review')
  })
})
