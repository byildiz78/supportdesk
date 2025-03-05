import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { ExampleApiData } from '@/types/dummy';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const dummyDataQuery = `
                SELECT 'Emre' as name, 25 as age, 'Istanbul' as city
                    UNION ALL
                    SELECT 'Ahmet', 30, 'Ankara'
                    UNION ALL
                    SELECT 'Ayşe', 28, 'İzmir';
            `;
            const instance = Dataset.getInstance();

            const result = await instance.executeQuery<ExampleApiData[]>({
                query: dummyDataQuery,
                req
            });

            res.status(200).json(result);
        } catch (error) {
            console.error('Error fetching chart widgets:', error);
            res.status(500).json({ error: 'Failed to fetch chart widgets' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
