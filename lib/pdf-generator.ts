/* eslint-disable @typescript-eslint/no-explicit-any */
// Lazy load pdfMake to avoid SSR issues
let pdfMakeInstance: any = null;

async function getPdfMake() {
  if (pdfMakeInstance) {
    return pdfMakeInstance;
  }
  
  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');
  
  // Access the default export properly
  pdfMakeInstance = pdfMakeModule.default || pdfMakeModule;
  const pdfFonts = pdfFontsModule.default || pdfFontsModule;
  
  // Set vfs fonts
  if (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
    pdfMakeInstance.vfs = pdfFonts.pdfMake.vfs;
  } else if (pdfFonts.vfs) {
    pdfMakeInstance.vfs = pdfFonts.vfs;
  }
  
  return pdfMakeInstance;
}

interface DocumentSection {
  title?: string;
  content: string;
  style?: string;
}

interface LegalDocumentData {
  title: string;
  sections: DocumentSection[];
  metadata?: {
    date?: string;
    parties?: string[];
    caseNumber?: string;
    jurisdiction?: string;
  };
}

/**
 * Parse markdown content from AI model into structured sections
 */
export function parseMarkdownToSections(markdownContent: string): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const lines = markdownContent.split('\n');
  let currentSection: DocumentSection | null = null;

  for (const line of lines) {
    // Check for headers (# ## ###)
    const headerMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headerMatch) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }
      // Start new section
      currentSection = {
        title: headerMatch[2].trim(),
        content: '',
      };
    } else if (currentSection) {
      // Add content to current section
      currentSection.content += line + '\n';
    } else if (line.trim()) {
      // Content without header
      if (!currentSection) {
        currentSection = { content: '' };
      }
      currentSection.content += line + '\n';
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Convert markdown formatting to pdfmake content
 */
function parseMarkdownText(text: string): any[] {
  const content: any[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim());

  for (const para of paragraphs) {
    const trimmed = para.trim();
    
    // Handle bullet lists
    if (trimmed.match(/^[•\-\*]\s+/m)) {
      const items = trimmed
        .split('\n')
        .filter(line => line.match(/^[•\-\*]\s+/))
        .map(line => line.replace(/^[•\-\*]\s+/, '').trim());
      
      content.push({
        ul: items,
        margin: [0, 5, 0, 10],
      });
      continue;
    }

    // Handle numbered lists
    if (trimmed.match(/^\d+\.\s+/m)) {
      const items = trimmed
        .split('\n')
        .filter(line => line.match(/^\d+\.\s+/))
        .map(line => line.replace(/^\d+\.\s+/, '').trim());
      
      content.push({
        ol: items,
        margin: [0, 5, 0, 10],
      });
      continue;
    }

    // Handle bold text (**text** or __text__)
    let processedText: any = trimmed;
    const boldMatches = trimmed.match(/(\*\*|__)(.*?)\1/g);
    if (boldMatches) {
      const textParts: any[] = [];
      let lastIndex = 0;
      
      trimmed.replace(/(\*\*|__)(.*?)\1/g, (match, _, boldText, offset) => {
        if (offset > lastIndex) {
          textParts.push({ text: trimmed.substring(lastIndex, offset) });
        }
        textParts.push({ text: boldText, bold: true });
        lastIndex = offset + match.length;
        return match;
      });
      
      if (lastIndex < trimmed.length) {
        textParts.push({ text: trimmed.substring(lastIndex) });
      }
      
      processedText = textParts.length > 0 ? textParts : trimmed;
    }

    content.push({
      text: processedText,
      margin: [0, 0, 0, 10],
      alignment: 'justify',
    });
  }

  return content;
}

/**
 * Generate PDF from legal document data
 */
export async function generateLegalDocumentPDF(
  documentData: LegalDocumentData,
  filename: string = 'legal-document.pdf'
): Promise<void> {
  const pdfMake = await getPdfMake();
  const docDefinition: any = {
    pageSize: 'LETTER',
    pageMargins: [72, 72, 72, 72], // 1 inch margins
    
    content: [
      // Title
      {
        text: documentData.title,
        style: 'documentTitle',
        margin: [0, 0, 0, 20],
      },

      // Metadata section
      ...(documentData.metadata ? [
        {
          columns: [
            ...(documentData.metadata.date ? [{
              text: `Date: ${documentData.metadata.date}`,
              style: 'metadata',
            }] : []),
            ...(documentData.metadata.caseNumber ? [{
              text: `Case No: ${documentData.metadata.caseNumber}`,
              style: 'metadata',
              alignment: 'right',
            }] : []),
          ],
          margin: [0, 0, 0, 10],
        },
        ...(documentData.metadata.jurisdiction ? [{
          text: `Jurisdiction: ${documentData.metadata.jurisdiction}`,
          style: 'metadata',
          margin: [0, 0, 0, 10],
        }] : []),
        ...(documentData.metadata.parties && documentData.metadata.parties.length > 0 ? [{
          text: 'Parties:',
          style: 'sectionSubtitle',
          margin: [0, 10, 0, 5],
        }, {
          ul: documentData.metadata.parties,
          margin: [0, 0, 0, 15],
        }] : []),
        { text: '', margin: [0, 0, 0, 10] },
      ] : []),

      // Document sections
      ...documentData.sections.flatMap(section => {
        const sectionContent: any[] = [];
        
        if (section.title) {
          sectionContent.push({
            text: section.title,
            style: 'sectionTitle',
            margin: [0, 15, 0, 10],
          });
        }
        
        const parsedContent = parseMarkdownText(section.content);
        sectionContent.push(...parsedContent);
        
        return sectionContent;
      }),

      // Footer disclaimer
      {
        text: '\n\nThis document was generated by Digital Lawyer AI Assistant. Please review carefully and consult with a qualified attorney before use.',
        style: 'disclaimer',
        margin: [0, 30, 0, 0],
      },
    ],

    styles: {
      documentTitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        decoration: 'underline',
      },
      sectionSubtitle: {
        fontSize: 11,
        bold: true,
      },
      metadata: {
        fontSize: 10,
        italics: true,
      },
      disclaimer: {
        fontSize: 9,
        italics: true,
        color: '#666666',
        alignment: 'center',
      },
    },

    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.3,
    },
  };

  pdfMake.createPdf(docDefinition).download(filename);
}

