import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '../lib/i18n'
import Logo3omla from './Logo3omla'
import { getPoints } from '../lib/points'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

const DAILY_ORIENTATION = {
  en: [
    'I translate complex market intelligence into plain, confident steps.',
    'Let me show you how to use each workspace without guesswork.',
    'I’m powered by the on-prem LLaMA runtime so your questions stay private.',
    'We’ll connect your goals to the right 3OMLA analytics—one control at a time.'
  ],
  ar: [
    'أحول تحليلات السوق المعقدة إلى خطوات بسيطة وواثقة.',
    'سأوضح لك كيفية استخدام كل مساحة عمل بدون ارتباك.',
    'أعمل على نموذج LLaMA محلياً لتحافظ أسئلتك على الخصوصية.',
    'سأربط أهدافك بالأدوات المناسبة داخل 3OMLA خطوة بخطوة.'
  ]
}

const QUICK_ACTIONS = {
  en: [
    'Give me a tour of 3OMLA',
    'Explain the dashboard metrics',
    'How do I earn 3OMLA points?',
    'Set up risk alerts',
    'Walk me through automated strategies'
  ],
  ar: [
    'أرني جولة في منصة 3OMLA',
    'اشرح لي مؤشرات لوحة القيادة',
    'كيف أكسب نقاط 3OMLA؟',
    'إعداد تنبيهات المخاطر',
    'دلّني على استراتيجيات التداول الآلي'
  ]
}

const RESPONSES = {
  en: {
    onboarding:
      'Start with the dashboard. Pin your favourite symbols, then open the Lead-Lag map to see who moves first. Finally, enable the Advisor to get timed PDF briefs.',
    points:
      '3OMLA points come from daily challenges and platform milestones. Play the game once every 24 hours, earn points, and redeem them under Rewards for BTC airdrops.',
    rewards:
      'Open the Rewards page to see the current tiers. Once you hit a threshold, contact support with your verified wallet and we release the airdrop within 48 hours.',
    signals:
      'Signals live inside the Analytics > Lead-Lag list. Filter by interval, then open the pair to see projected follow-through, hit rate, and companion charts.',
    contact:
      'Need human help? Open Contact, choose a subject, and include screenshots. We respond within 24 hours—urgent issues should tag “URGENT” in the subject.',
    default:
      'Let me gather the right panel. Could you add a bit more detail about what you want to accomplish?'
  },
  ar: {
    onboarding:
      'ابدأ بلوحة القيادة: ثبّت الرموز المفضلة ثم افتح خريطة القيادة والتأخر لمعرفة من يتحرك أولاً. بعد ذلك فعّل المستشار لتحصل على تقارير PDF موقّتة.',
    points:
      'تحصل على نقاط 3OMLA من تحدي اللعبة اليومي ومن إنجازات المنصة. العب مرة كل 24 ساعة، اجمع النقاط، ثم استبدلها في صفحة المكافآت للحصول على إسقاطات بيتكوين.',
    rewards:
      'افتح صفحة المكافآت لترى المستويات الحالية. عند الوصول إلى الحد المطلوب راسل الدعم بمحفظتك الموثّقة وسيتم إرسال المكافأة خلال 48 ساعة.',
    signals:
      'تجد الإشارات داخل التحليلات > قائمة القيادة والتأخر. صفِّ حسب الإطار الزمني ثم افتح الزوج لترى التوقعات ونسبة الإصابة والمخططات المصاحبة.',
    contact:
      'تحتاج مساعدة بشرية؟ افتح صفحة الاتصال، اختر الموضوع، وأرفق لقطات الشاشة. نرد خلال 24 ساعة، وارجو وضع كلمة “عاجل” للحالات الطارئة.',
    default:
      'دعني أجمع اللوحة المناسبة. هل يمكنك توضيح المطلوب أكثر؟'
  }
}

function detectIntent(message: string) {
  const normalized = message.toLowerCase()
  if (/reward|redeem|airdrop|مكاف|نقاط/.test(normalized)) return 'points'
  if (/signal|lead|lag|إشارة|قيادة/.test(normalized)) return 'signals'
  if (/reward|airdrop|مكافأة|إسقاط/.test(normalized)) return 'rewards'
  if (/contact|support|help|دعم|تواصل/.test(normalized)) return 'contact'
  if (/start|tour|explore|begin|جولة|ابدأ/.test(normalized)) return 'onboarding'
  return 'default'
}

const DAILY_REWARD = 5000

