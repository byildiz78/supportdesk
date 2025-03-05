import { NextApiRequest, NextApiResponse } from "next";
import { Dataset } from '@/lib/dataset';
import { jwtVerify } from 'jose';
import { extractTenantId } from "@/lib/utils";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Extract tenant ID from referer
        const tenantId = extractTenantId(req.headers.referer);
        
        // Verify and extract user ID from token
        const userId = await verifyUserToken(req, tenantId);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const instance = Dataset.getInstance();

        // Get user settings from database
        const result = await instance.executeQuery<any>({
            query: `
                SELECT 
                    ISNULL(minDiscountAmount, 0) as minDiscountAmount,
                    ISNULL(minCancelAmount, 0) as minCancelAmount,
                    ISNULL(minSaleAmount, 0) as minSaleAmount
                FROM efr_Users 
                WHERE UserID = @UserID
            `,
            parameters: {
                UserID: userId
            },
            req
        });

        // If no settings found, return defaults
        if (!result) {
            return res.status(200).json({
                minDiscountAmount: 0,
                minCancelAmount: 0,
                minSaleAmount: 0
            });
        }

        return res.status(200).json(result[0]);
    } catch (error) {
        console.error('Error in get settings handler:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


async function verifyUserToken(req: NextApiRequest, tenantId: string): Promise<string | null> {
    try {
        const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
        if (!ACCESS_TOKEN_SECRET) {
            throw new Error('ACCESS_TOKEN_SECRET is not defined');
        }

        const cookies = parseCookies(req.headers.cookie);
        const accessToken = process.env.IS_BOLT ? new TextEncoder().encode(process.env.BOLTACCESSTOKEN) : cookies[`${tenantId}_access_token`];
        
        if (!accessToken) {
            throw new Error('Access token not found');
        }

        const decoded = await jwtVerify(accessToken, ACCESS_TOKEN_SECRET);
        return decoded.payload.userId?.toString() || null;
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

function parseCookies(cookieHeader: string | undefined): { [key: string]: string } {
    if (!cookieHeader) return {};
    
    return cookieHeader.split(';').reduce((acc: { [key: string]: string }, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {});
}
