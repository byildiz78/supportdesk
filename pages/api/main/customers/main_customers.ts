import { NextApiRequest, NextApiResponse } from 'next';
import { Customer } from './type';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const tenantId = extractTenantId(req.headers.referer);
        const query = `
            SELECT * FROM [${tenantId}].bonus_customerfiles WITH (NOLOCK) WHERE CustomerIsActive = 1
        `;
        const instance = Dataset.getInstance();

        const result = await instance.executeQuery<Customer[]>({
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
