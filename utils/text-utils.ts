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
 * Enhances HTML tables for better display
 * @param htmlContent HTML content containing tables
 * @returns Enhanced HTML with styled tables
 */
export const enhanceHtmlTables = (htmlContent: string): string => {
  if (!htmlContent || !htmlContent.includes('<table')) return htmlContent;
  
  try {
    // Create a DOM parser to handle the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const tables = doc.querySelectorAll('table');
    
    // If no tables found, return original content
    if (tables.length === 0) return htmlContent;
    
    // Add styles to tables
    tables.forEach(table => {
      // Add CSS classes for styling
      table.classList.add('styled-table');
      
      // Add inline styles for better compatibility
      const tableElement = table as HTMLTableElement;
      tableElement.style.borderCollapse = 'collapse';
      tableElement.style.width = '100%';
      tableElement.style.margin = '0.5rem 0';
      tableElement.style.fontSize = '0.875rem';
      tableElement.style.border = '1px solid #e2e8f0';
      
      // Style table headers and cells
      const allCells = table.querySelectorAll('th, td');
      allCells.forEach(cell => {
        const cellElement = cell as HTMLTableCellElement;
        cellElement.style.border = '1px solid #e2e8f0';
        cellElement.style.padding = '0.4rem';
        cellElement.style.textAlign = 'left';
      });
      
      // Style table headers
      const headers = table.querySelectorAll('th');
      headers.forEach(header => {
        const headerElement = header as HTMLTableCellElement;
        headerElement.style.backgroundColor = '#f8fafc';
        headerElement.style.fontWeight = 'bold';
        headerElement.style.color = '#334155';
      });
      
      // Style table rows for better readability
      const rows = table.querySelectorAll('tr');
      rows.forEach((row, index) => {
        if (index > 0 && index % 2 === 1) { // Alternate row styling (skip header)
          const rowElement = row as HTMLTableRowElement;
          rowElement.style.backgroundColor = '#f8fafc';
        }
      });
      
      // Create a container for the table
      const container = document.createElement('div');
      container.className = 'table-container';
      container.style.overflowX = 'auto';
      container.style.marginBottom = '0.5rem';
      
      // Replace the table with our container + enhanced table
      const parent = table.parentNode;
      if (parent) {
        parent.insertBefore(container, table);
        container.appendChild(table);
      }
    });
    
    // Return the modified HTML
    return doc.body.innerHTML;
  } catch (error) {
    console.error('Error enhancing HTML tables:', error);
    return htmlContent;
  }
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
    
    // Enhance HTML tables with styling
    const enhancedContent = enhanceHtmlTables(normalizedContent);
    
    // Sanitize the content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(enhancedContent, {
      ADD_ATTR: ['target', 'rel', 'style', 'class'],
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
