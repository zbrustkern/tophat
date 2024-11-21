import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { Providers } from "@/components/providers"
import SideNav from "@/components/SideNav"

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
            <SideNav />
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}