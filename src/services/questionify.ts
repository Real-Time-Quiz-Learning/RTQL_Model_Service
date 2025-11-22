import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3-vl:8b';

export interface MCQuestion {
    question: string;
    options: string[];
    correct: number;
}

export async function generateQuestions(
    input: string,
    questions: number
): Promise<MCQuestion[]> {
    const startTime = Date.now();
    
    const prompt = `Generate ${questions} multiple choice questions based on the text below.

You must respond ONLY with valid JSON in this exact format:
{
    "questions": [
        {
            "question": "Question text?",
            "options": ["Option text without prefixes", "Another option", "Third option", "Fourth option"],
            "correct": 0
        }
    ]
}

CRITICAL Rules:
- Do NOT prefix options with "A)", "B)", "C)", "D)" or any letters/numbers
- Options must be plain text only
- Never ask "What is the primary purpose of ___"
- Randomize which option is correct (0, 1, 2, or 3)
- Each question should have different correct positions
- Return ONLY the JSON, no markdown, no code blocks, no explanation

===INPUT TEXT===
${input}`;

    const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false
        },
        {
            timeout: 600000
        }
    );

    const processingTime = Date.now() - startTime;
    console.log(`Generated questions from text in ${processingTime}ms using ${OLLAMA_MODEL}`);

    let cleanedResponse = response.data.response.trim();
    if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed.questions;
}

export async function generateQuestionsFromImage(
    imageBuffer: Buffer,
    questions: number
): Promise<MCQuestion[]> {
    const startTime = Date.now();
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Analyze this image and generate ${questions} multiple choice questions based on the content.

You must respond ONLY with valid JSON in this exact format:
{
    "questions": [
        {
            "question": "Question text?",
            "options": ["Option text without prefixes", "Another option", "Third option", "Fourth option"],
            "correct": 0
        }
    ]
}

CRITICAL Rules:
- Do NOT prefix options with "A)", "B)", "C)", "D)" or any letters/numbers
- Options must be plain text only
- Never ask "What is the primary purpose of ___"
- Randomize which option is correct (0, 1, 2, or 3)
- Each question should have different correct positions
- Return ONLY the JSON, no markdown, no code blocks, no explanation`;

    const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
            model: OLLAMA_MODEL,
            prompt: prompt,
            images: [base64Image],
            stream: false
        },
        {
            timeout: 600000
        }
    );

    const processingTime = Date.now() - startTime;
    console.log(`Generated questions in ${processingTime}ms using ${OLLAMA_MODEL}`);

    let cleanedResponse = response.data.response.trim();
    if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedResponse);
    return parsed.questions;
}