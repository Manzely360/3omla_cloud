import { ReactNode, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Sidebar from './navigation/Sidebar'
import Header from './navigation/Header'
import CryptoLogist from './CryptoLogist'
import Logo3omla from './Logo3omla'
import { useI18n } from '../lib/i18n'

interface LayoutProps {
  children: ReactNode
}

// Animated Background Particles Component
const AnimatedParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number }>>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 20
    }))
    setParticles(newParticles)
  }, [])

  if (!isClient) {
    return <div className="particles" />
  }

  return (
    <div className="particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  )
}

export default function Layout({ children }: LayoutProps) {
  const { t } = useI18n()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLightMode, setIsLightMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const html = document.documentElement
    const detect = () => setIsLightMode(html.classList.contains('theme-light'))
    detect()
    const observer = new MutationObserver(detect)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedParticles />
      
      {/* Ultra Modern Gradient Orbs */}
      <div
        className={`pointer-events-none absolute -top-24 -left-40 h-96 w-96 rounded-full blur-3xl floating ${isLightMode ? 'bg-gradient-to-br from-amber-200/60 via-rose-100/50 to-transparent' : 'bg-gradient-to-br from-blue-500/20 via-purple-500/30 to-transparent'}`}
      />
      <div
        className={`pointer-events-none absolute top-1/3 right-[-160px] h-[420px] w-[420px] rounded-full blur-3xl floating ${isLightMode ? 'bg-gradient-to-br from-sky-200/50 via-teal-200/40 to-transparent' : 'bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-transparent'}`}
        style={{ animationDelay: '3s' }}
      />
      <div
        className={`pointer-events-none absolute bottom-20 left-1/4 h-64 w-64 rounded-full blur-3xl floating ${isLightMode ? 'bg-gradient-to-br from-lime-200/50 via-emerald-100/40 to-transparent' : 'bg-gradient-to-br from-green-400/15 via-blue-400/20 to-transparent'}`}
        style={{ animationDelay: '1.5s' }}
      />
      
      {/* Glassmorphism Overlay */}
      <div
        className={`absolute inset-0 backdrop-blur-sm transition-colors duration-500 ${isLightMode ? 'bg-gradient-to-br from-white/85 via-amber-50/70 to-white/80' : 'bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-slate-900/90'}`}
      />
      
      <div className="flex relative z-10">
        {/* Sidebar */}
        <Sidebar onToggle={setSidebarOpen} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="space-y-6"
              >
                {children}
              </motion.div>
            </div>
          </main>
          {/* Footer - Full width when sidebar is closed */}
          <footer
            className={`border-t py-12 px-6 transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'} ${isLightMode ? 'bg-gradient-to-r from-white to-amber-100/60 border-slate-200' : 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700'}`}
          >
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2">
                  <Logo3omla variant="full" size="lg" className="mb-4" />
                  <p className={`${isLightMode ? 'text-slate-600' : 'text-slate-300'} mb-6 max-w-md`}>
                    {t('footer.description')}
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className={`${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>Twitter</a>
                    <a href="#" className={`${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>Telegram</a>
                    <a href="#" className={`${isLightMode ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>Discord</a>
                  </div>
                </div>
                
                {/* Quick Links */}
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('footer.quick_links')}</h4>
                  <ul className="space-y-2">
                    <li><a href="/about" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.about_us')}</a></li>
                    <li><a href="/contact" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.contact')}</a></li>
                    <li><a href="/privacy" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.privacy')}</a></li>
                    <li><a href="/terms" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.terms')}</a></li>
                  </ul>
                </div>
                
                {/* Resources */}
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('footer.resources')}</h4>
                  <ul className="space-y-2">
                    <li><a href="/blog" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.blog')}</a></li>
                    <li><a href="/help" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.help')}</a></li>
                    <li><a href="/api" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.api')}</a></li>
                    <li><a href="/status" className={`${isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'} transition-colors`}>{t('footer.status')}</a></li>
                  </ul>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className={`mt-8 pt-8 border-t ${isLightMode ? 'border-slate-200' : 'border-slate-700'}`}>
                <div className={`${isLightMode ? 'bg-yellow-100/60 border-yellow-300/60 text-amber-700' : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200'} border rounded-lg p-4 mb-4 text-sm`}>
                  <p>
                    ⚠️ <strong>{t('footer.disclaimer')}:</strong> {t('footer.disclaimer_text')}
                  </p>
                </div>
                <p className={`text-sm text-center ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  <strong>{t('footer.dyor')}:</strong> {t('footer.dyor_text')}
                </p>
                <p className={`text-xs text-center mt-2 ${isLightMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('footer.copyright')}
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
      
      {/* CryptoLogist Assistant */}
      <CryptoLogist />
    </div>
  )
}
