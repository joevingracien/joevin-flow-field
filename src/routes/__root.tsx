// src/routes/__root.tsx
/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
} from '@tanstack/react-router'
import appCss from '../app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Joevin Gracien',
      },
      {
        name: 'description',
        content: 'Design engineer',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-extralight tracking-tight text-white">404</h1>
        <p className="text-sm tracking-wide text-white/50">Page not found</p>
        <Link
          to="/"
          className="mt-8 inline-block text-xs uppercase tracking-[0.25em] text-white/70 transition-colors hover:text-white"
        >
          Return Home
        </Link>
      </div>
    </div>
  ),
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body
        suppressHydrationWarning
        className="pointer-events-auto m-auto max-w-[1080px] overflow-hidden px-5 font-sans text-white antialiased"
      >
        {children}
        <Scripts />
      </body>
    </html>
  )
}
