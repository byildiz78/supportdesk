import { extractTenantId } from '@/lib/utils';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    let tenantId = extractTenantId(req.headers.referer);

    res.setHeader('Set-Cookie', [
        `${tenantId}_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`,
        `${tenantId}_refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`
    ]);
    
    return res.status(200).json({ message: 'Logout successful' });
}