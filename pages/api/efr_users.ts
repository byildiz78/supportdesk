import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { Efr_Users } from '@/types/tables';
import { mockData } from '@/lib/mock-data';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const query = `
            SELECT 
                UserID, 
                CONCAT(Name,' ',SurName) as UserName, 
                UserBranchs 
            FROM Efr_users 
            WHERE IsActive = 1
        `;
        const instance = Dataset.getInstance();

        try {
            const result = await instance.executeQuery<Efr_Users[]>({
                query,
                req
            });
            return res.status(200).json(result);
        } catch (error) {
            console.warn('Database query failed, using mock data');
            return res.status(200).json(mockData.users);
        }
    } catch (error: any) {
        console.warn('Using mock data due to error:', error);
        return res.status(200).json(mockData.users);
    }
}