import type { RepoFiles } from './maintainerEngines'

export type GithubRepoRef = {
  owner: string
  repo: string
}

export type GithubScanResult = {
  owner: string
  repo: string
  fullName: string
  readme: string
  repoFiles: RepoFiles
  commits: string
  issueTitle: string
  issueBody: string
  prTitle: string
  prBody: string
  changedFiles: string
  openIssues: number
  openPullRequests: number
  openIssueItems: Array<{ number: number; title: string; updated_at: string }>
  openPullItems: Array<{ number: number; title: string; updated_at: string }>
  workflowContents: string[]
  stars: number
  lastPushedAt: string
  actions: string[]
}

export type GithubScanOptions = {
  token?: string
}

type GithubContentItem = {
  name: string
  path: string
  type: 'file' | 'dir'
  download_url?: string | null
  content?: string
  encoding?: string
}

type GithubRepoResponse = {
  full_name: string
  stargazers_count: number
  open_issues_count: number
  pushed_at: string
  private: boolean
}

type GithubIssue = {
  number: number
  title: string
  body: string | null
  updated_at: string
  pull_request?: unknown
}

type GithubPullRequest = {
  number: number
  title: string
  body: string | null
  updated_at: string
}

type GithubCommit = {
  commit: {
    message: string
  }
}

type GithubPullFile = {
  filename: string
}

const API_BASE = 'https://api.github.com'
let activeGithubToken: string | undefined

export function setGithubToken(token?: string) {
  activeGithubToken = token?.trim() || undefined
}

export function getGithubToken() {
  return activeGithubToken
}

export function parseGithubUrl(input: string): GithubRepoRef | null {
  const trimmed = input.trim().replace(/\/+$/, '')
  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
    /^github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/i,
    /^([^/\s]+)\/([^/\s]+)$/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/i, ''),
      }
    }
  }

  return null
}

export function mapInventoryToRepoFiles(
  rootNames: string[],
  githubNames: string[],
  workflowNames: string[],
  readme: string,
  packageJson?: string,
): RepoFiles {
  const all = new Set([...rootNames, ...githubNames, ...workflowNames].map((name) => name.toLowerCase()))

  const has = (patterns: string[]) => patterns.some((pattern) => [...all].some((name) => name.includes(pattern)))

  return {
    readme,
    license: has(['license']),
    contributing: has(['contributing']),
    codeOfConduct: has(['code_of_conduct', 'code-of-conduct']),
    securityPolicy: has(['security.md', 'security_policy']),
    changelog: has(['changelog', 'changes', 'history']),
    issueTemplates: has(['issue_template']),
    pullRequestTemplate: has(['pull_request_template']),
    ciWorkflow: workflowNames.some((name) => /\.ya?ml$/i.test(name)),
    securityWorkflow: workflowNames.some((name) =>
      /codeql|dependabot|dependency-review|security|audit|snyk|trivy|scorecard|osv/i.test(name),
    ),
    packageJson,
    lockfile: has(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'npm-shrinkwrap.json']),
  }
}

export async function scanGithubRepository(input: string, options: GithubScanOptions = {}): Promise<GithubScanResult> {
  const previousToken = activeGithubToken
  if (options.token) setGithubToken(options.token)

  try {
    return await scanGithubRepositoryInternal(input)
  } finally {
    setGithubToken(previousToken)
  }
}

