let iconMap = {};

export async function initIcons() {
  try {
    const response = await fetch(new URL('./icons/style1/icons.json', import.meta.url));
    if (!response.ok) throw new Error(`Failed to load icons.json: HTTP ${response.status}`);
    iconMap = await response.json();
  } catch (err) {
    console.error('Failed to load icons.json:', err);
  }
}

export function getFileIcon(fileName) {
  const fallback = iconMap.ui?.newFile || '▱';
  if (!fileName || !fileName.includes('.')) return fallback;
  const ext = fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase();
  const aliases = { js: 'javascript', jsx: 'javascript', mjs: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', txt: 'plaintext', md: 'markdown' };
  return (
    iconMap.extensions?.[`.${ext}`] ||
    iconMap.languages?.[aliases[ext] || ext] ||
    fallback
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

export function getUiIcon(iconName) {
  return iconMap.ui?.[iconName] || '';
}
