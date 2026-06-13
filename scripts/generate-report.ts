#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { scanGithubRepository, setGithubToken } from '../src/githubClient.ts'
import {
  analyzeReadme,
  analyzeRepoHealth,
  analyzeSecurity,
  detectStaleItems,
  generateReleasePlan,
  reviewPullRequest,
  triageIssue,
} from '../src/maintainerEngines.ts'
import { formatMaintainerReport, formatMaintainerReportJson } from '../src/reportFormatter.ts'

const args = parseArgs(process.argv.slice(2))
const repo = args.repo ?? process.env.GITHUB_REPOSITORY
const output = args.output ?? process.env.MAINTAINEROS_OUTPUT ?? 'maintaineros-report.md'
const format = (args.format ?? process.env.MAINTAINEROS_FORMAT ?? 'markdown').toLowerCase()
const minScore = Number(args.minScore ?? process.env.MAINTAINEROS_MIN_SCORE ?? '0')
const token = args.token ?? process.env.GITHUB_TOKEN

if (!repo) {
  console.error('Missing repository. Pass --repo owner/repo or run inside GitHub Actions with GITHUB_REPOSITORY set.')
  process.exit(1)
}

if (format !== 'markdown' && format !== 'json') {
  console.error('Unsupported format. Use --format markdown or --format json.')
  process.exit(1)
}

try {
  if (token) setGithubToken(token)

  const scan = await scanGithubRepository(repo, { token })
  const readmeScore = analyzeReadme(scan.readme)
  const repoScore = analyzeRepoHealth(scan.repoFiles)
  const securityScore = analyzeSecurity(scan.repoFiles)
  const issueTriage = triageIssue(scan.issueTitle, scan.issueBody)
  const prReview = reviewPullRequest(scan.prTitle, scan.prBody, scan.changedFiles)
  const releasePlan = generateReleasePlan(scan.commits)
  const staleSummary = detectStaleItems(scan.openIssueItems, scan.openPullItems)
  const maintainerScore = Math.round((readmeScore.score + repoScore.score + securityScore.score + prReview.mergeReadiness) / 4)

  const reportInput = {
    scan,
    readmeScore,
    repoScore,
    securityScore,
    issueTriage,
    prReview,
    releasePlan,
    staleSummary,
    maintainerScore,
  }

  const report = format === 'json' ? formatMaintainerReportJson(reportInput) : formatMaintainerReport(reportInput)
  const outputPath = resolve(output)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, report, 'utf8')

  console.log(`MaintainerOS ${format} report written to ${outputPath}`)
  console.log(`Maintainer health score: ${maintainerScore}`)
  console.log(`Stale backlog: ${staleSummary.totalStale}`)

  if (maintainerScore < minScore) {
    console.error(`Maintainer health score ${maintainerScore} is below required minimum ${minScore}.`)
    process.exit(2)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'MaintainerOS report generation failed.')
  process.exit(1)
}

function parseArgs(values: string[]) {
  const parsed: Record<string, string> = {}

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (!value.startsWith('--')) continue

    const key = value.slice(2)
    const next = values[index + 1]
    if (next && !next.startsWith('--')) {
      parsed[toCamelCase(key)] = next
      index += 1
    } else {
      parsed[toCamelCase(key)] = 'true'
    }
  }

  return parsed
}

function toCamelCase(value: string) {
  return value.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}
