import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getSchema = async (req: Request, res: Response) => {
    try {
        const filePath = path.join(__dirname, '../../db_tables.json');
        const data = await fs.readFile(filePath, 'utf-8');
        res.json(JSON.parse(data));
    } catch (err: any) {
        console.error('Error reading schema:', err);
        res.status(500).json({ message: 'Error reading schema data' });
    }
};
