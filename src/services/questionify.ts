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
    const prompt = `
    There will be three headings, RULES, FORMAT, INPUT. Read each section and use it for formulate your response. 
    ===RULES===
    Generate ${questions} questions based on the input below the INPUT heading blow.
    The response of the questions must be in the exact same JSON structure as the example beneath the FORMAT heading with now other formatting applied.
    It is prohibited to make a questions with the phrasing "What is the primary purpose of _____", never make a questions like this.
    The correct field should be random for each question. More often than not, we expect different questions to have different options as the correct option.
    ===FORMAT===
    {
        "questions": [
            {
                "question": "What is the answer to question one?",
                "options": ["A", "B", "C", "D"],
                "correct": 1
            },
            {
                "questions": "What is the answer to question two?",
                "options": ["A", "B", "C", "D"],
                "correct": 3         
            }
        ]    
    }
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