
import { A4_CONSTANTS } from './pdfConstants';

export interface ContentComponents {
  baseStyles: string;
  mainContent: string;
  footerContent: string;
}

// Extract and process content components from HTML with improved validation
export const extractAndProcessContent = (htmlContent: string): ContentComponents => {
  console.log('🔍 Starting content extraction...');
  
  if (!htmlContent || typeof htmlContent !== 'string') {
    console.warn('⚠️ Invalid HTML content provided');
    return { baseStyles: '', mainContent: '', footerContent: '' };
  }
  
  // Extract base styles with multiple patterns
  let baseStyles = '';
  const styleMatches = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  if (styleMatches) {
    baseStyles = styleMatches.map(match => 
      match.replace(/<\/?style[^>]*>/gi, '')
    ).join('\n');
  }
  
  console.log('🎨 Extracted styles length:', baseStyles.length);
  
  // Extract footer content with improved processing
  let footerContent = '';
  
  // Try multiple footer patterns
  const footerPatterns = [
    /<div[^>]*class="pdf-footer"[^>]*>([\s\S]*?)<\/div>/i,
    /<footer[^>]*>([\s\S]*?)<\/footer>/i,
    /<div[^>]*class="[^"]*footer[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];
  
  for (const pattern of footerPatterns) {
    const match = htmlContent.match(pattern);
    if (match && match[1].trim()) {
      footerContent = match[1].trim();
      console.log('👣 Found footer with pattern:', pattern.source);
      break;
    }
  }
  
  console.log('👣 Extracted footer length:', footerContent.length);
  
  // Extract main content (everything except styles and footer) with better cleanup
  let mainContent = htmlContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<\/?(!DOCTYPE|html|head|body)[^>]*>/gi, '') // Remove document structure
    .replace(/<div[^>]*class="pdf-footer"[^>]*>[\s\S]*?<\/div>/gi, '') // Remove footer divs
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // Remove footer tags
    .replace(/<div[^>]*class="[^"]*footer[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '') // Remove other footer classes
    .trim();

  // Clean up empty elements and normalize whitespace
  mainContent = mainContent
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
  
  console.log('📄 Extracted main content length:', mainContent.length);
  
  // Validation - ensure we have some content
  if (!mainContent.trim()) {
    console.warn('⚠️ No main content extracted, using sanitized original');
    mainContent = htmlContent
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .trim();
  }

  const result = { baseStyles, mainContent, footerContent };
  console.log('✅ Content extraction completed:', {
    hasStyles: !!result.baseStyles,
    hasContent: !!result.mainContent,
    hasFooter: !!result.footerContent
  });

  return result;
};

// Clean and process footer content with validation
export const processFooterContent = (footerHTML: string): string => {
  if (!footerHTML || typeof footerHTML !== 'string') {
    console.log('👣 No footer content to process');
    return '';
  }
  
  console.log('👣 Processing footer content...');
  
  // Extract inner content from footer div if it exists
  const footerDivMatch = footerHTML.match(/<div[^>]*class="pdf-footer"[^>]*>([\s\S]*?)<\/div>/i);
  if (footerDivMatch && footerDivMatch[1].trim()) {
    const processed = footerDivMatch[1].trim();
    console.log('👣 Extracted footer from div wrapper');
    return processed;
  }
  
  // Remove any existing footer wrapper tags but preserve content
  const cleaned = footerHTML
    .replace(/<\/?div[^>]*>/gi, '')
    .replace(/<\/?footer[^>]*>/gi, '')
    .trim();
  
  console.log('👣 Footer processing completed, length:', cleaned.length);
  return cleaned;
};

