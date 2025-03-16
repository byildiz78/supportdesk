import { NextApiRequest, NextApiResponse } from 'next';
import { Efr_Users } from '@/types/tables';
import { Dataset } from '@/lib/dataset';
import { Efr_Companies } from './types';

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
        id,
        companyName,
        tenantName,
        companyKey,
        isActive,
        addDate,
        editDate,
        addUser,
        editUser
        FROM dbo.bonus_poscompanies WITH (NOLOCK)
        WHERE 1=1
        AND isActive=1;
        `;
        const instance = Dataset.getInstance();

        const result = await instance.executeQuery<Efr_Companies[]>({
            query,
            req
        });

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No users found' });
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error in users handler:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