const SYMBOL_BLOCKLIST = new Set(['API', 'HTTP', 'HTTPS', 'REST', 'JSON', 'USDT', 'USD'])

const normaliseSymbol = (raw: string): string | null => {
  const cleaned = raw.replace(/[^A-Z]/gi, '').toUpperCase()
  if (!cleaned || SYMBOL_BLOCKLIST.has(cleaned)) return null
  if (cleaned.endsWith('USDT') || cleaned.endsWith('USD')) {
    return cleaned
  }
  if (cleaned.length >= 3 && cleaned.length <= 5) {
    return `${cleaned}USDT`
  }
  return null
}

const extractSymbol = (message: string): string | null => {
  const candidates = message.toUpperCase().match(/[A-Z]{3,6}(?:USDT|USD)?/g)
  if (!candidates) return null
  for (const candidate of candidates) {
    const normalised = normaliseSymbol(candidate)
    if (normalised) return normalised
  }
  return null
}

const formatAdvisorSummary = (data: any, language: 'en' | 'ar'): string => {
  const symbol = data?.symbol ?? 'ASSET'
  const snap15 = data?.snapshots?.['15m'] || data?.snapshots?.['30m'] || {}
  const price = typeof snap15.close === 'number' ? snap15.close : null
  const change = typeof snap15.change_pct === 'number' ? snap15.change_pct * 100 : null
  const recommendation = data?.advice?.recommendation ?? 'hold'
  const confidence = typeof data?.advice?.confidence === 'number' ? Math.round(data.advice.confidence * 100) : null
  const companion = Array.isArray(data?.companions) && data.companions.length > 0 ? data.companions[0] : null

  if (language === 'ar') {
    const lines = [
      `${symbol}: السعر الحالي ${price ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'غير متاح'}`,
      change !== null ? `تغير 15 دقيقة: ${change.toFixed(2)}%` : 'لا توجد بيانات تغير متاحة',
      `التوصية: ${recommendation.toUpperCase()}${confidence !== null ? ` · الثقة ${confidence}%` : ''}`,
    ]
    if (companion?.best_lag) {
      lines.push(
        `المرافق: ${companion.leader_symbol} يسبق ${companion.follower_symbol} بمقدار ${Math.abs(companion.best_lag)} شموع`
      )
    }
    return lines.join(' \n')
  }

  const lines = [
    `${symbol}: current price ${price ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'unavailable'}`,
    change !== null ? `15m change: ${change.toFixed(2)}%` : 'No short-term change data available.',
    `Recommendation: ${recommendation.toUpperCase()}${confidence !== null ? ` · confidence ${confidence}%` : ''}`,
  ]
  if (companion?.best_lag) {
    lines.push(
      `Lead-lag: ${companion.leader_symbol} leads ${companion.follower_symbol} by ${Math.abs(companion.best_lag)} bars (corr ${
        companion.best_abs_corr ? companion.best_abs_corr.toFixed(2) : 'n/a'
      }).`
    )
  }
  return lines.join(' \n')
}

