import type { AppProps } from 'next/app';
import "../components/builder-registry";

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