/**
 * Generate PDF from raw AI model response (markdown)
 */
export async function generatePDFFromMarkdown(
  title: string,
  markdownContent: string,
  filename: string = 'legal-document.pdf'
): Promise<void> {
  const sections = parseMarkdownToSections(markdownContent);
  
  const documentData: LegalDocumentData = {
    title,
    sections,
    metadata: {
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
  };

  await generateLegalDocumentPDF(documentData, filename);
}

/**
 * Open PDF in new tab instead of downloading
 */
export async function openPDFInNewTab(
  title: string,
  markdownContent: string
): Promise<void> {
  const pdfMake = await getPdfMake();
  const sections = parseMarkdownToSections(markdownContent);
  
  const documentData: LegalDocumentData = {
    title,
    sections,
    metadata: {
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    },
  };

  const docDefinition: any = {
    pageSize: 'LETTER',
    pageMargins: [72, 72, 72, 72],
    content: [
      {
        text: documentData.title,
        style: 'documentTitle',
        margin: [0, 0, 0, 20],
      },
      ...(documentData.metadata ? [
        {
          text: `Date: ${documentData.metadata.date}`,
          style: 'metadata',
          margin: [0, 0, 0, 20],
        },
      ] : []),
      ...documentData.sections.flatMap(section => {
        const sectionContent: any[] = [];
        if (section.title) {
          sectionContent.push({
            text: section.title,
            style: 'sectionTitle',
            margin: [0, 15, 0, 10],
          });
        }
        const parsedContent = parseMarkdownText(section.content);
        sectionContent.push(...parsedContent);
        return sectionContent;
      }),
      {
        text: '\n\nThis document was generated by Digital Lawyer AI Assistant. Please review carefully and consult with a qualified attorney before use.',
        style: 'disclaimer',
        margin: [0, 30, 0, 0],
      },
    ],
    styles: {
      documentTitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
      },
      sectionTitle: {
        fontSize: 14,
        bold: true,
        decoration: 'underline',
      },
      metadata: {
        fontSize: 10,
        italics: true,
      },
      disclaimer: {
        fontSize: 9,
        italics: true,
        color: '#666666',
        alignment: 'center',
      },
    },
    defaultStyle: {
      fontSize: 11,
      lineHeight: 1.3,
    },
  };

  pdfMake.createPdf(docDefinition).open();
}
