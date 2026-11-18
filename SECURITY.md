# Security Policy

We take the security of Satiscode seriously. This document outlines our supported versions, reporting procedures, and security model.

---

## Supported Versions

Only the latest release and the current `main` branch receive active security updates and patches.

| Version / Branch | Supported | Notes |
| :--- | :---: | :--- |
| `main` (latest commit) | :white_check_mark: | Primary development branch |
| Latest Release (>= 2.2.x) | :white_check_mark: | Production releases |
| < 2.0.0 | :x: | Unsupported; please upgrade to the latest release |

---

## Reporting a Vulnerability

If you discover a security vulnerability within Satiscode, please report it privately. **Do not create public GitHub issues for security vulnerabilities.**

### How to Report
- **Email:** Send details directly to `ronan.nugget@gmail.com`
- **Subject line:** `[SECURITY VULNERABILITY] - Satiscode - <Brief Description>`

### Please Include:
1. **Description:** A detailed explanation of the vulnerability and its potential impact.
2. **Reproduction Steps:** Step-by-step instructions or proof-of-concept (PoC) code to reliably reproduce the issue.
3. **Environment:** OS version, Satiscode version, and runtime dependencies.
4. **Proposed Fix / Mitigation:** If you have an idea for a resolution, please share it.

### Response Timeline
- **Initial Response:** Within 48 hours to acknowledge receipt of your report.
- **Triage & Status:** Periodic updates on assessment and progress toward a patch.
- **Coordinated Disclosure:** We kindly request that you allow maintainers reasonable time to address the vulnerability before public disclosure.

---

## Security Architecture & Boundaries

Satiscode is an Electron application that executes code-editing workflows on the user's local filesystem:

- **Context Isolation:** The renderer process operates with `contextIsolation: true` and cannot invoke raw Node.js primitives or arbitrary host processes directly.
- **Preload Bridge:** All interactions between renderer and system processes flow through explicit, audited channels in `preload.js`.
- **Untrusted Repositories:** Treat third-party repositories, build flags, and project-local configuration files (`.clangd`, language server configs) as untrusted input. Opening repositories from unverified sources may trigger language server indexing on those files.
