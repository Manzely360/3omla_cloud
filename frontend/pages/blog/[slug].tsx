import { GetStaticPaths, GetStaticProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import Favicon from '../../components/Favicon'
import { blogPosts, BlogPost } from '../../data/blogPosts'
import { useI18n } from '../../lib/i18n'

interface BlogArticleProps {
  post: BlogPost
}

const renderContent = (
  blocks: BlogPost['translations']['en']['content'],
  isLightMode: boolean
) => {
  return blocks.map((block, index) => {
    if (block.type === 'heading') {
      return (
        <h2
          key={`heading-${index}`}
          className={`text-2xl font-semibold tracking-tight ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}
        >
          {block.value as string}
        </h2>
      )
    }

    if (block.type === 'list') {
      return (
        <ul
          key={`list-${index}`}
          className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} list-disc space-y-2 pl-6`}
        >
          {(block.value as string[]).map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      )
    }

    return (
      <p
        key={`paragraph-${index}`}
        className={`${isLightMode ? 'text-slate-700' : 'text-slate-300'} leading-relaxed`}
      >
        {block.value as string}
      </p>
    )
  })
}

export default function BlogArticle({ post }: BlogArticleProps) {
  const { language, t } = useI18n()
  const [isLightMode, setIsLightMode] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const html = document.documentElement
    const detectTheme = () => setIsLightMode(html.classList.contains('theme-light'))
    detectTheme()
    const observer = new MutationObserver(detectTheme)
    observer.observe(html, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const translation = useMemo(() => {
    return post.translations[language] ?? post.translations.en
  }, [language, post.translations])

  const heroTitleClass = isLightMode
    ? 'text-4xl font-bold text-slate-900 drop-shadow-[0_0_18px_rgba(253,230,138,0.65)]'
    : 'text-4xl font-bold text-white drop-shadow-[0_0_24px_rgba(59,130,246,0.55)]'

  return (
    <>
      <Favicon />
      <Head>
        <title>{translation.title} · 3OMLA</title>
        <meta name="description" content={translation.excerpt} />
      </Head>

      <Layout>
        <article
          className={`min-h-screen py-12 transition-colors ${
            isLightMode
              ? 'bg-gradient-to-br from-white via-amber-50 to-white'
              : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
          }`}
        >
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-10">
              <Link
                href="/blog"
                className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                  isLightMode ? 'text-amber-700 hover:text-amber-800' : 'text-sky-300 hover:text-sky-200'
                }`}
              >
                ← {t('blog.back_to_list', 'Back to blog overview')}
              </Link>
            </div>

            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span
                  className={`rounded-full px-3 py-1 font-semibold uppercase tracking-wide ${
                    isLightMode ? 'bg-amber-100 text-amber-700' : 'bg-blue-500/20 text-blue-200'
                  }`}
                >
                  {translation.category}
                </span>
                <span className={isLightMode ? 'text-slate-600' : 'text-slate-300'}>
                  {translation.readTime}
                </span>
                <span className={isLightMode ? 'text-slate-500' : 'text-slate-400'}>
                  {new Date(post.publishDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <h1 className={heroTitleClass}>{translation.title}</h1>
              <p className={isLightMode ? 'text-lg text-slate-600' : 'text-lg text-slate-300'}>
                {translation.excerpt}
              </p>
            </header>

            <div
              className={`mt-10 space-y-6 rounded-3xl border p-8 shadow-lg transition-all ${
                isLightMode
                  ? 'bg-white/95 border-slate-200 shadow-[0_28px_60px_rgba(253,186,116,0.25)]'
                  : 'bg-slate-900/60 border-slate-700/60 backdrop-blur-xl'
              }`}
            >
              {renderContent(translation.content, isLightMode)}
            </div>

            <footer className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-current/20 p-6 text-sm">
              <span className={isLightMode ? 'text-slate-700' : 'text-slate-300'}>
                {t('blog.footer_note', 'Powered by live market data from Binance, KuCoin, and CoinMarketCap.')}
              </span>
              <Link
                href="/trial"
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2 font-semibold transition-all ${
                  isLightMode
                    ? 'bg-slate-900 text-white hover:bg-slate-700'
                    : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:shadow-[0_16px_40px_rgba(59,130,246,0.35)]'
                }`}
              >
                {t('blog.cta_button', 'Start free trial')} →
              </Link>
            </footer>
          </div>
        </article>
      </Layout>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: blogPosts.map((post) => ({
      params: { slug: post.slug },
    })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<BlogArticleProps> = async ({ params }) => {
  const slug = params?.slug as string
  const post = blogPosts.find((item) => item.slug === slug)

  if (!post) {
    return { notFound: true }
  }

  return {
    props: {
      post,
    },
  }
}
