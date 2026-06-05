import { useMemo, useState } from 'react'
import './App.css'
import {
  analyzeReadme,
  analyzeRepoHealth,
  analyzeSecurity,
  generateReleasePlan,
  reviewPullRequest,
  triageIssue,
  type RepoFiles,
  type ScoreCard,
} from './maintainerEngines'

type Tab = 'overview' | 'readme' | 'repo' | 'issues' | 'prs' | 'release' | 'security'

const starterReadme = `# MaintainerOS

The open-source command center for healthier repositories.

MaintainerOS helps maintainers reduce repetitive work across documentation, issue triage, pull request review, release preparation, contributor onboarding, and security readiness.

## Features

- Repo health scoring
- README audits
- Issue triage suggestions
- PR review checklists
- Release notes generation

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm run dev
\`\`\`

## Contributing

Open an issue or pull request with context.

## License

MIT
`

const samplePackageJson = JSON.stringify(
  {
    scripts: { dev: 'vite', build: 'tsc -b && vite build', test: 'vitest --run' },
    dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    devDependencies: { typescript: '^6.0.0', vite: '^8.0.0', vitest: '^4.0.0' },
  },
  null,
  2,
)

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [repoUrl, setRepoUrl] = useState('https://github.com/princejain756/maintaineros')
  const [readme, setReadme] = useState(starterReadme)
  const [repoFiles, setRepoFiles] = useState<RepoFiles>({
    readme: starterReadme,
    license: true,
    contributing: true,
    codeOfConduct: false,
    securityPolicy: true,
    changelog: false,
    issueTemplates: true,
    pullRequestTemplate: true,
    ciWorkflow: true,
    packageJson: samplePackageJson,
    lockfile: true,
  })
  const [issueTitle, setIssueTitle] = useState('Bug: app crashes when repository has no README')
  const [issueBody, setIssueBody] = useState('The dashboard fails when scanning a repo without a README. I expected it to show a missing README warning. Node 22, Chrome, latest main branch.')
  const [prTitle, setPrTitle] = useState('feat: add GitHub repository scanner')
  const [prBody, setPrBody] = useState('Adds public GitHub API integration and updates repo health scoring. Includes tests for missing files and rate limit states.')
  const [changedFiles, setChangedFiles] = useState('src/githubClient.ts\nsrc/maintainerEngines.ts\nsrc/App.tsx')
  const [commits, setCommits] = useState('feat: add issue triage helper\nfeat: add repo health score\nfix: handle missing README\ndocs: update usage guide')

  const readmeScore = useMemo(() => analyzeReadme(readme), [readme])
  const repoScore = useMemo(() => analyzeRepoHealth({ ...repoFiles, readme }), [repoFiles, readme])
  const securityScore = useMemo(() => analyzeSecurity(repoFiles), [repoFiles])
  const issueTriage = useMemo(() => triageIssue(issueTitle, issueBody), [issueTitle, issueBody])
  const prReview = useMemo(() => reviewPullRequest(prTitle, prBody, changedFiles), [prTitle, prBody, changedFiles])
  const releasePlan = useMemo(() => generateReleasePlan(commits), [commits])

  const maintainerScore = Math.round((readmeScore.score + repoScore.score + securityScore.score + prReview.mergeReadiness) / 4)
  const cards = [
    { label: 'Maintainer Health', value: maintainerScore, grade: gradeLabel(maintainerScore), accent: 'blue' },
    { label: 'Docs Score', value: readmeScore.score, grade: readmeScore.grade, accent: 'green' },
    { label: 'Repo Health', value: repoScore.score, grade: repoScore.grade, accent: 'purple' },
    { label: 'Security Readiness', value: securityScore.score, grade: securityScore.grade, accent: 'orange' },
  ]

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">MaintainerOS</span>
          <h1>The open-source command center for healthier repositories.</h1>
          <p>
            Audit repo health, triage issues, review PR risk, generate changelogs,
            and prepare releases from one maintainer-focused dashboard.
          </p>
          <div className="repo-input">
            <input value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} aria-label="GitHub repository URL" />
            <button type="button">Analyze workflow</button>
          </div>
        </div>
        <div className="hero-panel">
          <span>Maintainer Health Score</span>
          <strong>{maintainerScore}</strong>
          <p>{repoUrl.replace('https://github.com/', '')}</p>
        </div>
      </section>

      <section className="score-grid">
        {cards.map((card) => (
          <article className={`metric ${card.accent}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <em>Grade {card.grade}</em>
          </article>
        ))}
      </section>

      <nav className="tabs" aria-label="MaintainerOS modules">
        {[
          ['overview', 'Overview'],
          ['readme', 'README Audit'],
          ['repo', 'Repo Health'],
          ['issues', 'Issue Triage'],
          ['prs', 'PR Review'],
          ['release', 'Release Notes'],
          ['security', 'Security'],
        ].map(([key, label]) => (
          <button className={activeTab === key ? 'active' : ''} key={key} onClick={() => setActiveTab(key as Tab)} type="button">
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="dashboard-grid">
          <ScorePanel title="Repository Health" card={repoScore} />
          <ScorePanel title="README Quality" card={readmeScore} />
          <ScorePanel title="Security Readiness" card={securityScore} />
          <article className="panel">
            <span className="eyebrow">Maintainer Workload</span>
            <h2>Next best actions</h2>
            <ul className="action-list">
              <li>Add a changelog to make release history easier to inspect.</li>
              <li>Add a code of conduct for clearer community expectations.</li>
              <li>Keep PR templates focused on risk, tests, and release notes.</li>
            </ul>
          </article>
        </section>
      )}

      {activeTab === 'readme' && (
        <TwoColumn
          left={<TextArea title="README Markdown" value={readme} onChange={setReadme} />}
          right={<ScorePanel title="README Audit" card={readmeScore} />}
        />
      )}

      {activeTab === 'repo' && (
        <TwoColumn
          left={<RepoChecklist repoFiles={repoFiles} setRepoFiles={setRepoFiles} />}
          right={<ScorePanel title="Repo Health Scanner" card={repoScore} />}
        />
      )}

      {activeTab === 'issues' && (
        <TwoColumn
          left={(
            <div className="panel stack">
              <Field label="Issue title" value={issueTitle} onChange={setIssueTitle} />
              <TextArea title="Issue body" value={issueBody} onChange={setIssueBody} small />
            </div>
          )}
          right={(
            <article className="panel">
              <span className="eyebrow">Issue Triage</span>
              <h2>Suggested routing</h2>
              <p className="priority">Priority: {issueTriage.priority}</p>
              <div className="chips">{issueTriage.labels.map((label) => <span key={label}>{label}</span>)}</div>
              <h3>Missing information</h3>
              <ul className="action-list">{issueTriage.missingInfo.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>Maintainer reply</h3>
              <p>{issueTriage.responseTemplate}</p>
            </article>
          )}
        />
      )}

      {activeTab === 'prs' && (
        <TwoColumn
          left={(
            <div className="panel stack">
              <Field label="PR title" value={prTitle} onChange={setPrTitle} />
              <TextArea title="PR description" value={prBody} onChange={setPrBody} small />
              <TextArea title="Changed files" value={changedFiles} onChange={setChangedFiles} small />
            </div>
          )}
          right={(
            <article className="panel">
              <span className="eyebrow">PR Review</span>
              <h2>Risk: {prReview.risk}</h2>
              <div className="readiness">Merge readiness <strong>{prReview.mergeReadiness}</strong></div>
              <h3>Review checklist</h3>
              <ul className="action-list">{prReview.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
              <h3>Test suggestions</h3>
              <ul className="action-list">{prReview.testSuggestions.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          )}
        />
      )}

      {activeTab === 'release' && (
        <TwoColumn
          left={<TextArea title="Commit messages" value={commits} onChange={setCommits} />}
          right={(
            <article className="panel">
              <span className="eyebrow">Release Notes</span>
              <h2>Suggested version: {releasePlan.versionSuggestion}</h2>
              <pre>{releasePlan.changelog}</pre>
              <h3>Release checklist</h3>
              <ul className="action-list">{releasePlan.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          )}
        />
      )}

      {activeTab === 'security' && (
        <TwoColumn
          left={<TextArea title="package.json" value={repoFiles.packageJson ?? ''} onChange={(value) => setRepoFiles((current) => ({ ...current, packageJson: value }))} />}
          right={<ScorePanel title="Security Readiness" card={securityScore} />}
        />
      )}
    </main>
  )
}

function ScorePanel({ title, card }: { title: string; card: ScoreCard }) {
  return (
    <article className="panel">
      <span className="eyebrow">{title}</span>
      <div className="panel-score"><strong>{card.score}</strong><em>{card.grade}</em></div>
      <p>{card.summary}</p>
      <div className="signal-list">
        {card.signals.slice(0, 6).map((signal) => (
          <div className={`signal ${signal.severity}`} key={`${signal.label}-${signal.detail}`}>
            <strong>{signal.label}</strong>
            <span>{signal.detail}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

function TwoColumn({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
  return <section className="two-column"><div>{left}</div><div>{right}</div></section>
}

function TextArea({ title, value, onChange, small = false }: { title: string; value: string; onChange: (value: string) => void; small?: boolean }) {
  return (
    <label className="panel text-panel">
      <span className="eyebrow">{title}</span>
      <textarea className={small ? 'small' : ''} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function RepoChecklist({ repoFiles, setRepoFiles }: { repoFiles: RepoFiles; setRepoFiles: React.Dispatch<React.SetStateAction<RepoFiles>> }) {
  const options: Array<[keyof RepoFiles, string]> = [
    ['license', 'License'],
    ['contributing', 'Contributing guide'],
    ['codeOfConduct', 'Code of conduct'],
    ['securityPolicy', 'Security policy'],
    ['changelog', 'Changelog'],
    ['issueTemplates', 'Issue templates'],
    ['pullRequestTemplate', 'PR template'],
    ['ciWorkflow', 'CI workflow'],
    ['lockfile', 'Lockfile'],
  ]

  return (
    <article className="panel">
      <span className="eyebrow">Repository files</span>
      <h2>Maintainer infrastructure</h2>
      <div className="check-grid">
        {options.map(([key, label]) => (
          <label key={key}>
            <input
              checked={Boolean(repoFiles[key])}
              onChange={(event) => setRepoFiles((current) => ({ ...current, [key]: event.target.checked }))}
              type="checkbox"
            />
            {label}
          </label>
        ))}
      </div>
    </article>
  )
}

function gradeLabel(score: number) {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

export default App
