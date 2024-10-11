import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils"
import { AuthProvider } from '@/contexts/AuthContext';
import { PlansProvider } from '@/contexts/PlansContext';



const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Tophat Financial",
  description: "A classy place for money matters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
            <body
            className={cn(
              "min-h-screen bg-background font-sans antialiased",
              fontSans.variable
            )}
            >
              <AuthProvider>
                <PlansProvider>
                  {children}
                </PlansProvider>
              </AuthProvider>
            </body>
    </html>
  );
}
