import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create a JSDOM window for DOMPurify to use in Node.js environment
const window = new JSDOM('').window;
const domPurify = DOMPurify(window);

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allow only safe HTML tags and attributes for article content
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Configure DOMPurify to allow specific tags for article content
  const cleanHtml = domPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 'mark',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'cite',
      'a', 'span', 'div',
      'img'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src',
      'class', 'id',
      'data-testid' // Allow test IDs for testing
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):\/\/|mailto:|tel:)/i,
    // Remove potentially dangerous attributes
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
    // Remove script tags and event handlers
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea'],
    // Keep whitespace for readability
    KEEP_CONTENT: true
  });

  return cleanHtml;
}

/**
 * Sanitize article content before saving to database
 */
export function sanitizeArticleContent(content: string): string {
  return sanitizeHtmlContent(content);
}

/**
 * Validate that HTML content is safe and properly formatted
 */
export function validateHtmlContent(html: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!html || html.trim().length === 0) {
    errors.push('Content cannot be empty');
    return { isValid: false, errors };
  }

  const sanitized = sanitizeHtmlContent(html);
  
  // Check if sanitization removed too much content (potential security issue)
  const originalTextLength = html.replace(/<[^>]*>/g, '').length;
  const sanitizedTextLength = sanitized.replace(/<[^>]*>/g, '').length;
  
  if (sanitizedTextLength < originalTextLength * 0.8) {
    errors.push('Content contains potentially unsafe HTML that was removed during sanitization');
  }

  return { 
    isValid: errors.length === 0, 
    errors 
  };
}