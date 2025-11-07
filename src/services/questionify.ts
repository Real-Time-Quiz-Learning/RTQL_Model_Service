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

IMPORTANT: 
Return ONLY the raw JSON object. Do not wrap it in markdown code blocks. Do not include backticks, "json" labels, or any other formatting.
DO NOT UNDER ANY CIRCUMSTANCE RETURN THE SAME CORRECT FIELD FOR ALL QUESTIONS. The field for the correct answer should be distibuted to all 
available options positions. 3 questions should NEVER return all answers as A. You MUST mix the answers up otherwise you have failed and the
entire world will be disappointed in you.
The questions should be about the topic from the input below, not the actual input.
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