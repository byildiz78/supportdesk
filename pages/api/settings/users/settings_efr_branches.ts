import { NextApiRequest, NextApiResponse } from 'next';
import { Efr_Branches } from '@/types/tables';
import { jwtVerify } from 'jose';
import { extractTenantId } from '@/lib/utils';
import { Dataset } from '@/lib/dataset';


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {

        const tenantId = extractTenantId(req.headers.referer);
        const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);

        const cookies = req.headers.cookie?.split(';').reduce((acc: { [key: string]: string }, cookie) => {
            const [key, value] = cookie.trim().split('=');
            if (key && value) {
                acc[key.trim()] = decodeURIComponent(value.trim());
            }
            return acc;
        }, {}) || {};

        if (cookies) {
            const accessToken = cookies[`${tenantId}_access_token`];
            const decoded = await jwtVerify(
                accessToken,
                ACCESS_TOKEN_SECRET
            );

            // Token payload'ından branches'i al
            const userId = decoded.payload.userId?.toString();

            if (!userId) {
                return res.status(400).json({ error: 'No userId found in token' });
            }

            const query = `
               SELECT DISTINCT s.name AS BranchName, 
                s.schema_id AS BranchID
            FROM sys.schemas s
            WHERE s.name NOT IN ('db_accessadmin', 'db_backupoperator', 'db_datareader', 
                                'db_datawriter', 'db_ddladmin', 'db_denydatareader', 
                                'db_denydatawriter', 'db_owner', 'db_securityadmin', 
                                'dbo', 'guest', 'INFORMATION_SCHEMA', 'sys')
            AND s.name NOT LIKE 'db_%'
            ORDER BY s.name;
            `;  
            const instance = Dataset.getInstance();

            const result = await instance.executeQuery<Efr_Branches[]>({
                query,
                parameters: {
                    userId
                },
                req
            });
            if (!result || result.length === 0) {
                return res.status(404).json({ error: 'No branches found for user' });
            }
            return res.status(200).json(result);

        }

        return res.status(400).json("");

    } catch (error: any) {
        console.error('Error in branches handler:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message
        });
    }
}
