import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Provider, useSession } from 'next-auth/client';

function MyApp({ Component, pageProps }: AppProps) {
    const [session] = useSession();

    return (
        <Provider session={pageProps.session}>
            <link rel="icon" href="/favicon.ico" type="image/x-icon" />
            <title>OpenChat</title>
            <Component {...pageProps} />
        </Provider>
    );
}
export default MyApp;
