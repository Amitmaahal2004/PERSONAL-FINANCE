import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@/styles/main.scss';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { hexToRgb } from '@/lib/theme';
import { connectToDatabase } from '@/lib/db';
import { ThemeConfig } from '@/models/ThemeConfig';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'MyFinance - Your Money. Your Records. Your Control.',
  description: 'Premium personal finance management web application. Track income, expenses, accounts, budgets, savings goals and reports privately.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const dynamic = 'force-dynamic';

async function getInitialTheme() {
  try {
    await connectToDatabase();
    const theme = await ThemeConfig.findOne().lean();
    if (theme) {
      return {
        primaryColor: theme.primaryColor || '#10B981',
        secondaryColor: theme.secondaryColor || '#0F766E',
      };
    }
  } catch (e) {
    // Return default if connection fails during build
  }
  return {
    primaryColor: '#10B981',
    secondaryColor: '#0F766E',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialTheme = await getInitialTheme();
  const pRgb = hexToRgb(initialTheme.primaryColor);
  const sRgb = hexToRgb(initialTheme.secondaryColor);

  return (
    <html lang="en" className="h-full">
      <head>
        <style
          id="server-theme-bootstrap"
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --color-primary: ${initialTheme.primaryColor};
                --color-primary-rgb: ${pRgb.r}, ${pRgb.g}, ${pRgb.b};
                --color-primary-hover: ${initialTheme.primaryColor};
                --color-primary-light: rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.08);
                --color-primary-subtle: rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.15);
                --color-primary-border: rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.3);
                --color-primary-ring: rgba(${pRgb.r}, ${pRgb.g}, ${pRgb.b}, 0.25);
                --color-secondary: ${initialTheme.secondaryColor};
                --color-secondary-rgb: ${sRgb.r}, ${sRgb.g}, ${sRgb.b};
                --color-secondary-light: rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.08);
                --color-secondary-border: rgba(${sRgb.r}, ${sRgb.g}, ${sRgb.b}, 0.3);
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-full antialiased`}>
        <ThemeProvider initialTheme={initialTheme}>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
