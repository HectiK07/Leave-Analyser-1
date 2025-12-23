import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Leave Analyzer',
  description: 'Analyze employee leave data from Excel files',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
