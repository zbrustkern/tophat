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
          <div className="flex min-h-screen">
            <NavBar />
            {/* Main content wrapper with proper offset and padding */}
            <div className="flex-1 md:ml-64">
              {/* Mobile header offset */}
              <div className="h-14 md:h-0" />
              {/* Content container */}
              <div className="max-w-6xl mx-auto p-4 md:py-6 md:px-8">
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}