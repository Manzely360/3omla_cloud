import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function About() {
  const { t } = useI18n()

  return (
    <>
      <Favicon />
      <Head>
        <title>{t('about.title', 'Why 3OMLA')} - 3OMLA</title>
        <meta
          name="description"
          content={t('about.mission_copy', 'Deliver real-time crypto intelligence that empowers traders everywhere.')}
        />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1
                className="text-4xl font-bold text-white mb-8 text-center"
                style={{ textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff' }}
              >
                {t('about.title', 'Why 3OMLA')}
              </h1>

              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">{t('about.mission', 'Our mission')}</h2>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    {t(
                      'about.mission_copy',
                      'Deliver real-time crypto intelligence that empowers traders everywhere.'
                    )}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">{t('about.what_we_do', 'What we do')}</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">{t('about.ai_analysis_title', 'AI-powered analysis')}</h3>
                      <p className="text-slate-300">
                        {t(
                          'about.ai_analysis_copy',
                          'Our algorithms study multi-exchange data to surface patterns, correlations, and actionable signals in real time.'
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">{t('about.lead_lag_title', 'Lead-lag detection')}</h3>
                      <p className="text-slate-300">
                        {t(
                          'about.lead_lag_copy',
                          'We reveal which assets move first so you can anticipate rotations and time entries with confidence.'
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">{t('about.auto_trading_title', 'Automated execution')}</h3>
                      <p className="text-slate-300">
                        {t(
                          'about.auto_trading_copy',
                          'Deploy AI-guided strategies with configurable safety rails and position sizing controls.'
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-medium text-white mb-3">{t('about.data_title', 'Multi-exchange data')}</h3>
                      <p className="text-slate-300">
                        {t(
                          'about.data_copy',
                          'Coverage across major spot and derivatives venues keeps the intelligence comprehensive and timely.'
                        )}
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">{t('about.technology_title', 'Our technology')}</h2>
                  <p className="text-slate-300 leading-relaxed">
                    {t(
                      'about.technology_copy',
                      '3OMLA blends machine learning, statistical finance, and streaming ingestion to produce precise insights from millions of data points each second.'
                    )}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">{t('about.difference_title', 'The 3OMLA difference')}</h2>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((number) => {
                      const titleKey = `about.feature_${number}_title`
                      const copyKey = `about.feature_${number}_body`
                      return (
                        <div key={number} className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white font-bold">{number}</span>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-white mb-2">{t(titleKey, '')}</h3>
                            <p className="text-slate-300">{t(copyKey, '')}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">{t('about.commitment_title', 'Our commitment')}</h2>
                  <p className="text-slate-300 leading-relaxed">
                    {t(
                      'about.commitment_copy',
                      'We focus on transparency, security, and trader success—balancing power with approachability for every skill level.'
                    )}
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">{t('about.cta_title', 'Join the future')}</h2>
                  <p className="text-slate-300 leading-relaxed mb-6">
                    {t('about.cta_copy', 'Start your 48-hour free trial and experience how 3OMLA transforms trading decisions.')}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="/trial"
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      {t('about.cta_button', 'Start free trial')}
                    </a>
                    <a
                      href="/contact"
                      className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      {t('contact.title', 'Contact our team')}
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
