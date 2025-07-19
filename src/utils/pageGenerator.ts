
import { A4_CONSTANTS } from './pdfConstants';
import { extractAndProcessContent, measureContentHeight, ContentComponents } from './contentProcessor';
import { generateSinglePageHTML, generateMultiPageHTML } from './htmlGenerator';

export interface PageContent {
  html: string;
  pageNumber: number;
  totalPages: number;
}

// Re-export types and functions for backward compatibility
export { ContentComponents };
export { extractAndProcessContent as extractContentComponents };
export { measureContentHeight };

// Generate single page HTML - updated to use new utilities
export const generateSinglePageHTML = (
  components: ContentComponents,
  pageNumber: number = 1,
  totalPages: number = 1
): string => {
  return generateSinglePageHTML(components, pageNumber, totalPages);
};

// Generate multi-page HTML - updated to use new utilities
export const generateMultiPageHTML = (
  components: ContentComponents,
  pageIndex: number,
  totalPages: number
): string => {
  return generateMultiPageHTML(components, pageIndex, totalPages);
};
