import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Dena-Paona | Personal Finance Ledger",
  description: "Track your personal debts and credits with your friends and family. A secure, social finance ledger for managing Dena (payable) and Paona (receivable) transactions.",
  keywords: "debt tracking, finance, ledger, dena paona, personal finance, Bangladesh",
  authors: [{ name: "Dena-Paona" }],
  openGraph: {
    title: "Dena-Paona | Personal Finance Ledger",
    description: "Track your debts and credits securely with Dena-Paona.",
    type: "website",
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0a0f1e" />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    fontSize: '14px',
                    padding: '12px 16px',
                  },
                  success: {
                    iconTheme: { primary: '#10b981', secondary: 'white' },
                  },
                  error: {
                    iconTheme: { primary: '#f43f5e', secondary: 'white' },
                  },
                }}
              />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
