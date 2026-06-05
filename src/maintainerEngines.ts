export type Severity = 'good' | 'warning' | 'critical'

export type Signal = {
  label: string
  detail: string
  severity: Severity
}

export type ScoreCard = {
  score: number
  grade: string
  summary: string
  signals: Signal[]
}

export type RepoFiles = {
  readme?: string
  license?: boolean
  contributing?: boolean
  codeOfConduct?: boolean
  securityPolicy?: boolean
  changelog?: boolean
  issueTemplates?: boolean
  pullRequestTemplate?: boolean
  ciWorkflow?: boolean
  packageJson?: string
  lockfile?: boolean
}

export type IssueTriage = {
  labels: string[]
  priority: 'low' | 'medium' | 'high'
  missingInfo: string[]
  responseTemplate: string
}

export type PrReview = {
  risk: 'low' | 'medium' | 'high'
  mergeReadiness: number
  checklist: string[]
  testSuggestions: string[]
}

export type ReleasePlan = {
  versionSuggestion: 'patch' | 'minor' | 'major'
  changelog: string
  checklist: string[]
}

const readmeSections = [
  ['Installation', ['install', 'installation', 'setup', 'getting started']],
  ['Usage', ['usage', 'example', 'examples', 'how to use']],
  ['Features', ['features', 'what it does']],
  ['Contributing', ['contributing', 'contribute']],
  ['License', ['license']],
]

