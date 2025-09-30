import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source for pdf.js to the local, bundled version
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ExtractedDetails {
  name: string | null;
  email: string | null;
  phone: string | null;
}

const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ');
  }
  return text;
};

const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
};

export const parseResume = async (file: File): Promise<{ text: string; details: ExtractedDetails }> => {
  let text = '';
  if (file.type === 'application/pdf') {
    text = await extractTextFromPdf(file);
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    text = await extractTextFromDocx(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  const details = extractDetailsFromText(text);
  return { text, details };
};

const extractDetailsFromText = (text: string): ExtractedDetails => {
    // More robust regex patterns
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/;
    
    // Attempt to find a name - this is heuristic
    const nameRegex1 = /^([A-Z][a-z]+)\s+([A-Z][a-z'’-]+)/; // "John Doe" at the start
    const nameRegex2 = /([A-Z][A-Z\s]+)\n/ // "JOHN DOE" followed by a newline
    
    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const nameMatch = text.match(nameRegex1) || text.match(nameRegex2);

    // Simple name extraction: assumes the first two words might be the name if they are capitalized.
    // This is a weak heuristic and can be improved with more sophisticated NLP or AI.
    let name: string | null = null;
    if (nameMatch) {
        name = nameMatch[0].trim();
    } else {
        // Fallback: look for a line with 2-3 capitalized words near the top
        const lines = text.split('\n').slice(0, 5);
        for(const line of lines) {
            const trimmedLine = line.trim();
            if (/^([A-Z][a-z]+(?:\s|-)?){2,3}$/.test(trimmedLine)) {
                name = trimmedLine;
                break;
            }
        }
    }

    return {
        name: name,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
    };
};
