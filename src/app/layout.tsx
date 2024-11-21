import { Inter } from "next/font/google"
import { cn } from "@/lib/utils"
import { SideNav } from "@/components/sidenav"

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
        <div className="flex h-screen">
          {/* Side Navigation */}
          <SideNav />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}