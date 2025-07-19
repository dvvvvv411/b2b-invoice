
import { FooterConfig } from '@/components/pdf-templates/FooterConfiguration';

export interface FooterData {
  pageNumber: number;
  totalPages: number;
  currentDate?: string;
  placeholders?: Record<string, string>;
}

export const generateFooterHTML = (config: FooterConfig, data: FooterData): string => {
  if (!config.enabled) {
    return '';
  }

  const { pageNumber, totalPages, currentDate, placeholders = {} } = data;
  
  // Build footer content parts
  const parts: string[] = [];
  
  // Add custom text first (with placeholder replacement)
  if (config.customText) {
    let customText = config.customText;
    // Replace any placeholders in custom text
    Object.entries(placeholders).forEach(([key, value]) => {
      customText = customText.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    });
    parts.push(customText);
  }
  
  // Add page numbers
  if (config.showPageNumbers) {
    parts.push(`Seite ${pageNumber} von ${totalPages}`);
  }
  
  // Add date
  if (config.showDate && currentDate) {
    parts.push(`Erstellt am ${currentDate}`);
  }
  
  const footerContent = parts.join(' | ');
  
  return `
    <div class="pdf-footer" style="
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      padding: ${config.padding}px;
      text-align: center;
      font-size: ${config.fontSize}px;
      font-family: Arial, sans-serif;
      line-height: 1.2;
      ${config.borderTop ? `border-top: 1px solid ${config.textColor};` : ''}
      box-sizing: border-box;
      z-index: 1000;
    ">
      ${footerContent}
    </div>
  `;
};

export const generateFooterCSS = (config: FooterConfig): string => {
  if (!config.enabled) {
    return '';
  }

  const footerHeight = (config.fontSize * 1.2) + (config.padding * 2) + (config.borderTop ? 1 : 0);

  return `
    .pdf-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: ${config.backgroundColor};
      color: ${config.textColor};
      padding: ${config.padding}px;
      text-align: center;
      font-size: ${config.fontSize}px;
      font-family: Arial, sans-serif;
      line-height: 1.2;
      ${config.borderTop ? `border-top: 1px solid ${config.textColor};` : ''}
      box-sizing: border-box;
      z-index: 1000;
      height: ${footerHeight}px;
      page-break-inside: avoid;
    }
    
    .page-content {
      padding-bottom: ${footerHeight + 10}px !important;
    }
  `;
};
