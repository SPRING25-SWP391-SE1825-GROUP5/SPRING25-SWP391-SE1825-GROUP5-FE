/**
 * Rich text formatting utilities
 * Supports plain text, markdown, and HTML
 */

export type TextFormat = 'plain' | 'markdown' | 'html'

/**
 * Parse markdown to HTML (simple implementation)
 */
function parseMarkdown(text: string): string {
  let html = text

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')

  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')

  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Line breaks
  html = html.replace(/\n/g, '<br>')

  return html
}

/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

/**
 * Format text based on format type
 */
export function formatRichText(content: string, format: TextFormat = 'plain'): string {
  if (!content) return ''

  switch (format) {
    case 'markdown':
      return parseMarkdown(content)
    case 'html':
      return sanitizeHtml(content)
    case 'plain':
    default:
      return sanitizeHtml(content.replace(/\n/g, '<br>'))
  }
}

/**
 * Detect URLs in text and convert to links
 */
export function detectLinks(text: string): string {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

/**
 * Extract plain text from HTML
 */
export function extractPlainText(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

/**
 * Format message content with rich text support
 */
export function formatMessageContent(content: string, format: TextFormat = 'plain'): string {
  let formatted = formatRichText(content, format)

  // Auto-detect links even in plain text
  if (format === 'plain') {
    formatted = detectLinks(formatted)
  }

  return formatted
}

