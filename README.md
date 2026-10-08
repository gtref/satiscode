[![Slack](https://img.shields.io/badge/Slack-Join%20Community-4A154B?style=for-the-badge&logo=slack&logoColor=white)](https://join.slack.com/t/a2-hc61499/shared_invite/zt-49ufy94zl-nTWdH_uBjDIkuPCbapoO0A) 
[![Satiscode | AlternativeTo](https://alternativeto.net/static/badges/badge-wide-color.svg)](https://alternativeto.net/software/satiscode/about/?utm_source=badge&utm_medium=referral)

# Satiscode


## [![Repography logo](https://images.repography.com/logo.svg)](https://repography.com) / Recent activity [![Time period](https://images.repography.com/166409166/gtref/satiscode/recent-activity/WJhcF1eUCd2tNOMMgJ4MczIjznf4cP5aFriV19j3t8M/8yZyspekiq7tNPgadxNln3ZK6CBAm-4nsXQ3aPOOJOA_badge.svg)](https://repography.com)
[![Timeline graph](https://images.repography.com/166409166/gtref/satiscode/recent-activity/WJhcF1eUCd2tNOMMgJ4MczIjznf4cP5aFriV19j3t8M/8yZyspekiq7tNPgadxNln3ZK6CBAm-4nsXQ3aPOOJOA_timeline.svg)](https://github.com/gtref/satiscode/commits)
[![Issue status graph](https://images.repography.com/166409166/gtref/satiscode/recent-activity/WJhcF1eUCd2tNOMMgJ4MczIjznf4cP5aFriV19j3t8M/8yZyspekiq7tNPgadxNln3ZK6CBAm-4nsXQ3aPOOJOA_issues.svg)](https://github.com/gtref/satiscode/issues)
[![Pull request status graph](https://images.repography.com/166409166/gtref/satiscode/recent-activity/WJhcF1eUCd2tNOMMgJ4MczIjznf4cP5aFriV19j3t8M/8yZyspekiq7tNPgadxNln3ZK6CBAm-4nsXQ3aPOOJOA_prs.svg)](https://github.com/gtref/satiscode/pulls)
[![Trending topics](https://images.repography.com/166409166/gtref/satiscode/recent-activity/WJhcF1eUCd2tNOMMgJ4MczIjznf4cP5aFriV19j3t8M/8yZyspekiq7tNPgadxNln3ZK6CBAm-4nsXQ3aPOOJOA_words.svg)](https://github.com/gtref/satiscode/commits)
[![Top contributors](https://images.repography.com/166409166/gtref/satiscode/recent-activity/WJhcF1eUCd2tNOMMgJ4MczIjznf4cP5aFriV19j3t8M/8yZyspekiq7tNPgadxNln3ZK6CBAm-4nsXQ3aPOOJOA_users.svg)](https://github.com/gtref/satiscode/graphs/contributors)




Satiscode is a lightweight Windows C/C++ editor built with Electron, Monaco Editor, and clangd.

## Features

- C and C++ language detection by file extension
- Python language detection by file extention
- Web language detection for HTML, CSS/SCSS, JavaScript/JSX, TypeScript/TSX, and JSON
- clangd diagnostics, completion, hover, and go-to-definition
- PyRight diagnostics, completion, hover and go-to-definition for python
- VS Code-style Problems panel with clickable diagnostics
- Resizable Explorer file tree for the current directory
- New, Open, Save, Save As, and graceful Exit operations
- English and Spanish interface labels
- Keyboard shortcuts for common file operations
- Windows NSIS installer support

>[!TIP]
> [Join the beta](https://satiscorp.wordpress.com)

# Requirements

- Windows 10 or newer
- Node.js 20 or newer

The editor remains usable when python is unavailable, but PyRight language server will not function correctly.

>[!NOTE]
> Please NOTE That from satiscode 1.2.0 onwards LLVM does not need to be installed. All new builds will contain clangd and its librarys and later there will be instructions for local testing.

>[!NOTE]
> Please note that version 1.5.0 onwards will need python to be installed to use python linting.

## Development

```powershell
npm install
npm start
```

>[!WARNING]
> A clean source checkout runs without clangd or Pyright because their server files are absent; the editor can still open and edit supported file types. Source mode looks for clangd in `bin/` and Pyright in `PythonLSP/` at the repository root. Packaged builds include these files in the application resources and load them from there.

Opening a `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, or `.hxx` file starts clangd only when its server files are available. Opening a `.py` file starts Pyright only when its server files are available. HTML, CSS, JavaScript, TypeScript, and JSON files use Monaco's built-in language support. For best project-wide header support, keep `.clangd`, `.git`, or `compile_commands.json` at the project root.

## Keyboard shortcuts

- `Ctrl+N`: New file
- `Ctrl+O`: Open file
- `Ctrl+S`: Save
- `Ctrl+Shift+S`: Save As
- `Ctrl+f`: Find
- `Ctrl+.`: Toggle Problems pannel

## Build the Windows installer

```powershell
npm run dist:win
```

The installer is written to `dist\Satiscode Setup 1.0.0.exe`. The installer is unsigned unless signing credentials are configured.

## Project layout

- `main.js`: Electron main process, filesystem APIs, clangd process bridge, and shutdown handling
- `preload.js`: isolated renderer IPC API
- `index.html`: Monaco editor UI, Explorer, Problems panel, and language-service client
- `icons.js`: Loads the icon packs located in `icons/`
- `themes.js`: Loads theme files from the `themes/` directory

## Security notes

The renderer uses context isolation and does not have direct Node.js access. Filesystem and process operations are exposed through the preload bridge. Do not add unrestricted filesystem or shell APIs to the renderer.

## License

Satiscode is licensed under the [MIT License](LICENSE).

## Contributors

Thanks to these awesome people for helping build **satiscode**:

<div align="center">

### 🤝 Contributors

| [<img src="https://github.com/gtref.png" width="75px;" style="border-radius:50%;"/><br><sub><b>@gtref</b></sub>](https://github.com/gtref) | [<img src="https://github.com/ncs22.png" width="75px;" style="border-radius:50%;"/><br><sub><b>@ncs22</b></sub>](https://github.com/ncs22) | [<img src="https://github.com/Igcabr01.png" width="75px;" style="border-radius:50%;"/><br><sub><b>@Igcabr01</b></sub>](https://github.com/Igcabr01) | [<img src="https://github.com/apps/coderabbitai.png" width="75px;" style="border-radius:50%;"/><br><sub><b>@coderabbitai</b></sub>](https://github.com/apps/coderabbitai) | [<img src="https://github.com/apps/dependabot.png" width="75px;" style="border-radius:50%;"/><br><sub><b>@dependabot</b></sub>](https://github.com/apps/dependabot) |
| :---: | :---: | :---: | :---: | :---: |
| Project Lead | Contributor | Contributor | Code Review Bot | Security Bot |

</div>

# Copy atributions
This tool uses librarys and executables from the `clangd` util by `LLVM` and `PyRight` by `microsoft`, to see the copy atributions [please click here](NOTICES.md)

