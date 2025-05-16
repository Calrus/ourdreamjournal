"use client"

import * as React from "react"
import { ThemeProvider } from "./theme-provider"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="relative min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center">
            <div className="mr-4 flex">
              <a className="mr-6 flex items-center space-x-2" href="/">
                <span className="font-bold">Dream Journal</span>
              </a>
            </div>
            <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
              <nav className="flex items-center">
                <ThemeToggle />
                {user && (
                  <button
                    onClick={logout}
                    className="ml-4 px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/80 transition-colors"
                  >
                    Logout
                  </button>
                )}
              </nav>
            </div>
          </div>
        </header>
        <main className="container py-6">{children}</main>
      </div>
    </ThemeProvider>
  )
} 