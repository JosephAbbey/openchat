import type { NextPage } from 'next';
import { useEffect } from 'react';
import { signIn, signOut, useSession } from 'next-auth/client';
import io from 'socket.io-client';

const Index: NextPage = () => {
    const [session] = useSession();

    useEffect(() => {
        if (session) {
            fetch('/api/socketio').finally(() => {
                const socket = io();

                socket.on('connect', () => {
                    console.log('connect');
                    socket.emit('hello');
                });

                socket.on('hello', (data) => {
                    console.log('hello', data);
                });

                socket.on('a user connected', () => {
                    console.log('a user connected');
                });

                socket.on('disconnect', () => {
                    console.log('disconnect');
                });
            });
        }
    });

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

export default Index;
