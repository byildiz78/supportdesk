import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { Efr_Tags } from '@/types/tables';
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
        SELECT DISTINCT
            ef.TagID,
            ef.TagTitle,
            ef.IsDefault,
            ef.CurrencyName
        FROM
            efr_Tags ef WITH (NOLOCK)
        INNER JOIN 
            efr_BranchTags eb WITH (NOLOCK) ON eb.TagID = ef.TagID`;

        try {
            const result = await instance.executeQuery<Efr_Tags[]>({
                query,
                req
            });
            return res.status(200).json(result);
        } catch (error) {
            console.warn('Database query failed, using mock data');
            return res.status(200).json(mockData.tags);
        }
    } catch (error: any) {
        console.warn('Using mock data due to error:', error);
        return res.status(200).json(mockData.tags);
    }
}