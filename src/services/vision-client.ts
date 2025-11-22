import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface VisionResult {
    text: string;
    modelUsed: string;
    processingTimeMs: number;
}

export class VisionClient {
    private readonly ollamaUrl: string;
    private readonly model: string;

    constructor() {
        this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'qwen2-v1:8b';
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
                timeout: 5000
            });

            return response.status === 200;
        } 
        catch (error) 
        {
            console.error('Ollama health check failed:', error);
            return false;
        }
    }

    async extractImage(imageBuffer: Buffer): Promise<VisionResult> {
        const startTime = Date.now();
        const base64Image = imageBuffer.toString('base64');

        const prompt = `Extract all text, concepts, formulas, and key information from this image.`;

        try {
            const response = await axios.post(
                `${this.ollamaUrl}/api/generate`,
                {
                    model: this.model,
                    prompt: prompt,
                    images: [base64Image],
                    stream: false
                },
                {
                    timeout: 60000
                }
            );

            const processingTimeMs = Date.now() - startTime;

            return {
                text: response.data.response,
                modelUsed: this.model,
                processingTimeMs
            };
        } catch (error: any)
        {
            if (error.code === 'ECONNREFUSED')
            {
                throw new Error('ollama not running');
            }
            if (error.code === 'ETIMEDOUT')
            {
                throw new Error('image processing timed out');
            }
            throw new Error(`Vision service error: ${error.message}`);
        }
    }
}