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
    const systemPrompt = `You are a JSON API. You ONLY output valid JSON. Never use markdown formatting, code blocks, or backticks. Your response must start with { and end with }.`;   
    const prompt = `Generate ${questions} multiple choice questions based on the input text below.

CRITICAL REQUIREMENTS:
- Output ONLY raw JSON, no markdown, no code blocks, no backticks
- Use this exact structure: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct": 0}]}
- The "correct" field is the index (0-3) of the correct option
- Vary which option is correct across questions
- Avoid questions starting with "What is the primary purpose of"

INPUT TEXT:
${input}`;

    const result = await client.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.0
    });

    const response = result.choices[0].message.content;
    if(!response)
    {
        throw new Error('No response from deepseek');
    }

    let cleanedResponse = response.trim();
    if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed.questions;
}