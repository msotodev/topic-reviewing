import { GoogleGenAI } from '@google/genai';
import { QuizQuestion } from '../types';

const getGenAI = () => {
  const apiKey = localStorage.getItem('google-genai-api-key') || '';
  return new GoogleGenAI({ apiKey });
};

export async function generateQuizFromLesson(
  lessonTitle: string,
  lessonContent: string
): Promise<QuizQuestion[]> {
  const genai = getGenAI();

  const prompt = `Eres un profesor experto. Genera 5 preguntas de opción múltiple basadas en el siguiente contenido de la lección.

Título de la lección: ${lessonTitle}

Contenido de la lección:
${lessonContent}

Genera las preguntas en formato JSON exactamente así:
[
  {
    "question": "Pregunta aquí",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctAnswer": 0,
    "explicación": "Explicación de la respuesta correcta"
  }
]

Solo devuelve el JSON, sin texto adicional.`;

  try {
    const response = await genai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta de la IA');
    }

    const questions = JSON.parse(jsonMatch[0]) as QuizQuestion[];
    return questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: (q as unknown as Record<string, string>)['explicación'] || (q as unknown as Record<string, string>)['explanation'] || '',
    }));
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
}

export function setApiKey(key: string): void {
  localStorage.setItem('google-genai-api-key', key);
}

export function getApiKey(): string {
  return localStorage.getItem('google-genai-api-key') || '';
}
