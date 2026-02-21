import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'BashStory v1.0 - Хостинг цитат',
  description: 'Хостинг цитат с интерфейсом 1985 года. Терминальное веб-приложение для публикации, чтения и голосования за цитаты.',
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
