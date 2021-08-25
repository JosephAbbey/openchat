import type { NextPage } from 'next';
import { useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/client';
import io from 'socket.io-client';
import cookies from 'next-cookies';

interface Props {
    cookie;
}

const Page: NextPage<Props> = ({ cookie }) => {
    const [session] = useSession();

    function epoch() {
        //@ts-ignore
        return Math.floor(new Date() / 1000);
    }
    function unepoch(time) {
        //@ts-ignore
        return new Date(time * 1000);
    }

    useEffect(() => {
        if (session) {
            fetch('/api/socket').finally(() => {
                const socket = io();

                socket.on('handshake', () => {
                    socket.emit('handshake', cookie['next-auth.session-token']);
                });

                socket.on('receive', (msg) => {
                    console.log(msg);
                });

                if (process.env.NODE_ENV === 'development') {
                    //@ts-expect-error
                    window.socket = socket;
                    //@ts-expect-error
                    window.epoch = epoch;
                    //@ts-expect-error
                    window.unepoch = unepoch;
                }
            });
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
