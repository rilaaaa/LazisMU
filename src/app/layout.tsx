import { Toaster } from '@/components/ui/toaster'
import './globals.css'
import type { Metadata } from 'next'
import { initializePrisma } from '@/lib/initPrisma'

export const metadata: Metadata = {
  title: 'Lazismu Dashboard',
  description: 'A dashboard application for Lazismu',
}

initializePrisma().catch(console.error)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  )
}