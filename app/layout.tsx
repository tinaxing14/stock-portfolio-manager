import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/lib/ToastContext';
import { PortfolioProvider } from '@/lib/PortfolioContext';
import Sidebar from '@/components/Sidebar';
import Toasts from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Portfolio Tracker',
  description: 'Track and analyze your stock portfolio',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <PortfolioProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-72 p-6 lg:p-8 min-w-0">
                {children}
              </main>
            </div>
            <Toasts />
          </PortfolioProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
