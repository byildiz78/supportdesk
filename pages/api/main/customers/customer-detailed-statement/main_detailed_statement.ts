import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';
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
        ROUND(b.TotalBonusRemaing*-1, 2) AS balance,
        b.BonusStartupValue as bonusstartupvalue
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
        t.OrderKey AS orderKey,
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
        NULL AS orderKey,
        b.BonusStartupValue AS actualValue
    FROM
        [${tenantId}].bonus_customerfiles AS b
    WHERE
        b.CustomerKey = @CustomerKey
        AND b.BonusStartupValue > 0
),
OrderTransactionDetails AS (
    SELECT
        ot.OrderKey,
        (
            SELECT
                ot2.MenuItemText AS menuItemText,
                ot2.MenuItemUnitPrice AS menuItemUnitPrice,
                ot2.Quantity AS quantity,
                ot2.ExtendedPrice AS extendedPrice,
                ROUND(ISNULL(ot2.DiscountLineAmount, 0) + ISNULL(ot2.DiscountCashAmount, 0), 2) AS discountAmount,
                -- Net tutar olarak Quantity * MenuItemUnitPrice - İndirimler
                ROUND((ot2.Quantity * ot2.MenuItemUnitPrice), 2) AS netAmount
            FROM
                [${tenantId}].bonus_ordertransactions ot2
            WHERE
                ot2.OrderKey = ot.OrderKey
            FOR JSON PATH
        ) AS orderDetails
    FROM
        [${tenantId}].bonus_ordertransactions ot
    INNER JOIN
        TransactionList tl ON ot.OrderKey = tl.orderKey
    GROUP BY
        ot.OrderKey
)
-- Ana sorgu
SELECT 
    (SELECT * FROM CustomerInfo FOR JSON PATH, WITHOUT_ARRAY_WRAPPER) AS customer,
    (
        SELECT 
            tl.date,
            tl.description,
            tl.amount,
            tl.type,
            tl.checkNo,
            ISNULL(otd.orderDetails, '[]') AS orderDetails
        FROM 
            TransactionList tl
        LEFT JOIN
            OrderTransactionDetails otd ON tl.orderKey = otd.OrderKey
        ORDER BY 
            CASE WHEN tl.description = 'AÇILIŞ BAKİYESİ' THEN 0 ELSE 1 END, -- AÇILIŞ BAKİYESİ'ni en üstte göster
            tl.date DESC
        FOR JSON PATH
    ) AS transactions,
    (SELECT CONVERT(VARCHAR(20), ISNULL(SUM(actualValue), 0)) FROM TransactionList) AS periodBalance
FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        `;
        const instance = Dataset.getInstance();
        const result = await instance.executeQuery<StatementData[]>({
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
