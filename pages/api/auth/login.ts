import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import { SignJWT } from 'jose';
import crypto from 'crypto';
import { Dataset } from '@/lib/dataset';
import { extractTenantId } from '@/lib/utils';


const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET);
const TOKEN_ISSUER = process.env.TOKEN_ISSUER || 'ROBOTPOS';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ACCESS_TOKEN_LIFETIME = parseInt(process.env.ACCESS_TOKEN_LIFETIME || '900');
const REFRESH_TOKEN_LIFETIME = parseInt(process.env.REFRESH_TOKEN_LIFETIME || '129600');
const ACCESS_TOKEN_ALGORITHM = process.env.ACCESS_TOKEN_ALGORITHM || 'HS512';
const REFRESH_TOKEN_ALGORITHM = process.env.REFRESH_TOKEN_ALGORITHM || 'HS512';

// Extract hostname from NEXT_PUBLIC_DOMAIN for cookie domain
const getDomainForCookie = () => {
    try {
        const url = new URL(TOKEN_ISSUER);
        return url.hostname;
    } catch {
        return 'localhost';
    }
};

export function encrypt(val: string): string | null {
    if (!val) {
        return null;
    }
    const buffer = Buffer.from(val, 'utf16le');
    const hash = crypto.createHash('sha256').update(buffer).digest();
    
    return Array.from(hash)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('-');
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const tenantId = extractTenantId(req.headers.referer);
        const { username, password } = req.body;
        const encryptedpass = encrypt(password);
        const instance = Dataset.getInstance();
        
        const query =  `
            SELECT TOP 1
                id as UserID,
                username as UserName,
                email as Email,
                CONCAT(name,' ',surname) as Name,
                type as UserCategory,
                [schema] as [Schema],
                phone_number as PhoneNumber
            FROM dbo.bonus_users WITH (NOLOCK)
            WHERE 1=1
                AND username = @username 
                AND password = @password 
                AND active = 1
        `;

        const response = await instance.executeQuery<{ UserID: number; UserName: string, Email: string, Name: string, UserCategory: string }[]>({
            query,
            parameters: {
                username: username,
                password: encryptedpass?.toString()
            },
            req
        });

        const user = response[0]
        if (user) {
            let tokenPayload = {
                username: user.UserName,
                userId: user.UserID,
                aud: tenantId
            };

            const currentTimestamp = Math.floor(Date.now() / 1000);
            const cookieDomain = NODE_ENV === 'production' ? getDomainForCookie() : undefined;

            const accessToken = await new SignJWT(tokenPayload)
                .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM })
                //.setExpirationTime(currentTimestamp + ACCESS_TOKEN_LIFETIME)
                .setIssuer(TOKEN_ISSUER)
                .setAudience(tenantId)
                .setIssuedAt(currentTimestamp)
                .sign(ACCESS_TOKEN_SECRET);
            const accessTokenCookie = serialize(`${tenantId}_access_token`, accessToken, {
                httpOnly: true,
                path: '/',
            });

            const refreshToken = await new SignJWT(tokenPayload)
                .setProtectedHeader({ alg: REFRESH_TOKEN_ALGORITHM })
                .setIssuer(TOKEN_ISSUER)
                .setAudience(tenantId)
                .setIssuedAt(currentTimestamp)
                .sign(REFRESH_TOKEN_SECRET);
            const refreshTokenCookie = serialize(`${tenantId}_refresh_token`, refreshToken, {
                httpOnly: true,
                path: '/',
            });

            res.setHeader('Set-Cookie', [accessTokenCookie, refreshTokenCookie]);
            return res.status(200).json({ 
                userId: user.UserID, 
                userName: user.UserName,
                userCategory: user.UserCategory,
                name: user.Name,
                email: user.Email,
                message: 'Login successful' 
            });
        }

        return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}