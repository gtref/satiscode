# Using Satiscode

This guide covers the main features in the Satiscode Windows desktop editor. For development setup, see [README.md](README.md) and [CONTRIBUTING.md](CONTRIBUTING.md).

## Install and start

Download the latest Windows installer from the [Satiscode releases page](https://github.com/gtref/satiscode/releases/latest), run it, and launch Satiscode from the Start menu or desktop shortcut.

Satiscode runs on Windows 10 or newer. Python must be installed for Python language services to work. Node.js is only needed if you are running Satiscode from a source checkout.

## Open and edit files

- Select **Open** or press `Ctrl+O` to open a file.
- Select **Open Folder** or press `Ctrl+K` to open a workspace folder. Use the Explorer sidebar to browse and open files in that folder.
- Select **New** or press `Ctrl+N` to create an untitled tab. Use **Save** (`Ctrl+S`) to save it for the first time, or **Save As** (`Ctrl+Shift+S`) to choose a new path for an existing file.
- Switch between open files using the tabs. The **+** button creates another tab. Close a tab with its close button or middle-click it. If a tab has unsaved changes, Satiscode asks whether to save or discard them before closing.

The editor marks unsaved changes in the tab. Save your work before exiting or closing a tab.

## Language support

Satiscode normally selects the editor language from the file extension. Use the language selector in the toolbar to override it for the active file, or choose **Auto** to return to automatic selection.

| Files | Language support |
| --- | --- |
| C/C++: `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, `.hxx` | clangd diagnostics, completion, hover information, and go-to-definition |
| Python: `.py` | Pyright diagnostics, completion, hover information, and go-to-definition |
| JSON: `.json` | FIXSON diagnostics, completion, and hover information |
| JSONC: `.jsonc` | Monaco editor support; strict FIXSON validation is not started |
| XML: `.xml`, `.xsd`, `.xsl`, `.xslt`, `.svg`, `.plist` | FIXML diagnostics, element completion, and hover information |
| JavaScript/TypeScript, HTML, CSS/SCSS | Monaco syntax editing support |
| Markdown: `.md`, `.markdown` | Preview and edit modes |
| Other files | Plain-text editing |

Language services report diagnostics in the **Problems** panel. Press `Ctrl+.` to show or hide it; select a problem to jump to its location. The C/C++, Python, JSON, and XML language servers provide the services listed above. If a language server is unavailable, Satiscode can still open and edit the file, but that server's diagnostics and code intelligence will not be available.

For Markdown files, use **Preview** and **Edit** above the document to switch between the rendered preview and source text. Preview updates from the open document's current contents.

## Search and navigation

Press `Ctrl+F` or select **Find** to search within the active file. Use the previous and next controls to move between matches. For supported language servers, hover over symbols for details, request completion while typing, or use go-to-definition to navigate to a declaration.

## Git

Open a folder first, then select **Source Control** in the activity bar to view its Git status and recent commits. Git must be installed and available on your system.

- Select **Refresh** to reload repository status.
- Select **Stage all** to stage all changes in the workspace.
- Enter a commit message and select **Commit** to commit the staged changes.
- Select **Pull** or **Push** to synchronize with the configured remote. Your Git remote and authentication must already be set up.
- If the folder is not yet a repository, select **Init repository** to initialize one.

To see line-by-line history for a saved file, open it and select **Blame**. The file must be inside the currently open Git workspace.

## Appearance and interface language

Choose **Dark Theme**, **Light Theme**, or **High Contrast** from the theme selector. Use the language button in the toolbar to switch the interface between English and Spanish. These preferences are saved.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` | Create a new tab |
| `Ctrl+O` | Open a file |
| `Ctrl+K` | Open a folder |
| `Ctrl+S` | Save the active file |
| `Ctrl+Shift+S` | Save the active file as a new file |
| `Ctrl+F` | Find in the active file |
| `Ctrl+.` | Toggle the Problems panel |

## Troubleshooting

- **A language server is unavailable:** Check the language status in the toolbar. Python language services require Python to be installed. A clean source checkout may not include the clangd or Pyright server files; see the development notes in [README.md](README.md).
- **Git actions fail:** Confirm Git is installed and available on your system. For Push and Pull, check that the repository has a remote and that your Git credentials are configured.
- **A file has no diagnostics:** Confirm the correct language is selected and that the relevant language server is available. JSONC files use Monaco support without FIXSON diagnostics.
