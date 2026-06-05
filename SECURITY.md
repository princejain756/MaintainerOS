# Security Policy

## Supported versions

Security fixes are provided for the latest release on the `main` branch.

| Version | Supported |
| ------- | --------- |
| latest `main` | yes |
| older tags | no |

## Reporting a vulnerability

If you discover a security issue in MaintainerOS, please report it responsibly.

**Do not** open a public GitHub issue for security vulnerabilities.

Instead, email:

```text
princejain756@gmail.com
```

Include:

- A clear description of the issue
- Steps to reproduce
- Potential impact
- Suggested fix, if you have one

## What to report

Examples of valid security reports:

- Unsafe handling of repository data
- Client-side exposure of sensitive tokens
- Dependency vulnerabilities with practical exploit paths
- Unsafe script execution patterns introduced by the project

## Response expectations

- Initial acknowledgement within 7 days
- Status update after investigation begins
- Coordinated disclosure when a fix is available

## Scope notes

MaintainerOS scans public GitHub repositories through the public GitHub API. It does not store repository credentials in the current version. If you find a way to exfiltrate private data or abuse scanning behavior, please report it.
