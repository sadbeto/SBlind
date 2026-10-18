# Security Policy

## Supported status

SBlind is a development prototype. The latest commit on `main` is the only supported version. It is not approved for production use or for processing real customer information.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature under the repository Security tab. Do not open a public issue containing exploit details, credentials, personal information, or customer data.

Include:

- A concise description and affected component
- Reproduction steps that do not access third-party data
- Expected impact
- Suggested remediation, if known

Reports will be acknowledged through GitHub. Never test against systems or data you do not own or have explicit permission to assess.

## Dependency posture

Automated dependency alerts, update pull requests, CI verification, dependency review, and CodeQL scanning are enabled. Some Expo build-tool dependencies may have upstream advisories without a compatible patched release; these must be reviewed for actual runtime exposure rather than automatically treated as application vulnerabilities.
