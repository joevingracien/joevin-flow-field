import dynamic from 'next/dynamic'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { cn } from '@/libs/utils'
import '@/global.css'

const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

export const metadata = {
  title: 'Joevin Gracien',
  description: 'My personal website',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={cn(`${GeistSans.variable} ${GeistMono.variable}`, 'antialiased')}>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body>
        {/* To avoid FOUT with styled-components wrap Layout with StyledComponentsRegistry https://beta.nextjs.org/docs/styling/css-in-js#styled-components */}
        {children}
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
      </body>
    </html>
  )
}