const CryptoLogist = () => {
  const { t, language } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showHover, setShowHover] = useState(false)
  const [points, setPoints] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const insights = useMemo(() => DAILY_ORIENTATION[language] || DAILY_ORIENTATION.en, [language])
  const quickActions = useMemo(() => QUICK_ACTIONS[language] || QUICK_ACTIONS.en, [language])

  useEffect(() => {
    const intro = `${t('assistant.label', 'Dr. Cryptologist')} — ${insights[0]}`
    setMessages([
      {
        id: 'intro',
        text: intro,
        isUser: false,
        timestamp: new Date()
      }
    ])
  }, [language, t, insights])

  useEffect(() => {
    setPoints(getPoints())
    const handler = (event: Event) => {
      if ('detail' in event) {
        setPoints(Number((event as CustomEvent).detail) || 0)
      } else {
        setPoints(getPoints())
      }
    }
    window.addEventListener('3omla:points', handler)
    return () => window.removeEventListener('3omla:points', handler)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim()
    if (!trimmed) return

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: trimmed,
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    const symbol = extractSymbol(trimmed)
    if (symbol) {
      try {
        await new Promise(resolve => setTimeout(resolve, 400))
        const params = new URLSearchParams({ symbol })
        const response = await fetch(`/api/v1/advisor/insights?${params.toString()}`)
        if (!response.ok) {
          throw new Error(`advisor request failed (${response.status})`)
        }
        const payload = await response.json()
        const summary = formatAdvisorSummary(payload, language as 'en' | 'ar')
        const aiMessage: Message = {
          id: `${Date.now()}-advisor`,
          text: summary,
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        setIsTyping(false)
        return
      } catch (error) {
        const fallback = language === 'ar'
          ? 'تعذّر جلب بيانات المستشار الآن، سأستخدم الإرشادات العامة بدلاً من ذلك.'
          : 'I could not reach the advisor service right now, falling back to the playbook.'
        setMessages(prev => [
          ...prev,
          {
            id: `${Date.now()}-advisor-fallback`,
            text: fallback,
            isUser: false,
            timestamp: new Date()
          }
        ])
      }
    }

    setTimeout(() => {
      const intent = detectIntent(trimmed)
      const responses = RESPONSES[language as 'en' | 'ar'] || RESPONSES.en
      const text = responses[intent as keyof typeof responses] || responses.default
      const aiMessage: Message = {
        id: `${Date.now()}-mentor`,
        text,
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 900)
  }

  const handleSubmit = () => {
    void sendMessage(inputText)
  }
  const handleQuickAction = (action: string) => {
    void sendMessage(action)
  }

  return (
    <>
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.8 }}
      >
        <motion.button
          className="relative bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-600 text-white p-4 rounded-full.shadow-[0_18px_40px_rgba(14,165,233,0.45)] hover:shadow-[0_24px_55px_rgba(59,130,246,0.55)] transition-all backdrop-blur"
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setShowHover(true)}
          onMouseLeave={() => setShowHover(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          aria-label={t('assistant.label', 'Dr. Cryptologist')}
        >
          <div className="text-2xl drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">🧑‍⚕️</div>
          {showHover && (
            <motion.div
              className="absolute -top-12 right-0 bg-slate-900/95 border border-cyan-400/40 text-white px-4 py-2 rounded-lg text-sm shadow-lg whitespace-nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {t('assistant.tagline', 'Guiding you through 3OMLA step-by-step')}
            </motion.div>
          )}
        </motion.button>
      </motion.div>

      <div className="fixed bottom-6 right-28 z-40">
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-purple-600/30 blur-xl opacity-80" />
          <div className="relative flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-slate-900/85 px-4 py-2 shadow-[0_12px_30px_rgba(8,47,73,0.55)] backdrop-blur">
            <Logo3omla variant="icon" size="sm" />
            <div className="leading-tight text-[11px] uppercase tracking-[0.28em] text-slate-300">
              <span className="block text-sky-300 font-semibold normal-case tracking-[0.08em] text-sm">{t('assistant.badge', 'AI Guidance · Powered by LLaMA on Docker')}</span>
              {t('points.balance_label', 'Current 3OMLA points')}: {points.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 rounded-3xl border border-cyan-400/20 w-full max-w-md h-[620px] flex flex-col shadow-[0_25px_60px_rgba(11,36,72,0.75)]"
              initial={{ scale: 0.82, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.82, opacity: 0 }}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/60 to-blue-600/80 text-2xl shadow-inner shadow-blue-900/60">🧑‍⚕️</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t('assistant.label', 'Dr. Cryptologist')}</h3>
                    <p className="text-xs text-sky-300">{t('assistant.tagline', 'Guiding you through 3OMLA step-by-step')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 text-slate-400 hover:text-white hover:border-cyan-400 transition-colors"
                  aria-label={t('common.close', 'Close')}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {messages.map(message => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-900/40'
                          : 'bg-slate-800/80 text-slate-100 border border-slate-700/60'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.3em] opacity-60">
                        {message.timestamp.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    className="flex justify-start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center gap-2 rounded-2xl bg-slate-800/70 px-4 py-3 text-slate-200">
                      <span className="text-lg">🧠</span>
                      <div className="flex items-center gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.12s' }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: '0.24s' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-5 border-t border-slate-700/60">
                <p className="mb-3 text-xs text-slate-400">{t('games.play_button', 'Play now')}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => handleQuickAction(action)}
                      className="group flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-xs text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
                    >
                      <span className="text-left leading-snug">{action}</span>
                      <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">↗</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={event => setInputText(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && !event.shiftKey && (event.preventDefault(), handleSubmit())}
                    placeholder={t('assistant.input_placeholder', 'Ask about 3OMLA features, analytics, or onboarding...')}
                    className="flex-1 rounded-2xl border border-slate-700/60 bg-slate-800/70 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputText.trim()}
                    className="rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(59,130,246,0.45)] transition hover:shadow-[0_18px_38px_rgba(14,165,233,0.55)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {t('common.send', 'Send')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default CryptoLogist
