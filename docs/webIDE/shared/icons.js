let iconMap = {};

function getBaseIconPath() {
  if (typeof window !== 'undefined' && window.location?.pathname?.includes('webIDE')) {
    return 'shared/icons/explorer_file_icons';
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
    const isWeb = typeof window !== 'undefined' && window.location?.pathname?.includes('webIDE');
    const path = isWeb ? './shared/icons/style1/icons.json' : 'icons/style1/icons.json';
    const response = await fetch(path);
    iconMap = await response.json();
  } catch (err) {
    console.error('Failed to load icons.json:', err);
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
