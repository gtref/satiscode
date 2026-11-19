const DEFAULT_ICON_MAP = {
  theme: 'style1',
  iconDir: 'icons/explorer_file_icons',
  ui: {
    folder: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5A1.75 1.75 0 0 0 0 4.25v7.5C0 12.716.784 13.5 1.75 13.5h12.5A1.75 1.75 0 0 0 16 11.75v-6A1.75 1.75 0 0 0 14.25 4H7.828a1.75 1.75 0 0 1-1.237-.512l-.88-.88A1.75 1.75 0 0 0 4.47 2.5H1.75z"/></svg>',
    openFolder: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 2.5A1.75 1.75 0 0 0 0 4.25v.938l.822 1.096A1.75 1.75 0 0 1 2.25 7h12.35l-1.6 6H1.75A.75.75 0 0 1 1 12.25v-8c0-.414.336-.75.75-.75h2.72c.24 0 .47.085.65.24l.88.88a.25.25 0 0 0 .18.08h8.07c.414 0 .75.336.75.75v1.3H3.25a.75.75 0 0 0-.6.3L1.1 10.05v-5.8c0-.414.336-.75.75-.75z"/></svg>',
    save: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5l-4-4zm-3 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3-7H3V2h8v4z"/></svg>',
    translate: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6.5"/><path d="M1.8 6h12.4M1.8 10h12.4M8 1.5c1.7 1.8 2.5 4 2.5 6.5S9.7 12.7 8 14.5C6.3 12.7 5.5 10.5 5.5 8S6.3 3.3 8 1.5z"/></svg>',
    defaultFile: 'text.svg'
  },
  filenames: {
    dockerfile: 'docker.svg',
    '.dockerignore': 'docker.svg',
    '.gitignore': 'git.svg',
    '.gitattributes': 'git.svg',
    '.gitmodules': 'git.svg',
    license: 'license.svg',
    'license.md': 'license.svg',
    'license.txt': 'license.svg',
    'package-lock.json': 'lock.svg',
    'yarn.lock': 'lock.svg',
    'pnpm-lock.yaml': 'lock.svg',
    'cargo.lock': 'lock.svg',
    'favicon.ico': 'favicon.svg'
  },
  extensions: {
    '.c': 'c.svg',
    '.cpp': 'cpp.svg',
    '.cc': 'cpp.svg',
    '.cxx': 'cpp.svg',
    '.h': 'h-512.svg',
    '.hh': 'h-512.svg',
    '.hpp': 'h-512.svg',
    '.hxx': 'h-512.svg',
    '.cs': 'csharp.svg',
    '.css': 'css.svg',
    '.scss': 'css.svg',
    '.html': 'html.svg',
    '.htm': 'html.svg',
    '.js': 'javascript.svg',
    '.mjs': 'javascript.svg',
    '.cjs': 'javascript.svg',
    '.jsx': 'jsx_icon_132288.svg',
    '.ts': 'typescript.svg',
    '.tsx': 'tsx-alt.svg',
    '.json': 'JSON.svg',
    '.jsonc': 'JSON.svg',
    '.py': 'python.svg',
    '.pyw': 'python.svg',
    '.ipynb': 'jupyter.svg',
    '.md': 'markdown.svg',
    '.markdown': 'markdown.svg',
    '.sql': 'Sql_database_shortcut_icon.svg',
    '.sqlite': 'Sqlite.svg',
    '.sqlite3': 'Sqlite.svg',
    '.db': 'Sqlite.svg',
    '.xml': 'xml.svg',
    '.xsd': 'xml.svg',
    '.xsl': 'xml.svg',
    '.xslt': 'xml.svg',
    '.plist': 'xml.svg',
    '.svg': 'svg.svg',
    '.yaml': 'yaml.svg',
    '.yml': 'yaml.svg',
    '.sh': 'bash.svg',
    '.bash': 'bash.svg',
    '.zsh': 'bash.svg',
    '.ps1': 'powershell.svg',
    '.psm1': 'powershell.svg',
    '.go': 'go.svg',
    '.rs': 'rust.svg',
    '.java': 'java.svg',
    '.class': 'java.svg',
    '.php': 'php.svg',
    '.rb': 'ruby.svg',
    '.vue': 'vue.svg',
    '.svelte': 'svelte.svg',
    '.astro': 'astro.svg',
    '.txt': 'text.svg',
    '.ico': 'favicon.svg',
    '.toml': 'Preferences-desktop-font.svg'
  }
};

