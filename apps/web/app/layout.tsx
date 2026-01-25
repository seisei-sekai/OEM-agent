import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { FloatingAIAgent } from '@/components/floating-agent/FloatingAIAgent'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OEM Agent - AI-Powered Manufacturing Assistant',
  description: 'Turn your ideas into real, physical products with AI assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <FloatingAIAgent />
      </body>
    </html>
  )
}



