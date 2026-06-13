import { describe, expect, it } from 'vitest'
import { mapInventoryToRepoFiles, parseGithubUrl } from './githubClient'

describe('githubClient', () => {
  it('parses full GitHub URLs and owner/repo shorthand', () => {
    expect(parseGithubUrl('https://github.com/princejain756/MaintainerOS')).toEqual({
      owner: 'princejain756',
      repo: 'MaintainerOS',
    })
    expect(parseGithubUrl('princejain756/maintaineros')).toEqual({
      owner: 'princejain756',
      repo: 'maintaineros',
    })
  })

  it('maps repository inventory into maintainer file checks', () => {
    const files = mapInventoryToRepoFiles(
      ['README.md', 'LICENSE', 'package.json', 'package-lock.json'],
      ['CONTRIBUTING.md', 'PULL_REQUEST_TEMPLATE.md', 'ISSUE_TEMPLATE'],
      ['ci.yml', 'codeql-analysis.yml'],
      '# MaintainerOS',
      '{"name":"maintaineros"}',
    )

    expect(files.license).toBe(true)
    expect(files.contributing).toBe(true)
    expect(files.issueTemplates).toBe(true)
    expect(files.pullRequestTemplate).toBe(true)
    expect(files.ciWorkflow).toBe(true)
    expect(files.securityWorkflow).toBe(true)
    expect(files.lockfile).toBe(true)
    expect(files.codeOfConduct).toBe(false)
  })

  it('rejects invalid repository URLs', () => {
    expect(parseGithubUrl('not-a-repo-url')).toBeNull()
  })
})
