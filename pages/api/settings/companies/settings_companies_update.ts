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
        const companyData = req.body as Partial<Efr_Companies>; // Güncelleme işlemi için kısmi veri alınabilir.

        if (!companyData.id) {
            return res.status(400).json({
                success: false,
                message: 'Company ID is required for updating'
            });
        }

        // Güncellenecek alanları dinamik olarak oluştur
        const updateFields: string[] = [];
        const parameters: Record<string, any> = { CompanyID: companyData.id };

        if (companyData.companyName) {
            updateFields.push("companyName = @CompanyName");
            parameters.CompanyName = companyData.companyName;
        }
        if (companyData.tenantName) {
            updateFields.push("tenantName = @TenantName");
            parameters.TenantName = companyData.tenantName;
        }
        if (companyData.companyKey) {
            updateFields.push("companyKey = @CompanyKey");
            parameters.CompanyKey = companyData.companyKey;
        }
        if (companyData.isActive !== undefined) {
            updateFields.push("isActive = @IsActive");
            parameters.IsActive = companyData.isActive ? 1 : 0;
        }
        if (companyData.editUser) {
            updateFields.push("editUser = @EditUser");
            parameters.EditUser = companyData.editUser;
        }

        parameters.EditDate = new Date();
        updateFields.push("editDate = GETDATE()");

        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields provided for update'
            });
        }

        const result = await instance.executeQuery({
            query: `
                UPDATE dbo.bonus_poscompanies
                SET ${updateFields.join(", ")}
                WHERE id = @CompanyID;
            `,
            parameters,
            req
        });

        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update company'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Company updated successfully',
            company: {
                ...companyData,
                editDate: parameters.EditDate
            }
        });

    } catch (error) {
        console.error('Error in company update:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating company',
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : 'Unknown error'
        });
    }
}
