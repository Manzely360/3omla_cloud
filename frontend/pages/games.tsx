import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import { addPoints, canPlayToday, getPoints, msUntilNextPlay, recordPlay } from '../lib/points'
import Logo3omla from '../components/Logo3omla'

const DAILY_REWARD = 5000

interface Scenario {
  id: string
  options: string[]
  correct: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'breakout',
    options: ['aggressive_entry', 'short_setup', 'stay_flat', 'reduce_position'],
    correct: 'aggressive_entry'
  },
  {
    id: 'newsflash',
    options: ['tighten_stops', 'buy_the_news', 'ignore_signal', 'double_position'],
    correct: 'tighten_stops'
  },
  {
    id: 'oversold_flush',
    options: ['scale_in', 'chase_breakout', 'set_alerts', 'panic_sell'],
    correct: 'scale_in'
  }
]

function formatRemain(ms: number, language: string) {
  if (ms <= 0) return language === 'ar' ? '0 ساعة' : '0h'
  const hours = Math.floor(ms / 1000 / 60 / 60)
  const minutes = Math.floor((ms / 1000 / 60) % 60)
  if (language === 'ar') {
    return `${hours} ساعة ${minutes} دقيقة`
  }
  return `${hours}h ${minutes}m`
}

export default function GamesPage() {
  const { t, language, dictionary } = useI18n()
  const [scenario] = useState(() => SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)])
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<'win' | 'loss' | null>(null)
  const [points, setPoints] = useState(0)
  const [canPlay, setCanPlay] = useState(true)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    setPoints(getPoints())
    const playable = canPlayToday()
    setCanPlay(playable)
    if (!playable) {
      setCooldown(msUntilNextPlay())
    }

    const listener = (event: Event) => {
      if ('detail' in event) {
        setPoints(Number((event as CustomEvent).detail) || 0)
      } else {
        setPoints(getPoints())
      }
    }
    window.addEventListener('3omla:points', listener)
    return () => window.removeEventListener('3omla:points', listener)
  }, [])

  useEffect(() => {
    if (!canPlay) {
      const interval = setInterval(() => {
        const remaining = msUntilNextPlay()
        setCooldown(remaining)
        if (remaining <= 0) {
          setCanPlay(true)
          clearInterval(interval)
        }
      }, 60_000)
      return () => clearInterval(interval)
    }
  }, [canPlay])

  const questionKey = `games.scenarios.${scenario.id}.question`
  const explanationKey = `games.scenarios.${scenario.id}.explanation`

  const options = useMemo(() => {
    return scenario.options.map((option) => ({
      value: option,
      label: t(`games.scenarios.${scenario.id}.answers.${option}`, option)
    }))
  }, [scenario, t])

  const play = (option: string) => {
    if (!canPlay || selected) return
    setSelected(option)
    const win = option === scenario.correct
    setResult(win ? 'win' : 'loss')
    recordPlay()
    setCanPlay(false)
    setCooldown(msUntilNextPlay())
    if (win) {
      const total = addPoints(DAILY_REWARD)
      setPoints(total)
    }
  }

  const reset = () => {
    setSelected(null)
    setResult(null)
  }

  const remainingLabel = useMemo(() => formatRemain(cooldown, language), [cooldown, language])

  return (
    <>
      <Head>
        <title>{t('games.title', '3OMLA Daily Challenge')}</title>
        <meta name="description" content={t('games.subtitle', 'Answer today’s scenario to earn 3OMLA points')} />
      </Head>

      <Layout>
        <div className="min-h-screen.bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-5xl mx-auto px-6 space-y-8">
            <div className="bg-slate-900/50 border border-slate-700/60 rounded-3xl p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6">
              <div className="flex items-center gap-4">
                <Logo3omla variant="icon" size="lg" />
                <div>
                  <p className="text-sky-300 text-sm uppercase tracking-[0.3em]">
                    {t('points.balance_label', 'Current 3OMLA points')}
                  </p>
                  <p className="text-4xl font-black text-white">{points.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
              </div>
              <div className="md:ml-auto flex flex-col justify-center text-sm text-slate-300">
                <p>{t('points.earn_more', 'Earn more by completing the daily game')}</p>
                <Link href="/rewards" className="mt-2 inline-flex items-center gap-2 text-sky-300 hover:text-white">
                  {t('points.rewards_cta', 'View rewards')} →
                </Link>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-8 shadow-xl shadow-slate-900/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">{t('games.title', '3OMLA Daily Challenge')}</h1>
                  <p className="text-slate-300">{t('games.subtitle', 'Answer today’s scenario to earn 3OMLA points')}</p>
                </div>
                <div className="text-right text-slate-400">
                  <p className="uppercase text-xs tracking-[0.3em]">{t('games.points', 'Points earned')}</p>
                  <p className="text-xl font-semibold text-sky-300">+{DAILY_REWARD.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                </div>
              </div>

              {!canPlay && !selected && (
                <div className="mb-6 rounded-2xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-slate-300">
                  {t('games.come_back', 'Thank you! Come back in 24 hours to win more 3OMLA points!')}<br />
                  <span className="text-sky-300">{remainingLabel}</span>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500 mb-2">
                    {t('games.question_intro', 'Today’s question')}
                  </p>
                  <h2 className="text-2xl font-semibold text-white leading-relaxed">
                    {t(questionKey, '')}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {options.map(({ value, label }) => {
                    const isSelected = selected === value
                    const isCorrect = result === 'win' && value === scenario.correct
                    const isWrongChoice = result === 'loss' && isSelected
                    return (
                      <button
                        key={value}
                        onClick={() => play(value)}
                        disabled={!!selected || !canPlay}
                        className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                          isCorrect
                            ? 'border-green-400 bg-green-500/10 text-green-200'
                            : isWrongChoice
                            ? 'border-red-400 bg-red-500/10 text-red-200'
                            : 'border-slate-600 bg-slate-800/60 hover:border-sky-400 hover:bg-slate-700'
                        } ${selected ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className="block font-semibold text-lg">{label}</span>
                      </button>
                    )
                  })}
                </div>

                {result && (
                  <div className="rounded-2xl border border-slate-600 bg-slate-900/60 p-6 space-y-2">
                    <p className={`text-xl font-bold ${result === 'win' ? 'text-green-300' : 'text-red-300'}`}>
                      {result === 'win'
                        ? t('games.correct', 'Great call!')
                        : t('games.incorrect', 'Not quite. Keep studying the flows!')}
                    </p>
                    <p className="text-slate-300">
                      {t(explanationKey, '')}
                    </p>
                    {result === 'win' && (
                      <p className="text-sky-300 font-semibold">
                        {t('games.earned', 'You earned')} {DAILY_REWARD.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')} {t('games.points_suffix', 'points')}.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 pt-3">
                      <button
                        onClick={reset}
                        className="px-4 py-2 rounded-xl border border-slate-600 text-slate-200 hover:border-slate-400"
                      >
                        {t('games.try_again', 'Try again tomorrow')}
                      </button>
                      <Link
                        href="/rewards"
                        className="px-4 py-2 rounded-xl bg-sky-500/20 border border-sky-400 text-sky-200 hover:bg-sky-500/30"
                      >
                        {t('points.rewards_cta', 'View rewards')}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
