import dynamic from 'next/dynamic'
import '@/global.css'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

export const metadata = {
  title: 'Joevin Gracien',
  description: 'Design engineer',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} pointer-events-auto m-auto max-w-[1080px] overflow-hidden px-5 font-sans text-white antialiased`}
      >
        <Scene
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
          }}
        />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
