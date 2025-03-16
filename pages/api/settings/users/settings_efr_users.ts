import { NextApiRequest, NextApiResponse } from 'next';
import { Efr_Users } from '@/types/tables';
import { Dataset } from '@/lib/dataset';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const query = `
        Select
            id as UserID,
            username as UserName,
            name as Name,
            surname as SurName,
            phone_number as PhoneNumber,
            email as EMail,
            [schema] as [Schema],
            type as Category,
            active as IsActive
        From dbo.bonus_users WITH (NOLOCK)
        Where 1=1
            AND active = 1;
        `;
        const instance = Dataset.getInstance();

        const result = await instance.executeQuery<Efr_Users[]>({
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
