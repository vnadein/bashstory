import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'BAJOUR Social',
  description: 'Социальная сеть в терминале. Терминальное веб-приложение для публикации постов, чтения ленты и общения.',
}

export const viewport: Viewport = {
  themeColor: '#0C0C0C',
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className={jetbrainsMono.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
