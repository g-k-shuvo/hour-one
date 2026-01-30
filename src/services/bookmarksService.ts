export interface Bookmark {
  id: string;
  title: string;
  url?: string;
  favicon?: string;
  isFolder: boolean;
  children?: Bookmark[];
}

/**
 * Check if we're in a Chrome extension environment (can request bookmarks permission)
 */
export function isBookmarksApiAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.permissions;
}

/**
 * Check if Chrome Bookmarks API is ready to use (permission granted)
 */
export function isBookmarksApiReady(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.bookmarks;
}

/**
 * Request bookmarks permission if not already granted
 */
export async function requestBookmarksPermission(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.permissions) {
    return false;
  }

  try {
    const granted = await chrome.permissions.request({
      permissions: ['bookmarks'],
    });
    return granted;
  } catch {
    return false;
  }
}

/**
 * Check if bookmarks permission is granted
 */
export async function hasBookmarksPermission(): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.permissions) {
    return false;
  }

  try {
    const result = await chrome.permissions.contains({
      permissions: ['bookmarks'],
    });
    return result;
  } catch {
    return false;
  }
}

/**
 * Get favicon URL for a website
 */
function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`;
  } catch {
    return '';
  }
}

/**
 * Convert Chrome bookmark tree node to our Bookmark type
 */
function convertBookmarkNode(node: chrome.bookmarks.BookmarkTreeNode): Bookmark {
  const isFolder = !node.url && !!node.children;
  return {
    id: node.id,
    title: node.title || 'Untitled',
    url: node.url,
    favicon: node.url ? getFaviconUrl(node.url) : undefined,
    isFolder,
    children: node.children?.filter(child => child.url || child.children).map(convertBookmarkNode),
  };
}

/**
 * Get bookmarks from the bookmarks bar
 */
export async function getBookmarksBar(): Promise<Bookmark[]> {
  if (!isBookmarksApiReady()) {
    return [];
  }

  try {
    // Get the bookmarks tree
    const tree = await chrome.bookmarks.getTree();

    // The bookmark bar is typically the first child of the root
    // In Chrome: root > [Bookmarks Bar, Other Bookmarks, Mobile Bookmarks]
    const root = tree[0];
    const bookmarksBar = root?.children?.find(
      (child) => child.id === '1' || child.title === 'Bookmarks Bar' || child.title === 'Bookmarks bar'
    );

    if (!bookmarksBar?.children) {
      return [];
    }

    // Convert and return bookmarks and folders (limit to first 10 for display)
    return bookmarksBar.children
      .filter((node) => node.url || node.children) // Include bookmarks and folders
      .slice(0, 10)
      .map(convertBookmarkNode);
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    return [];
  }
}

/**
 * Get recent bookmarks
 */
export async function getRecentBookmarks(maxResults = 10): Promise<Bookmark[]> {
  if (!isBookmarksApiReady()) {
    return [];
  }

  try {
    const recent = await chrome.bookmarks.getRecent(maxResults);
    return recent.map(convertBookmarkNode);
  } catch (error) {
    console.error('Failed to get recent bookmarks:', error);
    return [];
  }
}
