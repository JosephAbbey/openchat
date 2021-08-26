import type { NextApiRequest, NextApiResponse } from 'next';
import { signIn } from 'next-auth/client';

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
) {
    if (!req.cookies['next-auth.session-token']) {
        signIn('github', {
            callbackUrl: process.env.NEXTAUTH_URL + '/api/thirdparty',
        });
    } else {
        if (req.url) {
            const callback: string | null = new URL(
                req.url,
                `http://${req.headers.host}`
            ).searchParams.get('callback');
            if (callback) {
                res.redirect(
                    callback +
                        '?token=' +
                        req.cookies['next-auth.session-token']
                );
            } else {
                res.status(422).send('Invalid callback URL.');
            }
        }
    }
}
