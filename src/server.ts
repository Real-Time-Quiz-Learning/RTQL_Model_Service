import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { generateQuestions, generateQuestionsFromImage } from './services/questionify';

dotenv.config();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '3000');

app.use(cors());
app.use(express.json());

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'RTQL model service',
        status: 'running'
    });
});

app.post('/questions', upload.single('image'), async (req: Request, res: Response) => {
    try {
        const questions = parseInt(req.body.questions) || 4;

        if (req.file) {
            console.log(`Processing image: ${req.file.originalname}`);
            const result = await generateQuestionsFromImage(req.file.buffer, questions);
            return res.json({ questions: result });
        } 
        else if (req.body.input) {
            const { input } = req.body;
            if (typeof input !== 'string') {
                return res.status(400).send('input must be a string');
            }
            console.log('Processing text request');
            const result = await generateQuestions(input, questions);
            return res.json({ questions: result });
        } 
        else {
            return res.status(400).send('No input provided');
        }
    }
    catch (err: any) {
        console.error('error generating questions:', err);
        if (err.message?.includes('Ollama')) {
            return res.status(503).json({ error: 'Vision service unavailable' });
        }
        return res.status(500).send('error generating questions');
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`http server on ${PORT}`);
});
