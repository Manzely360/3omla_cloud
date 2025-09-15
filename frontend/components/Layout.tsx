import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './navigation/Sidebar'
import Header from './navigation/Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
