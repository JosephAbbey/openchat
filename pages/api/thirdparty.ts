import type { NextApiRequest, NextApiResponse } from 'next';
import { signIn } from 'next-auth/client';

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
) {
    if (req.url) {
        const callback: string | null = new URL(
            req.url,
            `http://${req.headers.host}`
        ).searchParams.get('callback');
        if (callback) {
            if (req.cookies['next-auth.session-token']) {
                res.redirect(
                    callback +
                        '?token=' +
                        req.cookies['next-auth.session-token']
                );
            } else if (req.cookies['__Secure-next-auth.session-token']) {
                res.redirect(
                    callback +
                        '?token=' +
                        req.cookies['__Secure-next-auth.session-token']
                );
            } else {
                signIn('github', {
                    callbackUrl: process.env.NEXTAUTH_URL + '/api/thirdparty',
                });
            }
        } else {
            res.status(422).send('Invalid callback URL.');
        }
    }
    res.end();
}
