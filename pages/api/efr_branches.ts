import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { Efr_Branches } from '@/types/tables';
import { mockData } from '@/lib/mock-data';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const instance = Dataset.getInstance();
        const query = `
            SELECT DISTINCT b.* 
            FROM Efr_Branchs b 
            WHERE b.IsActive = 1 
            AND EXISTS (
                SELECT 1 
                FROM Efr_Users u 
                WHERE u.UserID = @userId
                AND u.IsActive = 1 
                AND (u.Category = 5 OR CHARINDEX(',' + CAST(b.BranchID AS VARCHAR) + ',', ',' + u.UserBranchs + ',') > 0)
            )
        `;

        try {
            const result = await instance.executeQuery<Efr_Branches[]>({
                query,
                parameters: {
                    userId: "1"
                },
                req
            });
            return res.status(200).json(result);
        } catch (error) {
            // If database query fails, return mock data
            console.warn('Database query failed, using mock data');
            return res.status(200).json(mockData.branches);
        }
    } catch (error: any) {
        console.warn('Using mock data due to error:', error);
        return res.status(200).json(mockData.branches);
    }
}