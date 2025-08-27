import './styles/globals.css';
import '@bermuda/ui/src/styles.css';
import NavBar from './parts/navbar';
import { AuthProvider } from '../contexts/auth-context';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: 'Bermuda Buddy',
  description: 'Serious DIY Bermuda lawn care, done right.',
};

// Ensure optimal mobile viewport for responsive layouts
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} ${jetbrains.variable} bb-bg min-h-screen antialiased`}>
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