let iconMap = { ...DEFAULT_ICON_MAP };

function getBaseIconPath() {
  if (typeof window !== 'undefined') {
    const loc = (window.location?.pathname || '') + (window.location?.href || '');
    if (loc.toLowerCase().includes('webide')) {
      return 'shared/icons/explorer_file_icons';
    }
  }
  return 'icons/explorer_file_icons';
}

function renderIcon(icon) {
  if (!icon) return '▱';
  if (typeof icon === 'string' && icon.trim().startsWith('<')) {
    return icon;
  }
  const base = getBaseIconPath();
  return `<img src="${base}/${icon}" class="file-icon" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;width:16px;height:16px;" />`;
}

export async function initIcons() {
  try {
    const isWeb = typeof window !== 'undefined' && ((window.location?.pathname || '') + (window.location?.href || '')).toLowerCase().includes('webide');
    const path = isWeb ? './shared/icons/style1/icons.json' : 'icons/style1/icons.json';
    const response = await fetch(path);
    if (response.ok) {
      const custom = await response.json();
      iconMap = {
        ...DEFAULT_ICON_MAP,
        ...custom,
        ui: { ...DEFAULT_ICON_MAP.ui, ...(custom.ui || {}) },
        filenames: { ...DEFAULT_ICON_MAP.filenames, ...(custom.filenames || {}) },
        extensions: { ...DEFAULT_ICON_MAP.extensions, ...(custom.extensions || {}) },
        languages: { ...(custom.languages || {}) }
      };
    }
  } catch (err) {
    // Falls back seamlessly to DEFAULT_ICON_MAP
  }
}

export function getFileIcon(fileName) {
  if (!fileName) {
    return iconMap.ui?.defaultFile
      ? renderIcon(iconMap.ui.defaultFile)
      : (iconMap.ui?.newFile || '▱');
  }

  const lowerName = fileName.toLowerCase();
  if (iconMap.filenames?.[lowerName]) {
    return renderIcon(iconMap.filenames[lowerName]);
  }

  const extIndex = lowerName.lastIndexOf('.');
  const ext = extIndex >= 0 ? lowerName.slice(extIndex) : '';

  if (ext && iconMap.extensions?.[ext]) {
    return renderIcon(iconMap.extensions[ext]);
  }

  const bareExt = ext ? ext.slice(1) : lowerName;
  if (iconMap.languages?.[bareExt]) {
    return renderIcon(iconMap.languages[bareExt]);
  }

  if (iconMap.ui?.defaultFile) {
    return renderIcon(iconMap.ui.defaultFile);
  }

  if (iconMap.ui?.newFile) {
    return renderIcon(iconMap.ui.newFile);
  }

  return renderIcon('text.svg');
}

export function getFolderIcon(isExpanded = false) {
  if (isExpanded) {
    return iconMap.ui?.openFolder || iconMap.ui?.folder || '▰';
  }
  return iconMap.ui?.folder || '▰';
}

export function getChevronIcon(isExpanded = false) {
  if (isExpanded) {
    return iconMap.ui?.chevronDown || '⌄';
  }
  return iconMap.ui?.chevronRight || '›';
}

export function getUiIcon(iconName) {
  const icon = iconMap.ui?.[iconName];
  if (!icon) return '';
  return renderIcon(icon);
}
