import { NextApiRequest, NextApiResponse } from 'next';
import { Dataset } from '@/lib/dataset';
import { Efr_Users } from './types';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const instance = Dataset.getInstance();
        const userData = req.body as Efr_Users;

        if (!userData) {
            return res.status(400).json({
                success: false,
                message: 'User data is required'
            });
        }

        if (!userData.UserName || !userData.Name || !userData.SurName) {
            return res.status(400).json({
                success: false,
                message: 'Username, Name and Surname are required fields'
            });
        }

        // Generate a random password if not provided
        const password = userData.UserPWD || crypto.randomBytes(8).toString('hex');
        
        const result = await instance.executeQuery<{ UserID: string }[]>({
            query: `
                DECLARE @InsertedID INT;

                INSERT INTO dbo.bonus_users(
                    username,
                    password,
                    name,
                    surname,
                    phone_number,
                    email,
                    [schema],
                    type,
                    active
                ) VALUES (
                    @UserName,
                    @Password,
                    @Name,
                    @SurName,
                    @PhoneNumber,
                    @EMail,
                    @Schema,
                    @Category,
                    @IsActive
                );

                SET @InsertedID = SCOPE_IDENTITY();
                
                SELECT @InsertedID as UserID;
            `,
            parameters: {
                UserName: userData.UserName,
                Password: password,
                Name: userData.Name,
                SurName: userData.SurName,
                PhoneNumber: userData.PhoneNumber || '',
                EMail: userData.EMail || '',
                Schema: userData.Schema || '',
                Category: userData.Category || 1,
                IsActive: userData.IsActive ? 1 : 0
            },
            req
        });

        if (!result || result.length === 0 || !result[0]?.UserID) {
            console.error('Failed to get new user ID. Result:', result);
            return res.status(500).json({
                success: false,
                message: 'Failed to get new user ID',
                error: result
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User created successfully',
            userId: result[0].UserID
        });

    } catch (error) {
        console.error('Error in user creation:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error instanceof Error ? {
                message: error.message,
                stack: error.stack
            } : 'Unknown error'
        });
    }
}