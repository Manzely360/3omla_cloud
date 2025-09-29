import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TutorialModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('auth_token')
    const dismissed = localStorage.getItem('3omla_tutorial_dismissed')
    if (!token && !dismissed) {
      setTimeout(() => setOpen(true), 1200)
    }
  }, [])

  const close = () => {
    setOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('3omla_tutorial_dismissed', 'true')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl shadow-indigo-200/80 border border-indigo-100 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-slate-800">Welcome to 3omla</h2>
                <p className="text-sm text-slate-500">
                  Create an account to unlock personalized advisors, automated lead-lag tracking, and instant PDF intelligence briefs tailored to Cairo time.
                </p>
                <ol className="space-y-2 text-sm text-slate-600 list-decimal ml-5">
                  <li>Click “Login” and create your account.</li>
                  <li>Add your favourite symbols to the watchlist.</li>
                  <li>Launch the Advisor for 5m/15m/30m guidance and Google Trends awareness.</li>
                  <li>Download the PDF report for instantly shareable strategy decks.</li>
                </ol>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3">
                    <strong className="block text-indigo-700">Tip:</strong>
                    Switch the focus symbol on the Portal radar to auto-refresh all analytics.
                  </div>
                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3">
                    <strong className="block text-rose-600">Need help?</strong>
                    Watch the mini walkthrough to see 3omla in action.
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={close}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-200/80"
                  >
                    Start exploring
                  </button>
                  <a
                    href="/login"
                    className="px-4 py-2 rounded-lg bg-white border border-indigo-200 text-indigo-500 shadow-sm"
                  >
                    Create account
                  </a>
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-200/60 via-sky-200/60 to-white p-6 flex flex-col gap-4 justify-center">
                <video
                  className="w-full rounded-2xl shadow-lg shadow-indigo-200/60 border border-white"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=80"
                >
                  <source src="https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4" type="video/mp4" />
                </video>
                <img
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80"
                  alt="Trading overview"
                  className="w-full rounded-2xl shadow-lg shadow-indigo-200/60 border border-white"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
