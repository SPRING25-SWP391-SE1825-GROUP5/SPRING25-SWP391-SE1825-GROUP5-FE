/**
 * Normalizes image URLs to absolute URLs
 * Converts relative URLs to absolute URLs using the API base URL
 */
export function normalizeImageUrl(url: string | undefined | null): string {
  if (!url) return ''

  // If already absolute URL (http/https/blob), return as is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url
  }

  // Get base URL from environment or use default
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'

  // Remove /api suffix if present (we'll add it back if needed)
  const cleanBaseURL = baseURL.replace(/\/api$/, '')

  // If URL starts with /, it's already a path
  if (url.startsWith('/')) {
    // Check if it's an API path or a static file path
    if (url.startsWith('/api/') || url.startsWith('/uploads/') || url.startsWith('/images/')) {
      return `${cleanBaseURL}${url}`
    }
    // For other paths, assume they're relative to base
    return `${cleanBaseURL}${url}`
  }

  // If URL doesn't start with /, check if it's a filename (has extension)
  // Common image extensions
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp']
  const hasExtension = imageExtensions.some(ext => url.toLowerCase().endsWith(ext))

  if (hasExtension) {
    // It's likely a filename, try common upload paths
    // Try /api/uploads/ first (most common in Spring Boot), then /uploads/, then /images/
    // Spring Boot typically serves static files from /api/uploads/ or /uploads/
    return `${cleanBaseURL}/api/uploads/${url}`
  }

  // If URL doesn't start with / and doesn't have extension, it's a relative path
  return `${cleanBaseURL}/${url}`
}

