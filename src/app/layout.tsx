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
            {/* Main content wrapper with sidebar offset */}
            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
              {/* Content container with max width and padding */}
              <div className="max-w-6xl mx-auto p-4 md:py-6 md:px-8 w-full">
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}