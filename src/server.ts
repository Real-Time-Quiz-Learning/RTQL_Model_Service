import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateQuestions } from './services/questionify';
import fs from 'fs';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({
        service: 'RTQL model service',
        status: 'running'
    });
});

app.post('/api/questions', async (req: Request, res:Response) => {
    try {
        const { input, questions } = req.body;

        if (!input || typeof input !== 'string') 
        {
            return res.status(400).send('input required.');
        }

        const result = await generateQuestions(input, questions);
        res.json({ questions: result });
    }
    catch (err)
    {
        console.error('error generation questions:', err);
        res.status(500).send('error generation questions')
    }
});

app.listen(PORT, () => {
    console.log(`http server on ${PORT}`);
});
