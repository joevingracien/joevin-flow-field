'use client'

import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { Link } from '@tanstack/react-router'

export function Navigation() {
  return (
    <NavigationMenu.Root className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <NavigationMenu.List className="flex items-center gap-16 pointer-events-auto">
        <NavigationMenu.Item>
          <NavigationMenu.Link
            render={<Link to="/work" />}
            className="text-[11px] font-light tracking-[0.15em] uppercase text-white/60 transition-colors duration-300 hover:text-white"
          >
            Work
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link
            render={<Link to="/" />}
            className="text-sm font-light tracking-[0.25em] uppercase text-white/90"
          >
            Joevin Gracien
          </NavigationMenu.Link>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link
            render={<Link to="/about" />}
            className="text-[11px] font-light tracking-[0.15em] uppercase text-white/60 transition-colors duration-300 hover:text-white"
          >
            About
          </NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}
