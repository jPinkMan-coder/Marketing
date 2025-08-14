'use client';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ThemeRegistry from './ThemeRegistry';
import { AppProvider } from './context/AppContext';
import { EstimationProvider } from './context/EstimationContext';
import { PurchaseOrderProvider } from './context/PurchaseOrderContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Cost Estimation & Financial Tracking System</title>
        <meta name="description" content="Comprehensive cost estimation and financial tracking application for engineering and construction projects" />
      </head>
      <body className={inter.className}>
        <ThemeRegistry>
          <AppProvider>
            <EstimationProvider>
              <PurchaseOrderProvider>
                {children}
              </PurchaseOrderProvider>
            </EstimationProvider>
          </AppProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}