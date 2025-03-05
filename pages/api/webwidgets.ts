import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { WebWidget } from '@/types/tables';
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
                AutoID,
                ReportName,
                ReportID,
                ReportIndex,
                ReportIcon,
                V1Type,
                V2Type,
                V3Type,
                V4Type,
                V5Type,
                V6Type,
                IsActive,
                ReportColor 
            FROM om_webWidgets
            WHERE IsActive = 1 
            AND ReportID NOT IN (522) 
            AND BranchDetail = '0'
            ORDER BY ReportIndex ASC
        `;
        const instance = Dataset.getInstance();

        try {
            const result = await instance.executeQuery<WebWidget[]>({
                query,
                req
            });
            return res.status(200).json(result);
        } catch (error) {
            console.warn('Database query failed, using mock data');
            return res.status(200).json(mockData.widgets);
        }
    } catch (error) {
        console.warn('Using mock data due to error:', error);
        return res.status(200).json(mockData.widgets);
    }
}