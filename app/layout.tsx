import type { Metadata } from 'next'
import { DM_Sans, JetBrains_Mono, Fraunces } from 'next/font/google'
import './globals.css'
import { CachePurger } from '@/components/layout/CachePurger'
import { StoreHydrator } from '@/components/layout/StoreHydrator'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

// Characterful display serif for the wordmark and large headings — adds a
// refined, editorial/scholarly touch that plain sans can't.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GestClasse — Gestion de Classe',
  description: 'Application de gestion de classe scolaire',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${jetbrainsMono.variable} ${fraunces.variable}`}>
      <body className={dmSans.className}>
        <CachePurger />
        <StoreHydrator />
        {children}
      </body>
    </html>
  )
}
