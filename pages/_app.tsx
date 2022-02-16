import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>IP Visualizer</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta name="description" content="Interactive IP Address Demo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
