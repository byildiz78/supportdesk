import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/database';

export type ChatBot = {
    AutoID: number;
    ChatBotID: string;
    ChatbotQuery: string;
    ChatbotQueryParams: string;
    ChatbotRole: ChatBotRole;
    ChatbotContent: string;
    AnalysisTitle: string;
    Icon: string;
    FunctionName?: string;
}
export type ChatBotRole = 'system' | 'user' | 'assistant' | 'function'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const query = `SELECT "ChatBotID", "AnalysisTitle", "Icon" FROM dm_chatbot`;
        const result = await db.executeQuery<ChatBot[]>({
            query,
            params: [],
            req
        });
        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error in web report list handler:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}


