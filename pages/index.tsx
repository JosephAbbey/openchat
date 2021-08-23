import type { NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/client';

const Index: NextPage = () => {
    const [session] = useSession();

    return (
        <>
            {!session && (
                <>
                    Not signed in <br />
                    <button onClick={() => signIn()}>Sign in</button>
                </>
            )}
            {session && (
                <>
                    Signed in <br />
                    <button onClick={() => signOut()}>Sign out</button>
                </>
            )}
        </>
    );
};

export default Index;
