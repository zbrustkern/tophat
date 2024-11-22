import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import { NavBar } from "@/components/NavBar"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.className
      )}>
        <Providers>
          <div className="flex h-screen">
            <NavBar />
            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}