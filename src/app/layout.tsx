import type { Metadata } from 'next';
import { Providers } from '../components/Providers';
import { ErrorBoundary } from 'react-error-boundary'; // Importing ErrorBoundary for error handling
import './globals.css';

export const metadata: Metadata = {
  title: 'Sloticon - Slot Machine Games',
  description: 'A collection of exciting slot machine games',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // Updated type for children
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ErrorBoundary fallback={<div>Something went wrong!</div>}> {/* Error boundary for child components */}
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
