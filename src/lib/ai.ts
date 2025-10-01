import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { Candidate, Question } from './types';



const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is not set in the environment variables.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

const generationConfig: GenerationConfig = {
  temperature: 0.7,
  topP: 1,
  topK: 1,
  maxOutputTokens: 4096,
  responseMimeType: "application/json",
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp", // ✅ available on v1beta
  generationConfig,
});

export const generateInterviewQuestions = async (resumeText: string): Promise<Question[]> => {
  const prompt = `
    Based on the following resume text for a full-stack developer role (React/Node.js), generate exactly 6 interview questions.
    The questions should be structured as follows:
    - 2 "Easy" questions with a 20-second timer.
    - 2 "Medium" questions with a 60-second timer.
    - 2 "Hard" questions with a 120-second timer.

    Return the output as a valid JSON array of objects. Each object in the array must have the following structure: { "id": "unique-id", "text": "The question text", "difficulty": "Easy" | "Medium" | "Hard", "duration": 60 | 120 | 150 }.

    Resume Text:
    ---
    ${resumeText.substring(0, 3000)}
    ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const questions = JSON.parse(text);

    if (!Array.isArray(questions) || questions.length !== 6 || !questions.every(q => q.id && q.text && q.difficulty && q.duration)) {
        throw new Error('AI returned data in an invalid format for questions.');
    }

    return questions;
  } catch (error) {
    console.error("Error generating questions from AI:", error);
    return getFallbackQuestions();
  }
};

export const generateFinalScoreAndSummary = async (candidate: Candidate) => {
    const interviewTranscript = candidate.questions.map((q, index) => {
        const answer = candidate.answers[index];
        const answerText = answer ? answer.text : '(No answer provided)';
        return `Question ${index + 1} (${q.difficulty}): ${q.text}\nAnswer: ${answerText}\n`;
    }).join('\n');

    const prompt = `
        As a senior technical recruiter for a Full Stack (React/Node.js) role, please evaluate the following interview.
        The candidate's resume is provided for context.
        
        Resume:
        ---
        ${candidate.resumeText.substring(0, 2000)}
        ---

        Interview Transcript:
        ---
        ${interviewTranscript}
        ---

        Based on the resume and the transcript, provide a final evaluation. Your response must be a single, valid JSON object with the following structure:
        {
          "finalScore": <a number between 0 and 100 representing the overall score>,
          "summary": "<a 2-3 sentence professional summary of the candidate's performance, strengths, and weaknesses>",
          "answerFeedback": [
            {
              "questionId": "<the id of the question>",
              "score": <a number between 0 and 10 for this specific answer>,
              "feedback": "<one sentence of constructive feedback for the answer>"
            }
          ]
        }

        Ensure the 'answerFeedback' array has an entry for every question in the transcript.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        let text = response.text();

        // Clean the response to ensure it's valid JSON
        if (text.startsWith('```json')) {
            text = text.substring(text.indexOf('\n') + 1, text.lastIndexOf('```')).trim();
        }
        
        const evaluation = JSON.parse(text);

        if (typeof evaluation.finalScore !== 'number' || !evaluation.summary || !Array.isArray(evaluation.answerFeedback)) {
            throw new Error('AI returned data in an invalid format for evaluation.');
        }

        return evaluation;
    } catch (error) {
        console.error("Error generating score from AI:", error);
        throw new Error("The AI failed to generate a score. Please check the console for details.");
    }
};


const getFallbackQuestions = (): Question[] => {
    return [
        { id: 'fb-1', text: 'What is the difference between `let` and `const` in JavaScript?', difficulty: 'Easy', duration: 20 },
        { id: 'fb-2', text: 'What are React hooks?', difficulty: 'Easy', duration: 20 },
        { id: 'fb-3', text: 'Explain the concept of the virtual DOM in React.', difficulty: 'Medium', duration: 60 },
        { id: 'fb-4', text: 'What is middleware in the context of Node.js and Express?', difficulty: 'Medium', duration: 60 },
        { id: 'fb-5', text: 'Describe a time you had to optimize a slow React component. What steps did you take?', difficulty: 'Hard', duration: 120 },
        { id: 'fb-6', text: 'How would you handle authentication and authorization in a full-stack MERN application?', difficulty: 'Hard', duration: 120 },
    ];
}
