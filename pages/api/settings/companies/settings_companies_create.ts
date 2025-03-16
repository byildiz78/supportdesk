import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { Efr_Companies } from './types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const instance = Dataset.getInstance();
        const companyData = req.body as Efr_Companies;

        if (!companyData) {
            return res.status(400).json({
                success: false,
                message: 'Company data is required'
            });
        }

        if (!companyData.companyName || !companyData.tenantName || !companyData.companyKey) {
            return res.status(400).json({
                success: false,
                message: 'Company Name, Tenant Name, and Company Key are required fields'
            });
        }

        // Varsayılan değerleri ayarla
        const isActive = companyData.isActive ?? true;

        const result = await instance.executeQuery<{ id: number }[]>({
            query: `
                DECLARE @InsertedID INT;

                INSERT INTO dbo.bonus_poscompanies (
                    companyName,
                    tenantName,
                    companyKey,
                    isActive,
                    addDate,
                    addUser
                ) VALUES (
                    @CompanyName,
                    @TenantName,
                    @CompanyKey,
                    @IsActive,
                    GETDATE(),
                    @AddUser
                );

                SET @InsertedID = SCOPE_IDENTITY();

                SELECT @InsertedID as id;
            `,
            parameters: {
                CompanyName: companyData.companyName,
                TenantName: companyData.tenantName,
                CompanyKey: companyData.companyKey,
                IsActive: isActive ? 1 : 0,
                AddUser: companyData.addUser || 'system',
            },
            req
        });

        if (!result || result.length === 0 || !result[0]?.id) {
            console.error('Failed to get new company ID. Result:', result);
            return res.status(500).json({
                success: false,
                message: 'Failed to get new company ID',
                error: result
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Company created successfully',
            company: {
                ...companyData,
                id: result[0].id,
                addDate: new Date().toISOString(),
                editDate: null,
                editUser: null
            }
        });

    } catch (error) {
        console.error('Error in company creation:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating company',
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : 'Unknown error'
        });
    }
}
