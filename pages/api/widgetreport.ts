import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';

// Define interfaces for the query results
interface TopDebtors {
    Müşteri: string;
    Borç: number;
}

interface TotalCollection {
    'Toplam Tahsilat': string;
    'Değişim (Bu Ay)': string;
}

interface CurrentMonthCollection {
    'Bu Ay Tahsilat': string;
    'Değişim (Bu Ay)': string;
}

interface TotalSales {
    'Toplam Satış': string;
    'Değişim (Bu Ay)': string;
}

interface CurrentMonthSales {
    'Bu Ay Satış': string;
    'Değişim (Bu Ay)': string;
}

interface MonthlyStat {
    'Ay': string;
    'Tahsilat': string;
    'Satış': string;
    'Tahsilat Değişim': string;
    'Satış Değişim': string;
}

interface DashboardData {
    topDebtors: TopDebtors[];
    totalCollection: TotalCollection;
    currentMonthCollection: CurrentMonthCollection;
    totalSales: TotalSales;
    currentMonthSales: CurrentMonthSales;
    sixMonthStats: MonthlyStat[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const instance = Dataset.getInstance();
        const tenantId = extractTenantId(req.headers.referer);

        // Top debtors query
        const topDebtorsQuery = `
            SELECT 
                c.CustomerName AS [Müşteri],
                ROUND(c.TotalBonusUsed, 2) AS [Borç]
            FROM
                [${tenantId}].bonus_customerfiles AS c
                LEFT JOIN [${tenantId}].bonus_transactions T ON T.CustomerKey = c.CustomerKey 
            WHERE
                T.OrderDateTime BETWEEN DATEADD(DAY, -30, GETDATE()) AND GETDATE()
                AND T.CustomField2 NOT LIKE '%ORDER%'
                AND c.TotalBonusRemaing < 0
            GROUP BY
                c.CustomerName,
                c.TotalBonusUsed
            ORDER BY
                [Borç] DESC
        `;

        // Total collection query
        const totalCollectionQuery = `
        DECLARE @TotalCollection DECIMAL(18,2)
        DECLARE @CurrentMonthTotal DECIMAL(18,2)
        DECLARE @PreviousMonthTotal DECIMAL(18,2)
        DECLARE @CurrentMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))
        DECLARE @CurrentMonthEnd DATE = EOMONTH(GETDATE())
        DECLARE @PreviousMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -2))
        DECLARE @PreviousMonthEnd DATE = EOMONTH(GETDATE(), -1)

        SELECT @TotalCollection = ISNULL(SUM(CASE WHEN 
                p.OrderKey IS NULL OR
                ISNULL(p.IsAccountPayment, 0) = 1 OR 
                t.CustomField2 = 'BAKİYE YÜKLEME' OR 
                p.PaymentMethodName = 'ONLİNE CARİ' 
                THEN t.BonusEarned ELSE 0 END), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
            LEFT JOIN [${tenantId}].bonus_orderpayments as p WITH (NOLOCK) ON p.OrderKey = t.OrderKey
        WHERE
            t.BonusEarned <> 0 AND t.BonusEarned IS NOT NULL

        SELECT @CurrentMonthTotal = ISNULL(SUM(CASE WHEN 
            p.OrderKey IS NULL OR
            ISNULL(p.IsAccountPayment, 0) = 1 OR 
            t.CustomField2 = 'BAKİYE YÜKLEME' OR 
            p.PaymentMethodName = 'ONLİNE CARİ' 
            THEN ABS(t.BonusEarned) ELSE 0 END), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
            LEFT JOIN [${tenantId}].bonus_orderpayments as p WITH (NOLOCK) ON p.OrderKey = t.OrderKey
        WHERE
            t.OrderDateTime BETWEEN @CurrentMonthStart AND @CurrentMonthEnd
            AND t.BonusEarned <> 0 AND t.BonusEarned IS NOT NULL

        SELECT @PreviousMonthTotal = ISNULL(SUM(CASE WHEN 
            p.OrderKey IS NULL OR
            ISNULL(p.IsAccountPayment, 0) = 1 OR 
            t.CustomField2 = 'BAKİYE YÜKLEME' OR 
            p.PaymentMethodName = 'ONLİNE CARİ' 
            THEN ABS(t.BonusEarned) ELSE 0 END), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
            LEFT JOIN [${tenantId}].bonus_orderpayments as p WITH (NOLOCK) ON p.OrderKey = t.OrderKey
        WHERE
            t.OrderDateTime BETWEEN @PreviousMonthStart AND @PreviousMonthEnd
            AND t.BonusEarned <> 0 AND t.BonusEarned IS NOT NULL

        SELECT 
            FORMAT(@TotalCollection, 'C', 'tr-TR') AS 'Toplam Tahsilat',
            CASE 
                WHEN @PreviousMonthTotal = 0 THEN '∞'
                ELSE CAST(CAST(ROUND(((@CurrentMonthTotal - @PreviousMonthTotal) / @PreviousMonthTotal) * 100, 1) AS DECIMAL(10,1)) AS VARCHAR) + '%'
            END AS 'Değişim (Bu Ay)'
        `;

        // Current month collection query
        const currentMonthCollectionQuery = `
        DECLARE @CurrentMonthTotal DECIMAL(18,2)
        DECLARE @PreviousMonthTotal DECIMAL(18,2)
        DECLARE @CurrentMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))
        DECLARE @CurrentMonthEnd DATE = EOMONTH(GETDATE())
        DECLARE @PreviousMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -2))
        DECLARE @PreviousMonthEnd DATE = EOMONTH(GETDATE(), -1)

        SELECT @CurrentMonthTotal = ISNULL(SUM(CASE WHEN 
            p.OrderKey IS NULL OR
            ISNULL(p.IsAccountPayment, 0) = 1 OR 
            t.CustomField2 = 'BAKİYE YÜKLEME' OR 
            p.PaymentMethodName = 'ONLİNE CARİ' 
            THEN ABS(t.BonusEarned) ELSE 0 END), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
            LEFT JOIN [${tenantId}].bonus_orderpayments as p WITH (NOLOCK) ON p.OrderKey = t.OrderKey
        WHERE
            t.OrderDateTime BETWEEN @CurrentMonthStart AND @CurrentMonthEnd
            AND t.BonusEarned <> 0 AND t.BonusEarned IS NOT NULL

        SELECT @PreviousMonthTotal = ISNULL(SUM(CASE WHEN 
            p.OrderKey IS NULL OR
            ISNULL(p.IsAccountPayment, 0) = 1 OR 
            t.CustomField2 = 'BAKİYE YÜKLEME' OR 
            p.PaymentMethodName = 'ONLİNE CARİ' 
            THEN ABS(t.BonusEarned) ELSE 0 END), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
            LEFT JOIN [${tenantId}].bonus_orderpayments as p WITH (NOLOCK) ON p.OrderKey = t.OrderKey
        WHERE
            t.OrderDateTime BETWEEN @PreviousMonthStart AND @PreviousMonthEnd
            AND t.BonusEarned <> 0 AND t.BonusEarned IS NOT NULL

        SELECT 
            FORMAT(@CurrentMonthTotal, 'C', 'tr-TR') AS 'Bu Ay Tahsilat',
            CASE 
                WHEN @PreviousMonthTotal = 0 THEN '∞'
                ELSE CAST(CAST(ROUND(((@CurrentMonthTotal - @PreviousMonthTotal) / @PreviousMonthTotal) * 100, 1) AS DECIMAL(10,1)) AS VARCHAR) + '%'
            END AS 'Değişim (Bu Ay)'
        `;

        // Total sales query
        const totalSalesQuery = `
        DECLARE @CurrentMonthTotal DECIMAL(18,2)
        DECLARE @PreviousMonthTotal DECIMAL(18,2)
        DECLARE @TotalSales DECIMAL(18,2)
        DECLARE @CurrentMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))
        DECLARE @CurrentMonthEnd DATE = EOMONTH(GETDATE())
        DECLARE @PreviousMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -2))
        DECLARE @PreviousMonthEnd DATE = EOMONTH(GETDATE(), -1)

        SELECT @TotalSales = ISNULL(SUM(ABS(t.BonusUsed)), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
        WHERE
            t.BonusUsed <> 0 AND t.BonusUsed IS NOT NULL

        SELECT @CurrentMonthTotal = ISNULL(SUM(ABS(t.BonusUsed)), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
        WHERE
            t.OrderDateTime BETWEEN @CurrentMonthStart AND @CurrentMonthEnd
            AND t.BonusUsed <> 0 AND t.BonusUsed IS NOT NULL

        SELECT @PreviousMonthTotal = ISNULL(SUM(ABS(t.BonusUsed)), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)    
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
        WHERE
            t.OrderDateTime BETWEEN @PreviousMonthStart AND @PreviousMonthEnd
            AND t.BonusUsed <> 0 AND t.BonusUsed IS NOT NULL

        SELECT 
            FORMAT(@TotalSales, 'C', 'tr-TR') AS 'Toplam Satış',
            CASE 
                WHEN @PreviousMonthTotal = 0 THEN '∞'
                ELSE CAST(CAST(ROUND(((@CurrentMonthTotal - @PreviousMonthTotal) / @PreviousMonthTotal) * 100, 1) AS DECIMAL(10,1)) AS VARCHAR) + '%'
            END AS 'Değişim (Bu Ay)'
        `;

        // Current month sales query
        const currentMonthSalesQuery = `
        DECLARE @CurrentMonthTotal DECIMAL(18,2)
        DECLARE @PreviousMonthTotal DECIMAL(18,2)
        DECLARE @CurrentMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -1))
        DECLARE @CurrentMonthEnd DATE = EOMONTH(GETDATE())
        DECLARE @PreviousMonthStart DATE = DATEADD(DAY, 1, EOMONTH(GETDATE(), -2))
        DECLARE @PreviousMonthEnd DATE = EOMONTH(GETDATE(), -1)

        SELECT @CurrentMonthTotal = ISNULL(SUM(ABS(t.BonusUsed)), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
        WHERE
            t.OrderDateTime BETWEEN @CurrentMonthStart AND @CurrentMonthEnd
            AND t.BonusUsed <> 0 AND t.BonusUsed IS NOT NULL

        SELECT @PreviousMonthTotal = ISNULL(SUM(ABS(t.BonusUsed)), 0)
        FROM
            [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            INNER JOIN [${tenantId}].bonus_customerfiles as cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
        WHERE
            t.OrderDateTime BETWEEN @PreviousMonthStart AND @PreviousMonthEnd
            AND t.BonusUsed <> 0 AND t.BonusUsed IS NOT NULL

        SELECT 
            FORMAT(@CurrentMonthTotal, 'C', 'tr-TR') AS 'Bu Ay Satış',
            CASE 
                WHEN @PreviousMonthTotal = 0 THEN '∞'
                ELSE CAST(CAST(ROUND(((@CurrentMonthTotal - @PreviousMonthTotal) / @PreviousMonthTotal) * 100, 1) AS DECIMAL(10,1)) AS VARCHAR) + '%'
            END AS 'Değişim (Bu Ay)'
        `;

        // Six months data query
        const sixMonthsDataQuery = `
        DECLARE @EndDate DATE = EOMONTH(GETDATE())
        DECLARE @StartDate DATE = DATEADD(MONTH, -5, DATEADD(DAY, 1, EOMONTH(GETDATE(), -6)))

        ;WITH OrderSales AS (
            SELECT 
                t.OrderKey,
                t.OrderDateTime,
                SUM(ABS(t.BonusUsed)) AS TotalOrderAmount
            FROM 
                [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
            WHERE
                t.OrderDateTime BETWEEN @StartDate AND @EndDate
                AND t.BonusUsed <> 0 AND t.BonusUsed IS NOT NULL
            GROUP BY
                t.OrderKey,
                t.OrderDateTime
        ),
        MonthlyData AS (
            SELECT 
                DATEFROMPARTS(YEAR(t.OrderDateTime), MONTH(t.OrderDateTime), 1) AS MonthStart,
                EOMONTH(t.OrderDateTime) AS MonthEnd,
                MONTH(t.OrderDateTime) AS MonthNumber,
                SUM(CASE WHEN 
                    ISNULL(p.IsAccountPayment, 0) = 1 OR 
                    t.CustomField2 = 'BAKİYE YÜKLEME' OR 
                    p.PaymentMethodName = 'ONLİNE CARİ' 
                    THEN ABS(t.BonusEarned) ELSE 0 END) AS TotalCollection,
                0 AS TotalSales
            FROM
                [${tenantId}].bonus_transactions AS t WITH (NOLOCK)
                INNER JOIN [${tenantId}].bonus_customerfiles AS cf WITH (NOLOCK) ON cf.CustomerKey = t.CustomerKey
                LEFT JOIN [${tenantId}].bonus_orderpayments AS p WITH (NOLOCK) ON p.OrderKey = t.OrderKey
            WHERE
                t.OrderDateTime BETWEEN @StartDate AND @EndDate
            GROUP BY
                DATEFROMPARTS(YEAR(t.OrderDateTime), MONTH(t.OrderDateTime), 1),
                EOMONTH(t.OrderDateTime),
                MONTH(t.OrderDateTime)
        ),
        MonthlySales AS (
            SELECT
                DATEFROMPARTS(YEAR(os.OrderDateTime), MONTH(os.OrderDateTime), 1) AS MonthStart,
                SUM(os.TotalOrderAmount) AS TotalSales
            FROM
                OrderSales os
            GROUP BY
                DATEFROMPARTS(YEAR(os.OrderDateTime), MONTH(os.OrderDateTime), 1)
        ),
        CombinedData AS (
            SELECT
                md.MonthStart,
                md.MonthEnd,
                md.MonthNumber,
                md.TotalCollection,
                ISNULL(ms.TotalSales, 0) AS TotalSales
            FROM
                MonthlyData md
                LEFT JOIN MonthlySales ms ON md.MonthStart = ms.MonthStart
        )

        SELECT 
            CASE MonthNumber
                WHEN 1 THEN 'Ocak'
                WHEN 2 THEN 'Şubat'
                WHEN 3 THEN 'Mart'
                WHEN 4 THEN 'Nisan'
                WHEN 5 THEN 'Mayıs'
                WHEN 6 THEN 'Haziran'
                WHEN 7 THEN 'Temmuz'
                WHEN 8 THEN 'Ağustos'
                WHEN 9 THEN 'Eylül'
                WHEN 10 THEN 'Ekim'
                WHEN 11 THEN 'Kasım'
                WHEN 12 THEN 'Aralık'
            END AS 'Ay',
            FORMAT(TotalCollection, 'C', 'tr-TR') AS 'Tahsilat',
            FORMAT(TotalSales, 'C', 'tr-TR') AS 'Satış',
            FORMAT((TotalCollection - LAG(TotalCollection) OVER (ORDER BY MonthStart)) / 
                   NULLIF(LAG(TotalCollection) OVER (ORDER BY MonthStart), 0) * 100, 'N1') + '%' AS 'Tahsilat Değişim',
            FORMAT((TotalSales - LAG(TotalSales) OVER (ORDER BY MonthStart)) / 
                   NULLIF(LAG(TotalSales) OVER (ORDER BY MonthStart), 0) * 100, 'N1') + '%' AS 'Satış Değişim'
        FROM 
            CombinedData
        ORDER BY
            MonthStart
        `;

        try {
            // Execute all queries in parallel using Promise.all
            const [
                topDebtorsResult,
                totalCollectionResult,
                currentMonthCollectionResult,
                totalSalesResult,
                currentMonthSalesResult,
                sixMonthsDataResult
            ] = await Promise.all([
                instance.executeQuery<TopDebtors[]>({
                    query: topDebtorsQuery,
                    req
                }),
                instance.executeQuery<TotalCollection[]>({
                    query: totalCollectionQuery,
                    req
                }),
                instance.executeQuery<CurrentMonthCollection[]>({
                    query: currentMonthCollectionQuery,
                    req
                }),
                instance.executeQuery<TotalSales[]>({
                    query: totalSalesQuery,
                    req
                }),
                instance.executeQuery<CurrentMonthSales[]>({
                    query: currentMonthSalesQuery,
                    req
                }),
                instance.executeQuery<MonthlyStat[]>({
                    query: sixMonthsDataQuery,
                    req
                })
            ]);

            // Combine all results into a single dashboard data object
            const dashboardData: DashboardData = {
                topDebtors: topDebtorsResult || [],
                totalCollection: totalCollectionResult?.[0] || { 'Toplam Tahsilat': '₺0,00', 'Değişim (Bu Ay)': '0,0%' },
                currentMonthCollection: currentMonthCollectionResult?.[0] || { 'Bu Ay Tahsilat': '₺0,00', 'Değişim (Bu Ay)': '0,0%' },
                totalSales: totalSalesResult?.[0] || { 'Toplam Satış': '₺0,00', 'Değişim (Bu Ay)': '0,0%' },
                currentMonthSales: currentMonthSalesResult?.[0] || { 'Bu Ay Satış': '₺0,00', 'Değişim (Bu Ay)': '0,0%' },
                sixMonthStats: sixMonthsDataResult || []
            };

            return res.status(200).json(dashboardData);

        } catch (error: any) {
            console.error('Error executing queries:', error);
            return res.status(500).json({
                error: 'Error executing queries',
                details: error.message
            });
        }
    } catch (error: any) {
        console.error('Error in dashboard data handler:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}