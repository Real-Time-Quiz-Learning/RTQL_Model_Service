import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const key = process.env.OPENAI_API_KEY;
const client = new OpenAI({
    apiKey: key,
    baseURL: 'https://api.deepseek.com'
});

export interface MCQuestion {
    question: string;
    options: string[];
    correct: number;
}

export async function generateQuestions(
    input: string,
    questions: number
): Promise<MCQuestion[]> {
    const prompt = `Using the text following the ===INPUT=== heading below generate ${questions} multiple choice questions in valid JSON in this exact format with no other text:
{
    "questions": [
        {
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct": 0
        }
    ]    
}

The questions should be about the topic from the input below, not the actual input. The correct answer does not have to be 0.
===INPUT===
${input}`;

    const result = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.0
    });

    const response = result.choices[0].message.content;
    if(!response)
    {
        throw new Error('No response from deepseek');
    }

    const parsed = JSON.parse(response);
    return parsed.questions;
}