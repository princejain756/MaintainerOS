import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import { scanGithubRepository } from './githubClient'
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

const defaultRepoUrl = 'https://github.com/princejain756/MaintainerOS'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [repoUrl, setRepoUrl] = useState(defaultRepoUrl)
  const [scannedRepo, setScannedRepo] = useState('princejain756/MaintainerOS')
  const [readme, setReadme] = useState('')
  const [repoFiles, setRepoFiles] = useState<RepoFiles>({})
  const [issueTitle, setIssueTitle] = useState('')
  const [issueBody, setIssueBody] = useState('')
  const [prTitle, setPrTitle] = useState('')
  const [prBody, setPrBody] = useState('')
  const [changedFiles, setChangedFiles] = useState('')
  const [commits, setCommits] = useState('')
  const [actions, setActions] = useState<string[]>([])
  const [repoStats, setRepoStats] = useState({ stars: 0, openIssues: 0, openPullRequests: 0, lastPushedAt: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [scanSource, setScanSource] = useState<'idle' | 'github'>('idle')

  const analyzeRepository = useCallback(async (url: string) => {
    setLoading(true)
    setError('')

    try {
      const result = await scanGithubRepository(url)
      setScannedRepo(result.fullName)
      setReadme(result.readme)
      setRepoFiles(result.repoFiles)
      setIssueTitle(result.issueTitle)
      setIssueBody(result.issueBody)
      setPrTitle(result.prTitle)
      setPrBody(result.prBody)
      setChangedFiles(result.changedFiles)
      setCommits(result.commits)
      setActions(result.actions)
      setRepoStats({
        stars: result.stars,
        openIssues: result.openIssues,
        openPullRequests: result.openPullRequests,
        lastPushedAt: result.lastPushedAt,
      })
      setScanSource('github')
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Unable to scan this repository.')
      setScanSource('idle')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial public repository scan on page load.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async GitHub fetch on mount is intentional
    void analyzeRepository(defaultRepoUrl)
  }, [analyzeRepository])

  const readmeScore = useMemo(() => analyzeReadme(readme), [readme])
  const repoScore = useMemo(() => analyzeRepoHealth({ ...repoFiles, readme }), [repoFiles, readme])
  const securityScore = useMemo(() => analyzeSecurity(repoFiles), [repoFiles])
  const issueTriage = useMemo(() => triageIssue(issueTitle, issueBody), [issueTitle, issueBody])
  const prReview = useMemo(() => reviewPullRequest(prTitle, prBody, changedFiles), [prTitle, prBody, changedFiles])
  const releasePlan = useMemo(() => generateReleasePlan(commits), [commits])

  const maintainerScore = useMemo(() => {
    if (loading || scanSource !== 'github') return 0
    return Math.round((readmeScore.score + repoScore.score + securityScore.score + prReview.mergeReadiness) / 4)
  }, [loading, scanSource, readmeScore.score, repoScore.score, securityScore.score, prReview.mergeReadiness])

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
            Scan any public GitHub repository, then audit repo health, triage issues,
            review PR risk, generate changelogs, and prepare releases from live data.
          </p>
          <div className="repo-input">
            <input
              value={repoUrl}
              onChange={(event) => setRepoUrl(event.target.value)}
              aria-label="GitHub repository URL"
              placeholder="https://github.com/owner/repo"
            />
            <button disabled={loading} onClick={() => void analyzeRepository(repoUrl)} type="button">
              {loading ? 'Scanning…' : 'Analyze repository'}
            </button>
          </div>
          <div className="status-row">
            {scanSource === 'github' && !loading && <span className="status-pill live">Live GitHub scan</span>}
            {loading && <span className="status-pill loading">Fetching repository data…</span>}
            {error && <span className="status-pill error">{error}</span>}
          </div>
        </div>
        <div className="hero-panel">
          <span>Maintainer Health Score</span>
          <strong>{loading ? '…' : maintainerScore}</strong>
          <p>{scannedRepo}</p>
          {scanSource === 'github' && !loading && (
            <div className="repo-meta">
              <span>{repoStats.stars} stars</span>
              <span>{repoStats.openIssues} open issues</span>
              <span>{repoStats.openPullRequests} open PRs</span>
            </div>
          )}
        </div>
      </section>

      <section className="score-grid">
        {cards.map((card) => (
          <article className={`metric ${card.accent}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{loading ? '…' : card.value}</strong>
            <em>Grade {loading ? '…' : card.grade}</em>
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
          <ScorePanel loading={loading} title="Repository Health" card={repoScore} />
          <ScorePanel loading={loading} title="README Quality" card={readmeScore} />
          <ScorePanel loading={loading} title="Security Readiness" card={securityScore} />
          <article className="panel">
            <span className="eyebrow">Maintainer Workload</span>
            <h2>Next best actions</h2>
            <ul className="action-list">
              {(actions.length ? actions : ['Scan a public GitHub repository to generate maintainer recommendations.']).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {activeTab === 'readme' && (
        <TwoColumn
          left={<TextArea title="README Markdown (from GitHub)" value={readme} onChange={setReadme} />}
          right={<ScorePanel loading={loading} title="README Audit" card={readmeScore} />}
        />
      )}

      {activeTab === 'repo' && (
        <TwoColumn
          left={<RepoChecklist repoFiles={repoFiles} />}
          right={<ScorePanel loading={loading} title="Repo Health Scanner" card={repoScore} />}
        />
      )}

      {activeTab === 'issues' && (
        <TwoColumn
          left={(
            <div className="panel stack">
              <Field label="Issue title (latest open issue)" value={issueTitle} onChange={setIssueTitle} />
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
              <Field label="PR title (latest open PR)" value={prTitle} onChange={setPrTitle} />
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
          left={<TextArea title="Recent commit messages (from GitHub)" value={commits} onChange={setCommits} />}
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
          left={<TextArea title="package.json (from GitHub)" value={repoFiles.packageJson ?? ''} onChange={(value) => setRepoFiles((current) => ({ ...current, packageJson: value }))} />}
          right={<ScorePanel loading={loading} title="Security Readiness" card={securityScore} />}
        />
      )}
    </main>
  )
}

function ScorePanel({ title, card, loading }: { title: string; card: ScoreCard; loading: boolean }) {
  return (
    <article className="panel">
      <span className="eyebrow">{title}</span>
      <div className="panel-score"><strong>{loading ? '…' : card.score}</strong><em>{loading ? '…' : card.grade}</em></div>
      <p>{loading ? 'Scanning repository…' : card.summary}</p>
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

function RepoChecklist({ repoFiles }: { repoFiles: RepoFiles }) {
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
      <h2>Detected maintainer infrastructure</h2>
      <div className="check-grid">
        {options.map(([key, label]) => (
          <div className={`detected-item ${repoFiles[key] ? 'present' : 'missing'}`} key={key}>
            <span>{repoFiles[key] ? '✓' : '✕'}</span>
            {label}
          </div>
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
