import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { CustomerStatement } from './type';
const timeZone = 'Europe/Istanbul';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { date1, date2, customerKey } = req.body;

        if (!date1 || !date2) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const date1Parsed = parseISO(date1);
        const date2Parsed = parseISO(date2);
        const date1Formatted = formatInTimeZone(date1Parsed, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const date2Formatted = formatInTimeZone(date2Parsed, timeZone, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

        const tenantId = extractTenantId(req.headers.referer);
        const query = `
       WITH CustomerInfo AS (
    SELECT TOP 1
        b.CustomerName AS customerName,
        b.CardNumber AS cardNo,
        ROUND(b.TotalBonusRemaing*-1, 2) AS balance
    FROM 
        [${tenantId}].bonus_customerfiles AS b
    WHERE 
        b.CustomerKey = @CustomerKey
),
TransactionList AS (
    -- Normal işlemler
    SELECT
        CONVERT(varchar, t.OrderDateTime, 104) AS date,
        CASE
            WHEN t.CustomField2 = 'BAKİYE YÜKLEME' THEN 'Bakiye Yükleme'
            ELSE COALESCE(t.CustomField2, 'İşlem')
        END AS description,
        CONVERT(VARCHAR(20), ABS(ROUND(CASE
            WHEN t.BonusEarned <> 0 THEN t.BonusEarned
            ELSE t.BonusUsed
        END, 2))) AS amount,
        CASE
            WHEN t.BonusEarned <> 0 THEN 'credit'
            ELSE 'debt'
        END AS type,
        t.CustomField1 AS checkNo,
        -- İşlem değeri (hesaplama için)
        CASE
            WHEN t.BonusEarned <> 0 THEN ROUND(t.BonusEarned, 2)
            ELSE -ROUND(t.BonusUsed, 2)
        END AS actualValue
    FROM
        [${tenantId}].bonus_transactions AS t
    WHERE
        t.CustomerKey = @CustomerKey
        AND t.LineDeleted = 0
        AND t.OrderDateTime BETWEEN @date1 AND @date2
        AND t.CustomField2 NOT LIKE '%ORDER%'
    
    UNION ALL
    
    -- Açılış bakiyesi (eğer varsa)
    SELECT
        convert(varchar,b.AddDateTime,104) AS date,
        'AÇILIŞ BAKİYESİ' AS description,
        CONVERT(VARCHAR(20), b.BonusStartupValue) AS amount,
        'startupcredit' AS type,
        '' AS checkNo,
        b.BonusStartupValue AS actualValue
    FROM
        [${tenantId}].bonus_customerfiles AS b
    WHERE
        b.CustomerKey = @CustomerKey
        AND b.BonusStartupValue > 0
)

-- Ana sorgu
SELECT 
    (SELECT * FROM CustomerInfo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS customer,
    ISNULL((SELECT date, description, amount, type, checkNo FROM TransactionList ORDER BY date DESC FOR JSON PATH), '[]') AS transactions,
    (SELECT CONVERT(VARCHAR(20), ISNULL(SUM(actualValue), 0)) FROM TransactionList) AS periodBalance
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        `;
        const instance = Dataset.getInstance();
        const result = await instance.executeQuery<CustomerStatement[]>({
            query,
            parameters: {
                date1: date1Formatted,
                date2: date2Formatted,
                CustomerKey: customerKey
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
