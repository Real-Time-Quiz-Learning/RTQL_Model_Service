import OpenAI from 'openai';
import dotenv from 'dotenv';
import { VisionClient } from './vision-client';

dotenv.config();

const key = process.env.OPENAI_API_KEY;
const client = new OpenAI({
    apiKey: key,
    baseURL: 'https://api.deepseek.com'
});

const visionClient = new VisionClient();

export interface MCQuestion {
    question: string;
    options: string[];
    correct: number;
}

export async function generateQuestions(
    input: string,
    questions: number
): Promise<MCQuestion[]> {
    const prompt = `You will generate ${questions} questions based on the input below the ===INPUT=== heading below. The response of the questions should be in the 
    format of the json below, but the json is just a template. The format is important, but the content should change. You should never return a question that is
    "What is the primary purpose of ______", this question is prohibited, NEVER make this one of the questions. Interpret the input to determine
    questions for the "question" field and provide 1 correct option and 3 incorrect options. Which option is correct should be random. If there is a 
    single question requested, the correct field should be 0, 1, 2, or 3. Not just 0. If there are multiple questions requested, the correct field should
    be random for EACH question. So we should expect if 4 questions are requested that one will have "correct": 1, another "correct": 2, etc. This is very
    important as the application is useless if all the answers are always 0. 
{
    "questions": [
        {
            "question": "Question text?",
            "options": ["A", "B", "C", "D"],
            "correct": 0
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

export async function generateQuestionsFromImage(
    imageBuffer: Buffer,
    questions: number
): Promise<MCQuestion[]> {
    const visionResult = await visionClient.extractImage(imageBuffer);

    if (!visionResult.text || visionResult.text.trim().length < 20) {
        throw new Error('nothing meaningful to extract');
    }

    console.log(`extracted ${visionResult.text.length} chars in ${visionResult.processingTimeMs}ms`);

    return generateQuestions(visionResult.text, questions);
}