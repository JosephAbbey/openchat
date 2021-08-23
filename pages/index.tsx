import type { NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/client';

const Index: NextPage = () => {
    const [session] = useSession();

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
                    <p>
                        Not {session.user?.name || session.user?.email}? Then
                        Logout and login again
                    </p>
                    <button onClick={() => signOut()}>Logout</button> <br />
                </>
            )}
        </>
    );
};

export default Index;
