import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
// ✅ use ?worker instead of ?url
// @ts-ignore
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';

// Set worker for pdf.js (Vite will bundle the worker correctly)
pdfjsLib.GlobalWorkerOptions.workerPort = new pdfjsWorker();

export interface ExtractedDetails {
  name: string | null;
  email: string | null;
  phone: string | null;
}

const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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

export const parseResume = async (
  file: File
): Promise<{ text: string; details: ExtractedDetails }> => {
  let text = '';
  if (file.type === 'application/pdf') {
    text = await extractTextFromPdf(file);
  } else if (
    file.type ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    text = await extractTextFromDocx(file);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  const details = extractDetailsFromText(text);
  return { text, details };
};

const extractDetailsFromText = (text: string): ExtractedDetails => {
  const emailRegex =
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex =
    /(\+\d{1,3}[- ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}/;
  const nameRegex1 = /^([A-Z][a-z]+)\s+([A-Z][a-z'’-]+)/;
  const nameRegex2 = /([A-Z][A-Z\s]+)\n/;

  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);
  const nameMatch = text.match(nameRegex1) || text.match(nameRegex2);

  let name: string | null = null;
  if (nameMatch) {
    name = nameMatch[0].trim();
  } else {
    const lines = text.split('\n').slice(0, 5);
    for (const line of lines) {
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
