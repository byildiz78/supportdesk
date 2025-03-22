/**
 * Utility functions for text processing and character encoding
 */

import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

/**
 * Decodes HTML entities and fixes character encoding issues
 * @param html HTML string to decode
 * @returns Decoded HTML string
 */
export const decodeHtml = (html: string): string => {
  if (!html) return '';
  
  // Create a textarea element to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html;
  return textarea.value;
};

/**
 * Normalizes newlines in text content
 * Replaces multiple consecutive newlines with a single one
 * and converts \r\n to proper HTML breaks
 * @param content Text content to normalize
 * @returns Normalized content
 */
export const normalizeNewlines = (content: string): string => {
  if (!content) return '';
  
  // First, replace all literal '\r\n' strings (not actual newlines)
  let normalized = content.replace(/\\r\\n/g, '\n');
  
  // Then replace all actual \r\n with \n for consistency
  normalized = normalized.replace(/\r\n/g, '\n');
  
  // Replace multiple consecutive newlines with a single one
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  
  // Replace remaining \n with <br> for HTML display
  normalized = normalized.replace(/\n/g, '<br>');
  
  // Remove any remaining \r characters
  normalized = normalized.replace(/\r/g, '');
  
  // Remove any literal '\r' or '\n' strings that might remain
  normalized = normalized.replace(/\\r/g, '');
  normalized = normalized.replace(/\\n/g, '<br>');
  
  return normalized;
};

/**
 * Processes HTML content for proper display
 * Handles character encoding issues and parses HTML
 * @param content HTML content to process
 * @returns Processed content ready for display
 */
export const processHtmlContent = (content: string) => {
  if (!content) return '';
  
  try {
    // First decode HTML entities
    const decodedContent = decodeHtml(content);
    
    // Then normalize newlines
    const normalizedContent = normalizeNewlines(decodedContent);
    
    // Sanitize the content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(normalizedContent, {
      ADD_ATTR: ['target', 'rel'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
      ALLOWED_TAGS: [
        'a', 'b', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3', 
        'h4', 'h5', 'h6', 'i', 'img', 'li', 'ol', 'p', 'pre', 
        'span', 'strong', 'table', 'tbody', 'td', 'th', 'thead', 
        'tr', 'u', 'ul'
      ]
    });
    
    // Then parse as HTML
    return parse(sanitizedContent);
  } catch (error) {
    console.error('Error processing HTML content:', error);
    
    // Fallback to basic sanitized text if parsing fails
    const decodedContent = decodeHtml(content);
    const normalizedContent = normalizeNewlines(decodedContent);
    return DOMPurify.sanitize(normalizedContent);
  }
};

/**
 * Sanitizes text input to prevent XSS attacks
 * @param text Text to sanitize
 * @returns Sanitized text
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
