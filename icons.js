let iconMap = {};

export async function initIcons() {
  try {
    const response = await fetch('icons/style1/icons.json');
    iconMap = await response.json();
  } catch (err) {
    console.error('Failed to load icons.json:', err);
  }
}

export function getFileIcon(fileName) {
  if (!fileName) return iconMap.ui?.newFile || '▱';
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  return (
    iconMap.extensions?.[ext] ||
    iconMap.languages?.[ext.replace('.', '')] ||
    iconMap.ui?.newFile ||
    '▱'
  );
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