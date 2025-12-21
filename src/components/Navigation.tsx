'use client'

import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { Link } from '@tanstack/react-router'
import { motion } from 'motion/react'

const navItems = [
  { to: '/work', label: 'Work', isCenter: false },
  { to: '/', label: 'Joevin Gracien', isCenter: true },
  { to: '/about', label: 'About', isCenter: false },
]

export function Navigation() {
  return (
    <NavigationMenu.Root className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <NavigationMenu.List className="flex items-center gap-16 pointer-events-auto">
        {navItems.map((item, i) => (
          <NavigationMenu.Item key={item.to} asChild>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.1 + i * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <NavigationMenu.Link
                render={<Link to={item.to} />}
                className={
                  item.isCenter
                    ? 'text-sm font-light tracking-[0.25em] uppercase text-white/90'
                    : 'text-[11px] font-light tracking-[0.15em] uppercase text-white/60 transition-colors duration-300 hover:text-white'
                }
              >
                {item.label}
              </NavigationMenu.Link>
            </motion.div>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  )
}
