import type { Metadata, Viewport } from 'next';
import './globals.css';
import { PwaRegistrar } from '@/components/PwaRegistrar';

export const metadata: Metadata = {
  title: 'VIVARIUM',
  description: 'A localized multi-agent social media simulation',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VivariumAI',
  },
  icons: {
    icon: '/vivarium-icon.svg',
    apple: '/vivarium-icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
