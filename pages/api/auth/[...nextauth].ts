import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import * as Fauna from 'faunadb';
import { FaunaAdapter } from '@next-auth/fauna-adapter';

const client = new Fauna.Client({
    secret: 'secret',
    scheme: 'http',
    domain: 'localhost',
    port: 8443,
});

export default NextAuth({
    providers: [
        Providers.GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
    ],
    adapter: FaunaAdapter({ faunaClient: client }),
});
