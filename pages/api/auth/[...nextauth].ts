import NextAuth from 'next-auth';
import Providers from 'next-auth/providers';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default NextAuth({
    providers: [
        Providers.GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
    ],
    // debug: process.env.NODE_ENV === 'development',
    secret: process.env.AUTH_SECRET,
    jwt: {
        secret: process.env.JWT_SECRET,
    },
    adapter: PrismaAdapter(prisma),
});
