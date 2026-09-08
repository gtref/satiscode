# Security Policy

## Supported versions

The latest version on the default branch is the primary supported version.

## Reporting a vulnerability
Please contact maintainers with the email ronan.nugget@gmail.com

Please do not report security vulnerabilities in a public issue. Contact the project maintainer privately with:

- A description of the affected component
- Steps to reproduce the issue
- Potential impact
- A suggested mitigation, if known

Allow maintainers reasonable time to investigate before publicly disclosing the issue.

## Security boundaries

Satiscode runs local filesystem and clangd operations through Electron's main process. Treat project files and `.clangd` configuration as untrusted input when opening repositories from unknown sources.