// Integrate footer into main content with proper structure and validation
export const integrateFooterIntoContent = (htmlContent: string, footerContent: string): string => {
  console.log('🔗 Starting footer integration...');
  
  if (!htmlContent || typeof htmlContent !== 'string') {
    console.warn('⚠️ Invalid HTML content for footer integration');
    return htmlContent || '';
  }
  
  const processedFooter = processFooterContent(footerContent);
  
  if (!processedFooter) {
    console.log('🔗 No footer to integrate');
    return htmlContent;
  }
  
  const footerHTML = `<div class="pdf-footer">${processedFooter}</div>`;
  console.log('🔗 Created footer HTML, length:', footerHTML.length);
  
  // Check if content already has a footer
  const hasExistingFooter = /<div[^>]*class="pdf-footer"[^>]*>[\s\S]*?<\/div>/i.test(htmlContent);
  
  let result;
  if (hasExistingFooter) {
    // Replace existing footer
    result = htmlContent.replace(
      /<div[^>]*class="pdf-footer"[^>]*>[\s\S]*?<\/div>/gi,
      footerHTML
    );
    console.log('🔗 Replaced existing footer');
  } else {
    // Add footer before closing body tag or at the end
    if (htmlContent.includes('</body>')) {
      result = htmlContent.replace('</body>', `${footerHTML}\n</body>`);
      console.log('🔗 Added footer before </body>');
    } else {
      result = htmlContent + '\n' + footerHTML;
      console.log('🔗 Appended footer to end');
    }
  }
  
  console.log('✅ Footer integration completed');
  return result;
};

// Measure content height using improved temporary iframe approach with better error handling
export const measureContentHeight = async (components: ContentComponents): Promise<number> => {
  return new Promise((resolve) => {
    console.log('📏 Starting content height measurement...');
    
    let tempIframe: HTMLIFrameElement | null = null;
    let timeoutId: NodeJS.Timeout;
    
    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (tempIframe && tempIframe.parentNode) {
        document.body.removeChild(tempIframe);
        console.log('🧹 Cleaned up measurement iframe');
      }
    };
    
    const fallbackHeight = A4_CONSTANTS.CONTENT_HEIGHT;
    
    try {
      tempIframe = document.createElement('iframe');
      tempIframe.style.cssText = `
        position: absolute !important;
        left: -9999px !important;
        top: 0 !important;
        width: ${A4_CONSTANTS.WIDTH}px !important;
        height: ${A4_CONSTANTS.HEIGHT * 3}px !important;
        border: none !important;
        visibility: hidden !important;
        pointer-events: none !important;
        z-index: -1 !important;
      `;
      
      document.body.appendChild(tempIframe);
      console.log('📏 Created measurement iframe');

      const doc = tempIframe.contentDocument || tempIframe.contentWindow?.document;
      if (!doc) {
        console.warn('⚠️ Could not access iframe document');
        cleanup();
        resolve(fallbackHeight);
        return;
      }

      // Create HTML with consistent CSS structure
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              margin: 0;
              padding: 0;
              width: ${A4_CONSTANTS.WIDTH}px;
              font-family: Arial, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: white;
            }
            .page-content {
              padding: ${A4_CONSTANTS.MARGIN_TOP}px ${A4_CONSTANTS.MARGIN_RIGHT}px ${A4_CONSTANTS.MARGIN_BOTTOM}px ${A4_CONSTANTS.MARGIN_LEFT}px;
              box-sizing: border-box;
            }
            ${components.baseStyles}
          </style>
        </head>
        <body>
          <div class="page-content">
            ${components.mainContent}
          </div>
        </body>
        </html>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Set timeout for measurement
      timeoutId = setTimeout(() => {
        console.warn('⚠️ Measurement timeout, using fallback');
        cleanup();
        resolve(fallbackHeight);
      }, 2000);

      // Wait for content to render and measure
      setTimeout(() => {
        try {
          const contentHeight = doc.body?.scrollHeight || fallbackHeight;
          console.log('📏 Measured content height:', contentHeight);
          cleanup();
          resolve(Math.max(contentHeight, fallbackHeight));
        } catch (error) {
          console.error('❌ Error measuring content height:', error);
          cleanup();
          resolve(fallbackHeight);
        }
      }, 500);

    } catch (error) {
      console.error('❌ Error in content height measurement setup:', error);
      cleanup();
      resolve(fallbackHeight);
    }
  });
};
