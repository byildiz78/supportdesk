import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { TransactionTableCustomer } from './type';
const timeZone = 'Europe/Istanbul';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { date1, date2 } = req.body;

        if (!date1 || !date2) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const date1Parsed = parseISO(date1);
        const date2Parsed = parseISO(date2);
        const date1Formatted = formatInTimeZone(date1Parsed, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const date2Formatted = formatInTimeZone(date2Parsed, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

        const tenantId = extractTenantId(req.headers.referer);
        const query = `
            SELECT
            OrderDateTime AS [Date],
            CustomerName AS [CustomerName],
            round(BonusEarned *- 1, 2) AS [Credit],
            BonusUsed AS [Debit],
            (SELECT TOP 1 TotalBonusRemaing FROM [${tenantId}].bonus_customerfiles bcf WITH (NOLOCK) WHERE bcf.CustomerKey= t.CustomerKey) AS Balance,
            CustomField1 AS [CheckNo] 
        FROM
            [${tenantId}].bonus_transactions t WITH (NOLOCK)
        WHERE
            1 = 1 
            AND t.LineDeleted= 0 
             AND t.OrderDateTime BETWEEN @date1 and @date2
            AND t.CustomField2 NOT LIKE '%ORDER%'
        `;
        
        const instance = Dataset.getInstance();
        const result = await instance.executeQuery<TransactionTableCustomer[]>({
            query,
            parameters: {
                date1: date1Formatted,
                date2: date2Formatted,
            },
            req
        });

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No balance data found' });
        }

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Error in balance handler:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
