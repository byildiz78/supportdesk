// pages/api/settings/users/settings_efr_users_update.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { Efr_Users } from './types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'PUT') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const instance = Dataset.getInstance();
        const userData = req.body as Efr_Users;

        if (!userData || !userData.UserID) {
            return res.status(400).json({
                success: false,
                message: 'User data and UserID are required'
            });
        }

        const result = await instance.executeQuery<{ rowsAffected: number }[]>({
            query: `
                UPDATE dbo.bonus_users SET
                    username = @UserName,
                    name = @Name,
                    surname = @SurName,
                    phone_number = @PhoneNumber,
                    email = @EMail,
                    [schema] = @Schema,
                    type = @Category,
                    active = @IsActive
                WHERE id = @UserID;

                SELECT @UserID as UserID;
            `,
            parameters: {
                UserID: userData.UserID,
                UserName: userData.UserName || '',
                Name: userData.Name || '',
                SurName: userData.SurName || '',
                PhoneNumber: userData.PhoneNumber || '',
                EMail: userData.EMail || '',
                Schema: userData.Schema || '',
                Category: userData.Category || 1,
                IsActive: userData.IsActive ? 1 : 0
            },
            req
        });

        // Sorgu sonucunu kontrol et
        if (!result || result.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update user'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            userId: userData.UserID
        });

    } catch (error) {
        console.error('Error in user update:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : 'Unknown error'
        });
    }
}