export function grade(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export function analyzeReadme(readme = ''): ScoreCard {
  const text = readme.trim()
  const lower = text.toLowerCase()
  const headings = text.match(/^#{1,6}\s+.+$/gm) ?? []
  const codeBlocks = text.match(/```[\s\S]*?```/g) ?? []
  const words = text.split(/\s+/).filter(Boolean)
  const missing = readmeSections.filter(([, terms]) => !(terms as string[]).some((term) => lower.includes(term as string)))

  const signals: Signal[] = []
  let score = 100

  if (!/^#\s+.+/m.test(text)) {
    score -= 12
    signals.push({ label: 'Missing project title', detail: 'Start with a clear H1 project name.', severity: 'critical' })
  }

  if (words.length < 80) {
    score -= 18
    signals.push({ label: 'Thin explanation', detail: 'Add a clearer problem statement, target user, and quick-start path.', severity: 'warning' })
  } else {
    signals.push({ label: 'Useful README depth', detail: 'The README has enough substance to guide new users.', severity: 'good' })
  }

  if (headings.length < 4) {
    score -= 12
    signals.push({ label: 'Weak structure', detail: 'Use more headings so maintainers and contributors can scan quickly.', severity: 'warning' })
  }

  if (codeBlocks.length === 0) {
    score -= 12
    signals.push({ label: 'No copy-paste example', detail: 'Add install and usage commands in fenced code blocks.', severity: 'warning' })
  }

  if (missing.length > 0) {
    score -= missing.length * 6
    signals.push({
      label: 'Missing README sections',
      detail: `Add ${missing.map(([name]) => name).join(', ')} to answer common contributor questions.`,
      severity: missing.length > 2 ? 'critical' : 'warning',
    })
  }

  score = clamp(score)
  return {
    score,
    grade: grade(score),
    summary: score >= 80 ? 'README is contributor-friendly with small polish opportunities.' : 'README needs clearer setup, structure, and contributor guidance.',
    signals,
  }
}

export function analyzeRepoHealth(files: RepoFiles): ScoreCard {
  const checks: Array<[boolean, string, string, number]> = [
    [Boolean(files.readme), 'README present', 'Repository has a README entry point.', 16],
    [Boolean(files.license), 'License present', 'License makes usage rights clear.', 12],
    [Boolean(files.contributing), 'Contributing guide present', 'Contributors know how to help without guessing.', 12],
    [Boolean(files.codeOfConduct), 'Code of conduct present', 'Community expectations are documented.', 8],
    [Boolean(files.securityPolicy), 'Security policy present', 'Vulnerability disclosure path exists.', 12],
    [Boolean(files.changelog), 'Changelog present', 'Release history is easy to inspect.', 8],
    [Boolean(files.issueTemplates), 'Issue templates present', 'Maintainers receive better bug reports.', 10],
    [Boolean(files.pullRequestTemplate), 'PR template present', 'Reviewers get consistent context.', 8],
    [Boolean(files.ciWorkflow), 'CI workflow present', 'Quality gates run automatically.', 10],
    [Boolean(files.lockfile), 'Lockfile present', 'Dependency versions are reproducible.', 6],
  ]

  const score = clamp(checks.reduce((total, [passed, , , points]) => total + (passed ? points : 0), 0))
  const signals = checks.map<Signal>(([passed, label, detail]) => ({
    label,
    detail: passed ? detail : `Missing: ${detail}`,
    severity: passed ? 'good' : label.includes('Security') || label.includes('License') ? 'critical' : 'warning',
  }))

  return {
    score,
    grade: grade(score),
    summary: score >= 80 ? 'Repository is healthy and ready for contributors.' : 'Repository needs stronger maintainer infrastructure.',
    signals,
  }
}

export function analyzeSecurity(files: RepoFiles): ScoreCard {
  const packageJson = parsePackageJson(files.packageJson)
  const scripts = packageJson?.scripts ?? {}
  const dependencies = Object.keys(packageJson?.dependencies ?? {})
  const devDependencies = Object.keys(packageJson?.devDependencies ?? {})
  const riskyScript = Object.values(scripts).some((script) => /curl|wget|chmod\s+777|rm\s+-rf\s+\//.test(String(script)))

  let score = 100
  const signals: Signal[] = []

  if (!files.securityPolicy) {
    score -= 24
    signals.push({ label: 'No security policy', detail: 'Add SECURITY.md so reporters know how to disclose vulnerabilities.', severity: 'critical' })
  } else signals.push({ label: 'Security policy exists', detail: 'Disclosure process is documented.', severity: 'good' })

  if (!files.lockfile) {
    score -= 16
    signals.push({ label: 'No lockfile', detail: 'Add a lockfile for reproducible dependency installs.', severity: 'warning' })
  }

  if (riskyScript) {
    score -= 24
    signals.push({ label: 'Risky package script', detail: 'Review scripts for destructive shell commands.', severity: 'critical' })
  }

  if (dependencies.length + devDependencies.length > 45) {
    score -= 10
    signals.push({ label: 'Large dependency surface', detail: 'Review dependency count and remove packages that are not essential.', severity: 'warning' })
  }

  signals.push({ label: 'Dependency footprint', detail: `${dependencies.length} runtime and ${devDependencies.length} development dependencies detected.`, severity: 'good' })
  score = clamp(score)

  return {
    score,
    grade: grade(score),
    summary: score >= 80 ? 'Security posture looks reasonable for an early open-source project.' : 'Security readiness needs attention before broad adoption.',
    signals,
  }
}

export function triageIssue(title: string, body: string): IssueTriage {
  const text = `${title}\n${body}`.toLowerCase()
  const labels = new Set<string>()
  const missingInfo: string[] = []

  if (/crash|error|bug|broken|fail|exception/.test(text)) labels.add('bug')
  if (/feature|request|enhancement|idea/.test(text)) labels.add('enhancement')
  if (/doc|readme|guide|tutorial/.test(text)) labels.add('documentation')
  if (/security|vulnerability|xss|token|secret/.test(text)) labels.add('security')
  if (!labels.size) labels.add('needs-triage')

  if (!/steps|reproduce|reproduction|minimal/.test(text)) missingInfo.push('reproduction steps')
  if (!/version|commit|environment|browser|node|os/.test(text)) missingInfo.push('environment/version details')
  if (!/expected|actual/.test(text)) missingInfo.push('expected vs actual behavior')

  const priority = labels.has('security') || /data loss|production|blocked|cannot use/.test(text) ? 'high' : missingInfo.length > 1 ? 'medium' : 'low'

  return {
    labels: Array.from(labels),
    priority,
    missingInfo,
    responseTemplate: `Thanks for reporting this. To help maintainers investigate quickly, please share ${missingInfo.length ? missingInfo.join(', ') : 'any additional context or a minimal reproduction'} so we can confirm the issue and route it correctly.`,
  }
}

export function reviewPullRequest(title: string, description: string, changedFiles: string): PrReview {
  const text = `${title}\n${description}\n${changedFiles}`.toLowerCase()
  let riskScore = 20
  const checklist = ['Confirm the PR description explains the user-facing change.', 'Verify the change follows existing project patterns.']
  const testSuggestions = ['Run the existing test suite before merging.']

  if (/auth|payment|security|token|permission/.test(text)) {
    riskScore += 35
    checklist.push('Review auth, permission, and sensitive-data paths carefully.')
    testSuggestions.push('Add regression tests for permission and security boundaries.')
  }
  if (/breaking|migration|schema|database|api/.test(text)) {
    riskScore += 25
    checklist.push('Check whether this requires migration notes or a major version bump.')
    testSuggestions.push('Test backwards compatibility and migration behavior.')
  }
  if (!/test|spec|coverage/.test(text)) {
    riskScore += 15
    checklist.push('Ask for tests or explain why tests are not needed.')
  }
  if (/docs|readme|documentation/.test(text)) checklist.push('Confirm docs match the new behavior.')

  const risk = riskScore >= 70 ? 'high' : riskScore >= 45 ? 'medium' : 'low'
  return {
    risk,
    mergeReadiness: clamp(100 - riskScore),
    checklist,
    testSuggestions,
  }
}

export function generateReleasePlan(commits: string): ReleasePlan {
  const lines = commits.split('\n').map((line) => line.trim()).filter(Boolean)
  const buckets = { Added: [] as string[], Fixed: [] as string[], Changed: [] as string[], Security: [] as string[] }
  let versionSuggestion: ReleasePlan['versionSuggestion'] = 'patch'

  lines.forEach((line) => {
    const lower = line.toLowerCase()
    if (/breaking|major/.test(lower)) versionSuggestion = 'major'
    else if (versionSuggestion !== 'major' && /feat|feature|add/.test(lower)) versionSuggestion = 'minor'

    if (/security|vulnerability|cve/.test(lower)) buckets.Security.push(line)
    else if (/fix|bug|patch/.test(lower)) buckets.Fixed.push(line)
    else if (/feat|feature|add/.test(lower)) buckets.Added.push(line)
    else buckets.Changed.push(line)
  })

  const changelog = Object.entries(buckets)
    .filter(([, items]) => items.length)
    .map(([section, items]) => `## ${section}\n${items.map((item) => `- ${cleanCommit(item)}`).join('\n')}`)
    .join('\n\n') || '## Changed\n- Maintenance update'

  return {
    versionSuggestion,
    changelog,
    checklist: ['Confirm tests pass.', 'Update README or docs for user-facing changes.', 'Publish release notes.', 'Tag the release after verification.'],
  }
}

function cleanCommit(commit: string) {
  return commit.replace(/^[a-f0-9]{7,40}\s+/i, '').replace(/^(feat|fix|chore|docs|refactor|security)(\(.+\))?:\s*/i, '')
}

function parsePackageJson(value?: string): { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}
