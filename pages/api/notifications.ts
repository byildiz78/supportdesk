import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { extractTenantFromBody, extractTenantId } from '@/lib/utils';

interface Notification {
   Debit: number;
   BranchName: number;
   CustomerName: string;
   Date: string;
   CheckNo: number;
   SaleType?: string;
}

export default async function handler(
   req: NextApiRequest,
   res: NextApiResponse
) {
   if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
   }

   try {
    const { initialTenantId } = req.body;
    
    let tenantId = initialTenantId
    tenantId = extractTenantFromBody(tenantId) || extractTenantId(req.headers.referer);

    const auditQuery = `
    SELECT TOP 10
    t.AddDateTime AS [Date],
    cf.CustomerName AS [CustomerName],
    t.CustomField1 AS [CheckNo],
    CASE 
        WHEN t.BonusUsed > 0 THEN ROUND(t.BonusUsed, 2)
        ELSE ROUND(t.BonusEarned, 2)
    END AS [Debit],
    cf.BranchID AS [BranchName],
    CASE
        WHEN t.OrderKey = '1f56b863-0363-407f-8466-b9495b8b4ff9' AND t.PaymentKey = '1f56b863-0363-407f-8466-b9495b8b4ff9' THEN
            CASE 
                WHEN t.BonusUsed > 0 THEN 'Sale'
                WHEN t.BonusEarned > 0 THEN 'Collection'
                ELSE 'Other'
            END
        WHEN EXISTS (
            SELECT 1 
            FROM [${tenantId}].bonus_orderpayments p WITH (NOLOCK) 
            WHERE p.OrderKey = t.OrderKey AND (p.IsAccountSale = 1 OR p.PaymentMethodName = 'ONLİNE CARİ')
        ) THEN 'Sale'
        WHEN EXISTS (
            SELECT 1 
            FROM [${tenantId}].bonus_orderpayments p WITH (NOLOCK) 
            WHERE p.OrderKey = t.OrderKey AND p.IsAccountPayment = 1
        ) THEN 'Collection'
        ELSE 'Other' 
    END AS SaleType
FROM
    [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
    INNER JOIN [${tenantId}].bonus_customerfiles AS cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
WHERE 1=1
    AND (
        (t.BonusUsed > 0) OR 
        (t.BonusEarned > 0)
    )
ORDER BY
    t.AddDateTime DESC;
        `;

       const instance = Dataset.getInstance();

       try {
           const response = await instance.executeQuery<Notification[]>({
                   query: auditQuery,
                   req
            });

           return res.status(200).json(response);
       } catch (error) {
           console.warn('Database query failed, using mock data');
       }
   } catch (error: any) {
       console.warn('Using mock data due to error:', error);
   }
}