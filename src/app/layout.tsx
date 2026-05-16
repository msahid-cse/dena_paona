import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
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
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#141d35',
                color: '#e2e8f0',
                border: '1px solid #1e2d4a',
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
      </body>
    </html>
  );
}
