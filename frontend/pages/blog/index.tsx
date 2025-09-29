import Link from 'next/link'
import Head from 'next/head'
import { useMemo, useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { useI18n } from '../../lib/i18n'
import Favicon from '../../components/Favicon'
import { blogPosts } from '../../data/blogPosts'

export default function Blog() {
  const { t, language } = useI18n()
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

  const postsForLocale = useMemo(() => {
    return blogPosts.map((post) => ({
      slug: post.slug,
      publishDate: post.publishDate,
      heroColor: post.heroColor,
      translation: post.translations[language] ?? post.translations.en,
    }))
  }, [language])

  const heroTitleClass = isLightMode
    ? 'text-4xl font-bold text-slate-900 mb-4 drop-shadow-[0_0_22px_rgba(254,215,170,0.6)]'
    : 'text-4xl font-bold text-white mb-4 drop-shadow-[0_0_20px_rgba(14,165,233,0.65)]'

  const heroSubtitleClass = isLightMode ? 'text-xl text-slate-600' : 'text-xl text-slate-300'

  return (
    <>
      <Favicon />
      <Head>
        <title>{t('blog.meta_title', '3OMLA Blog')}</title>
        <meta
          name="description"
          content={t(
            'blog.meta_description',
            'Deep dives into lead-lag analytics, trading automation, and the 3OMLA roadmap.'
          )}
        />
      </Head>

      <Layout>
        <div
          className={`min-h-screen py-12 transition-colors ${
            isLightMode
              ? 'bg-gradient-to-br from-white via-amber-50 to-white'
              : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          }`}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-12">
              <h1 className={heroTitleClass}>3OMLA Blog</h1>
              <p className={heroSubtitleClass}>
                {t('blog.tagline', 'Expert insights on market intelligence, automation, and risk discipline')}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {postsForLocale.map(({ slug, publishDate, heroColor, translation }) => (
                <article
                  key={slug}
                  className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isLightMode
                      ? 'bg-white/90 border-slate-200 hover:shadow-[0_18px_40px_rgba(250,204,21,0.25)]'
                      : 'bg-slate-800/60 border-slate-700/60 backdrop-blur-xl hover:border-sky-400/50 hover:shadow-[0_24px_60px_rgba(14,165,233,0.25)]'
                  }`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${heroColor}`} />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`rounded-full px-3 py-1 font-medium ${
                          isLightMode
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-500/20 text-blue-200'
                        }`}
                      >
                        {translation.category}
                      </span>
                      <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>
                        {translation.readTime}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h2
                        className={`text-2xl font-semibold leading-snug transition-colors ${
                          isLightMode
                            ? 'text-slate-900 hover:text-amber-600'
                            : 'text-white hover:text-sky-300'
                        }`}
                      >
                        <Link href={`/blog/${slug}`}>{translation.title}</Link>
                      </h2>
                      <p className={isLightMode ? 'text-slate-600 leading-relaxed' : 'text-slate-300 leading-relaxed'}>
                        {translation.excerpt}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>
                        {new Date(publishDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <Link
                        href={`/blog/${slug}`}
                        className={`font-semibold transition-colors ${
                          isLightMode ? 'text-amber-600 hover:text-amber-700' : 'text-sky-300 hover:text-sky-200'
                        }`}
                      >
                        {t('blog.read_more', 'Read article')} →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-16 text-center">
              <div
                className={`rounded-3xl border p-8 shadow-lg transition-colors ${
                  isLightMode
                    ? 'bg-gradient-to-r from-amber-100/80 to-rose-100/70 border-amber-200 shadow-[0_18px_45px_rgba(253,186,116,0.35)]'
                    : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30'
                }`}
              >
                <h3 className={isLightMode ? 'text-2xl font-semibold text-slate-900 mb-4' : 'text-2xl font-semibold text-white mb-4'}>
                  {t('blog.cta_title', 'Want to go deeper?')}
                </h3>
                <p className={isLightMode ? 'mb-6 text-slate-600' : 'mb-6 text-slate-300'}>
                  {t(
                    'blog.cta_copy',
                    'Unlock premium signals, Arabic-language trading rooms, and automated execution with the full 3OMLA suite.'
                  )}
                </p>
                <Link
                  href="/trial"
                  className={`inline-block rounded-full px-8 py-3 font-semibold transition-all ${
                    isLightMode
                      ? 'bg-slate-900 text-white hover:bg-slate-700'
                      : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-[0_18px_40px_rgba(59,130,246,0.4)]'
                  }`}
                >
                  {t('blog.cta_button', 'Start free trial')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
