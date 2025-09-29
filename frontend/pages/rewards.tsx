import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Logo3omla from '../components/Logo3omla'
import { getPoints } from '../lib/points'
import { useEffect, useState } from 'react'

export default function RewardsPage() {
  const { t, dictionary, language } = useI18n()
  const [points, setPoints] = useState(0)

  useEffect(() => {
    setPoints(getPoints())
    const handler = (event: Event) => {
      setPoints('detail' in event ? Number((event as CustomEvent).detail) || 0 : getPoints())
    }
    window.addEventListener('3omla:points', handler)
    return () => window.removeEventListener('3omla:points', handler)
  }, [])

  const tiers = dictionary.rewards?.tiers || []

  return (
    <>
      <Head>
        <title>{t('rewards.title', 'Redeem 3OMLA points')}</title>
        <meta name="description" content={t('rewards.subtitle', 'Trade your points for crypto airdrops and upgrades')} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-4xl mx-auto px-6 space-y-8">
            <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-8 shadow-xl shadow-slate-900/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{t('rewards.title', 'Redeem 3OMLA points')}</h1>
                  <p className="text-slate-300">{t('rewards.subtitle', 'Trade your points for crypto airdrops and upgrades')}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-700 px-4 py-3 rounded-2xl">
                  <Logo3omla variant="icon" size="sm" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{t('points.balance_label', 'Current 3OMLA points')}</p>
                    <p className="text-2xl font-bold text-white">{points.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-8">
              <table className="w-full text-sm text-slate-200">
                <thead>
                  <tr className="text-left text-slate-400 uppercase tracking-[0.3em] text-xs">
                    <th className="pb-4">{t('rewards.table.reward', 'Reward')}</th>
                    <th className="pb-4">{t('rewards.table.cost', 'Required points')}</th>
                    <th className="pb-4">{t('rewards.table.value', 'Value')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {tiers.map((tier: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-700/40">
                      <td className="py-4 font-semibold text-white">{tier.label}</td>
                      <td className="py-4">{tier.points}</td>
                      <td className="py-4">{tier.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-6 text-sm text-slate-400">{t('rewards.note', 'Rewards are processed within 48 hours to the verified wallet on file.')}</p>
              <p className="mt-2 text-sm text-slate-300">
                {t('rewards.cta', 'Contact support to redeem')}
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
