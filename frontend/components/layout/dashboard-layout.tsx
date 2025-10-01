"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/navigation/Header"
import { Sidebar } from "@/components/navigation/Sidebar"
import { NotificationsHub } from "@/components/NotificationsHub"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background">
        {/* Animated background particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -inset-10 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" />
            <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse-slow" />
          </div>
        </div>

        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Sidebar */}
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />

        {/* Main content */}
        <div className="lg:pl-64">
          <motion.main
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={cn(
              "min-h-screen pt-16",
              className
            )}
          >
            {children}
          </motion.main>
        </div>

        {/* Notifications */}
        <NotificationsHub />
      </div>
    </ThemeProvider>
  )
}

