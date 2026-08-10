import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FlowTask — Micro-Task Tracker',
  description: 'Frictionless micro-task tracking scoped to hours, days, and one week.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FlowTask',
  },
};

export const viewport: Viewport = {
  themeColor: '#fafaf9',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full bg-stone-50">
        {children}
      </body>
    </html>
  );
}
