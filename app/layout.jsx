import dynamic from 'next/dynamic'
import '@/global.css'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const Scene = dynamic(() => import('@/components/canvas/Scene'), { ssr: false })

export const metadata = {
  title: 'Joevin Gracien',
  description: 'My personal website',
}

// Font files can be colocated inside of `app`
const HelveticaNow = localFont({
  src: '../public/fonts/HelveticaNowVariable.woff2',
  variable: '--font-helvetica-now-var',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={HelveticaNow.variable}>
      {/*
        <head /> will contain the components returned by the nearest parent
        head.tsx. Find out more at https://beta.nextjs.org/docs/api-reference/file-conventions/head
      */}
      <head />
      <body className='antialiased'>
        {/* To avoid FOUT with styled-components wrap Layout with StyledComponentsRegistry https://beta.nextjs.org/docs/styling/css-in-js#styled-components */}
        {children}
        <SpeedInsights />
        <Analytics />

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
