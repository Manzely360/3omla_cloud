import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import '../styles/globals.css'
import NotificationsHub from '../components/NotificationsHub'
import TutorialModal from '../components/TutorialModal'
import { I18nProvider } from '../lib/i18n'
import { ThemeProvider } from '../components/theme-provider'
import { initializeAccessibility } from '../lib/accessibility'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

export default function App({ Component, pageProps }: AppProps) {
  // Initialize accessibility features
  useEffect(() => {
    initializeAccessibility();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
          <NotificationsHub />
          <TutorialModal />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