async function scanGithubRepositoryInternal(input: string): Promise<GithubScanResult> {
  const ref = parseGithubUrl(input)
  if (!ref) {
    throw new Error('Enter a valid GitHub repository URL like https://github.com/owner/repo')
  }

  const { owner, repo } = ref
  const repoResponse = await githubFetch<GithubRepoResponse>(`/repos/${owner}/${repo}`)

  if (repoResponse.private) {
    throw new Error('This repository is private. MaintainerOS currently scans public repositories only.')
  }

  const [
    rootContents,
    githubContents,
    workflowContents,
    readmeText,
    packageJsonText,
    commits,
    issues,
    pulls,
  ] = await Promise.all([
    fetchContents(owner, repo, ''),
    fetchContents(owner, repo, '.github').catch(() => [] as GithubContentItem[]),
    fetchContents(owner, repo, '.github/workflows').catch(() => [] as GithubContentItem[]),
    fetchReadme(owner, repo),
    fetchPackageJson(owner, repo),
    fetchCommits(owner, repo),
    githubFetch<GithubIssue[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=100`),
    githubFetch<GithubPullRequest[]>(`/repos/${owner}/${repo}/pulls?state=open&per_page=100`),
  ])

  const repoFiles = mapInventoryToRepoFiles(
    rootContents.map((item) => item.name),
    githubContents.map((item) => item.name),
    workflowContents.map((item) => item.name),
    readmeText,
    packageJsonText,
  )

  const latestIssue = issues.find((issue) => !issue.pull_request)
  const latestPull = pulls[0]
  const changedFiles = latestPull ? await fetchPullFiles(owner, repo, latestPull.number) : ''
  const openIssueItems = issues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({ number: issue.number, title: issue.title, updated_at: issue.updated_at }))
  const openPullItems = pulls.map((pull) => ({
    number: pull.number,
    title: pull.title,
    updated_at: pull.updated_at,
  }))
  const workflowFileContents = await fetchWorkflowContents(owner, repo, workflowContents)

  const actions = buildActions(repoFiles, openIssueItems, openPullItems)

  return {
    owner,
    repo,
    fullName: repoResponse.full_name,
    readme: readmeText,
    repoFiles,
    commits,
    issueTitle: latestIssue?.title ?? 'No open issues found',
    issueBody: latestIssue?.body ?? 'This repository currently has no open issues to triage. MaintainerOS will analyze new issues once they are opened.',
    prTitle: latestPull?.title ?? 'No open pull requests found',
    prBody: latestPull?.body ?? 'This repository currently has no open pull requests to review.',
    changedFiles: changedFiles || 'No changed files available',
    openIssues: openIssueItems.length,
    openPullRequests: openPullItems.length,
    openIssueItems,
    openPullItems,
    workflowContents: workflowFileContents,
    stars: repoResponse.stargazers_count,
    lastPushedAt: repoResponse.pushed_at,
    actions,
  }
}

function buildActions(
  files: RepoFiles,
  openIssueItems: Array<{ number: number; title: string; updated_at: string }>,
  openPullItems: Array<{ number: number; title: string; updated_at: string }>,
) {
  const actions: string[] = []
  if (!files.changelog) actions.push('Add a changelog so release history is easier to inspect.')
  if (!files.codeOfConduct) actions.push('Add a code of conduct for clearer community expectations.')
  if (!files.contributing) actions.push('Add a contributing guide so new contributors know how to help.')
  if (!files.securityPolicy) actions.push('Add SECURITY.md so vulnerability reports have a clear path.')
  if (!files.securityWorkflow) actions.push('Add a security workflow such as CodeQL or dependency review.')
  if (!files.issueTemplates) actions.push('Add issue templates to improve bug report quality.')
  if (!files.pullRequestTemplate) actions.push('Add a pull request template for more consistent reviews.')
  if (!files.ciWorkflow) actions.push('Add CI workflows so quality checks run automatically.')
  if (!files.lockfile && files.packageJson) actions.push('Add a lockfile for reproducible dependency installs.')

  const staleThresholdDays = 30
  const now = new Date()
  const staleIssues = openIssueItems.filter((issue) => daysSince(issue.updated_at, now) >= staleThresholdDays).length
  const stalePulls = openPullItems.filter((pull) => daysSince(pull.updated_at, now) >= staleThresholdDays).length
  if (staleIssues) actions.push(`Review ${staleIssues} stale open issue(s) that have not been updated in ${staleThresholdDays}+ days.`)
  if (stalePulls) actions.push(`Review ${stalePulls} stale open pull request(s) waiting for maintainer attention.`)

  if (actions.length === 0) actions.push('Repository maintainer infrastructure looks strong. Focus on release cadence and contributor response time.')
  return actions
}

function daysSince(updatedAt: string, now: Date) {
  return Math.floor((now.getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
}

async function fetchContents(owner: string, repo: string, path: string) {
  const encodedPath = path ? `/${path}` : ''
  return githubFetch<GithubContentItem[]>(`/repos/${owner}/${repo}/contents${encodedPath}`)
}

async function fetchReadme(owner: string, repo: string) {
  try {
    const readme = await githubFetch<{ content?: string; encoding?: string }>(`/repos/${owner}/${repo}/readme`)
    return decodeGithubContent(readme.content ?? '', readme.encoding ?? 'base64')
  } catch {
    return ''
  }
}

async function fetchPackageJson(owner: string, repo: string) {
  try {
    const file = await githubFetch<{ content?: string; encoding?: string }>(`/repos/${owner}/${repo}/contents/package.json`)
    return decodeGithubContent(file.content ?? '', file.encoding ?? 'base64')
  } catch {
    return undefined
  }
}

async function fetchCommits(owner: string, repo: string) {
  const commits = await githubFetch<GithubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=20`)
  return commits.map((entry) => entry.commit.message.split('\n')[0]).join('\n')
}

async function fetchPullFiles(owner: string, repo: string, pullNumber: number) {
  try {
    const files = await githubFetch<GithubPullFile[]>(`/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=100`)
    return files.map((file) => file.filename).join('\n')
  } catch {
    return ''
  }
}

async function fetchWorkflowContents(owner: string, repo: string, items: GithubContentItem[]) {
  const workflowFiles = items.filter((item) => item.type === 'file' && /\.ya?ml$/i.test(item.name))

  const contents = await Promise.all(
    workflowFiles.map(async (file) => {
      try {
        const payload = await githubFetch<{ content?: string; encoding?: string }>(`/repos/${owner}/${repo}/contents/${file.path}`)
        return decodeGithubContent(payload.content ?? '', payload.encoding ?? 'base64')
      } catch {
        return ''
      }
    }),
  )

  return contents.filter(Boolean)
}

async function githubFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
  }

  if (activeGithubToken) {
    headers.Authorization = `Bearer ${activeGithubToken}`
  }

  const response = await fetch(`${API_BASE}${path}`, { headers })

  if (response.status === 401) {
    throw new Error('GitHub token is invalid or expired. Remove it or provide a valid personal access token.')
  }

  if (response.status === 403) {
    throw new Error(
      activeGithubToken
        ? 'GitHub API rate limit reached for this token. Wait a minute and try again.'
        : 'GitHub API rate limit reached. Wait a minute, add an optional GitHub token, or scan fewer repositories in a short period.',
    )
  }

  if (response.status === 404) {
    throw new Error('Repository not found. Check the URL and make sure the repository is public.')
  }

  if (!response.ok) {
    throw new Error(`GitHub request failed with status ${response.status}.`)
  }

  return response.json() as Promise<T>
}

function decodeGithubContent(content: string, encoding: string) {
  if (encoding !== 'base64') return content
  try {
    return atob(content.replace(/\n/g, ''))
  } catch {
    return ''
  }
}
