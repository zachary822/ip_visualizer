import type { AppProps } from "next/app";
import Head from "next/head";
import { useState } from "react";
import { Hydrate, QueryClient, QueryClientProvider } from "react-query";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <>
      <Head>
        <title>IP Visualizer</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="Interactive IP Address Demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <Hydrate state={pageProps.dehydratedState}>
          <Component {...pageProps} />
        </Hydrate>
      </QueryClientProvider>
    </>
  );
}

export default MyApp;
