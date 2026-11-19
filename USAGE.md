# Using Satiscode

A practical user guide for the Satiscode desktop editor on Windows. For developer setup and architecture details, refer to the [Contributing Guide](CONTRIBUTING.md) and [README](README.md).

---

## Installation & Setup

1. Download the latest installer (`.exe`) from the [Satiscode Releases page](https://github.com/gtref/satiscode/releases/latest).
2. Run the installer and launch Satiscode from your Start Menu or desktop shortcut.

> [!NOTE]
> **System Requirements:** Windows 10 or newer (64-bit).
> - **C/C++ Support:** Built-in `clangd` binaries are bundled with packaged releases.
> - **Python Support:** Requires a local Python 3.8+ installation for Pyright language services.
> - **Node.js:** Only required if building or running Satiscode directly from source.

---

## Workspace & File Operations

| Operation | Keyboard Shortcut | Toolbar Action | Description |
| :--- | :---: | :---: | :--- |
| **New File** | `Ctrl+N` | `New` | Opens an untitled document tab in the editor buffer. |
| **Open File** | `Ctrl+O` | `Open` | Opens a file picker to load an existing file. |
| **Open Folder** | `Ctrl+K` | `Open Folder` | Loads a directory workspace into the Explorer sidebar. |
| **Save File** | `Ctrl+S` | `Save` | Writes changes in the active buffer to disk. |
| **Save As** | `Ctrl+Shift+S` | `Save As` | Saves the active document under a new filename/path. |
| **Find in File** | `Ctrl+F` | `Find` | Opens the in-editor search bar with regex/match controls. |
| **Toggle Problems**| `Ctrl+.` | `Problems` | Displays compiler errors, warnings, and LSP diagnostics. |

### Tab Management
- **Multiple Tabs:** Click the **`+`** button in the tab bar or press `Ctrl+N` to open additional documents.
- **Unsaved Changes Indicator:** An indicator dot appears on tabs containing unsaved modifications.
- **Closing Tabs:** Click the `×` button or middle-click the tab. If changes are unsaved, Satiscode prompts you to save or discard before closing.

---

## Language Intelligence & LSP Support

Satiscode automatically detects file types by extension and starts the appropriate Language Server Protocol (LSP) server in the background:

| Language Family | File Extensions | Language Server / Engine | Capabilities |
| :--- | :--- | :--- | :--- |
| **C / C++** | `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, `.hxx` | `clangd` (LLVM) | Full diagnostics, autocomplete, hover tooltips, go-to-definition |
| **Python** | `.py` | `pyright` (Microsoft) | Type inference, completions, diagnostics, symbol hover |
| **JSON** | `.json` | `@ronna/fixson-lsp` | Syntax diagnostics, key completions, hover schema |
| **JSON with Comments** | `.jsonc` | Monaco Built-in | Syntax highlighting and bracket matching |
| **TOML** | `.toml` | Monarch Engine | Syntax highlighting, table headers, key-value and multiline string parsing |
| **SQL / Databases** | `.sql`, `.db`, `.sqlite`, `.sqlite3` | Monaco Built-in | Full SQL syntax styling and query keyword highlighting |
| **XML / SVG / Plist** | `.xml`, `.xsd`, `.xsl`, `.xslt`, `.svg`, `.plist` | `@ronna/fixml-lsp` | Well-formedness checks, element autocompletion, hover documentation |
| **Web Languages** | `.html`, `.css`, `.scss`, `.js`, `.jsx`, `.ts`, `.tsx` | Monaco Built-in | Full syntax highlighting, indentation rules, bracket matching |
| **Markdown** | `.md`, `.markdown` | Custom Viewer | Live preview toggle (`Preview` / `Edit`) with instant rendering |
| **Plain Text** | All other formats | Monaco Built-in | Fast raw text editing |

### Manual Language Override
If automatic detection does not match your preference, click the **Language** selector in the top toolbar to choose any supported language manually, or select **Auto** to return to extension-based detection.

### Problems Panel
Press `Ctrl+.` to toggle the **Problems** panel at the bottom of the editor. Diagnostics reported by `clangd`, `pyright`, `fixson`, and `fixml` appear in real time. Clicking any diagnostic jumps directly to the line and column in the active file.

---

## Markdown Preview

For Markdown documents (`.md`, `.markdown`):
- Click **Preview** above the editor to view the formatted HTML document.
- Click **Edit** to return to raw Markdown editing mode.
- Previews re-render dynamically as edits are made.

---

## Integrated Git Version Control

Open a project folder with `Ctrl+K`, then select **Source Control** in the activity sidebar to access Git features:

- **Status & Diffs:** View modified, staged, and untracked files in the current repository.
- **Stage All:** Click **Stage all** to stage workspace modifications.
- **Commit:** Enter a commit message into the prompt and click **Commit**.
- **Push / Pull:** Synchronize branches with your configured Git remote directly from the toolbar.
- **Initialize Repository:** Click **Init repository** if the current folder is not yet version-controlled.
- **Git Blame:** View line-by-line author and commit history for any saved file in the workspace.

---

## Themes & Localization

- **Color Themes:** Switch between **Dark Theme**, **Light Theme**, and **High Contrast** using the theme picker in the top menu.
- **Interface Language:** Toggle between English and Spanish interface labels on the fly.
- Preferences are automatically remembered across editor sessions.

---

## Troubleshooting

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| **Python diagnostics not appearing** | Python is not found in system PATH | Ensure Python 3.8+ is installed and checked in Windows environment variables. |
| **C/C++ LSP not starting in source mode** | Missing `clangd` in local source checkout | Install LLVM on your system or run a packaged release installer. |
| **Git operations fail** | Git executable not found or missing remote credentials | Ensure Git is installed (`git --version` in terminal) and remote credentials are saved via credential helper. |
| **No diagnostics for `.jsonc`** | Expected behavior | `.jsonc` files intentionally run in Monaco basic mode to allow comments without JSON grammar errors. |
