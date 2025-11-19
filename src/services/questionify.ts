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
    const prompt = `You must abide by the rules listed under the ===IMPORATANT=== heading.
    Using the text following the ===INPUT=== heading below generate ${questions} multiple choice questions in valid JSON in this exact format with no other text:
{
    "questions": [
        {
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct": 0
        }
    ]    
}
===IMPORTANT===
The "correct" field should change with each response. It should always be random which option is the correct option. If the same question is submitted multiple times,
randomize which option is the correct one. If multiple questions are requested, ensure that there is a random distribution of which options are correct.
===INPUT===
${input}`;

    const result = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 6.0
    });

    const response = result.choices[0].message.content;
    if(!response)
    {
        throw new Error('No response from deepseek');
    }

    const parsed = JSON.parse(response);
    return parsed.questions;
}