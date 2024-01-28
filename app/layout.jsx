import { SpeedInsights } from '@vercel/speed-insights/next'
import '@/global.css'

export const metadata = {
  title: 'Joevin Gracien',
  description: 'Welcome to my website.',
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className='antialiased'>
      <head />
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
