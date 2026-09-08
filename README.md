# Satiscode

Satiscode is a lightweight Windows C/C++ editor built with Electron, Monaco Editor, and clangd.

## Features

- C and C++ language detection by file extension
- Web language detection for HTML, CSS/SCSS, JavaScript/JSX, TypeScript/TSX, and JSON
- clangd diagnostics, completion, hover, and go-to-definition
- VS Code-style Problems panel with clickable diagnostics
- Resizable Explorer file tree for the current directory
- New, Open, Save, Save As, and graceful Exit operations
- English and Spanish interface labels
- Keyboard shortcuts for common file operations
- Windows NSIS installer support

## Requirements

- Windows 10 or newer
- Node.js 20 or newer
- LLVM/clangd installed and available at `C:\Program Files\LLVM\bin\clangd.exe` or on `PATH`

The editor remains usable when clangd is unavailable, but C/C++ language services will be disabled.

## Development

```powershell
npm install
npm start
```

Open a `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hh`, `.hpp`, or `.hxx` file to start clangd. HTML, CSS, JavaScript, TypeScript, and JSON files use Monaco's built-in language support without clangd. For best project-wide header support, keep `.clangd`, `.git`, or `compile_commands.json` at the project root.

## Keyboard shortcuts

- `Ctrl+N`: New file
- `Ctrl+O`: Open file
- `Ctrl+S`: Save
- `Ctrl+Shift+S`: Save As

## Build the Windows installer

```powershell
npm run dist:win
```

The installer is written to `dist\Satiscode Setup 1.0.0.exe`. The installer is unsigned unless signing credentials are configured.

## Project layout

- `main.js`: Electron main process, filesystem APIs, clangd process bridge, and shutdown handling
- `preload.js`: isolated renderer IPC API
- `index.html`: Monaco editor UI, Explorer, Problems panel, and language-service client

## Security notes

The renderer uses context isolation and does not have direct Node.js access. Filesystem and process operations are exposed through the preload bridge. Do not add unrestricted filesystem or shell APIs to the renderer.

## License

Satiscode is licensed under the [MIT License](LICENSE).
