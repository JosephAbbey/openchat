import type { NextPage } from 'next';
import { useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/client';
import OpenChatAPI from '../classes/openchatapi';
import cookies from 'next-cookies';

interface Props {
    cookie;
}

const Page: NextPage<Props> = ({ cookie }) => {
    const [session] = useSession();
    useEffect(() => {
        //@ts-expect-error
        if (!window.ocAPI) {
            //@ts-expect-error
            window.ocAPI = new OpenChatAPI();
        }
        //@ts-expect-error
        const ocAPI: OpenChatAPI = window.ocAPI;
        ocAPI.disconnect();
        if (session) {
            ocAPI.connect(cookie['next-auth.session-token']);
        }
    }, [session, cookie]);

    return (
        <>
            {!session ? (
                <>
                    <button onClick={() => signIn('github')}>
                        Sign in with Github
                    </button>
                </>
            ) : (
                <>
                    <p>Hello {session.user?.name}</p>
                    <button onClick={() => signOut()}>Logout</button> <br />
                </>
            )}
        </>
    );
};

Page.getInitialProps = async (ctx) => {
    const cookie = cookies(ctx);
    return { cookie };
};

export default Page;
