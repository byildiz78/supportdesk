import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';
import { BalanceCustomer } from './type';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
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
        console.log('API: Tenant ID:', tenantId);
        const query = `
        SELECT 
            c.CustomerName AS [CustomerName],
            c.PhoneNumber AS [PhoneNumber],
            c.BonusStartupValue AS [StartingBalance],
            round(c.TotalBonusUsed , 2 ) AS [Debt],
            round(c.TotalBonusEarned*-1 , 2 ) AS [Credit],
            round(c.TotalBonusRemaing*-1, 2 ) AS [Balance],
            CONVERT(VARCHAR,MAX ( T.AddDateTime ),104) AS [LastTransactionTime],
            c.CardType AS [CardType]
        FROM
            [${tenantId}].bonus_customerfiles AS c WITH (NOLOCK)
        LEFT JOIN [${tenantId}].bonus_transactions AS T WITH (NOLOCK) ON T.CustomerKey = c.CustomerKey
        WHERE 1=1
        AND c.CustomerIsActive = 1
        AND T.OrderDateTime between @date1 and @date2
        GROUP BY 
            c.CustomerName,
            c.PhoneNumber,
            c.BonusStartupValue,
            c.TotalBonusUsed,
            c.TotalBonusEarned,
            c.TotalBonusRemaing,
            c.CardType
        ORDER BY MAX(T.AddDateTime) DESC
        `;
        
        const instance = Dataset.getInstance();
        const result = await instance.executeQuery<BalanceCustomer[]>({
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
