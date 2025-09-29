import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function Blog() {
  const { t } = useI18n()

  const blogPosts = [
    {
      title: "How to Become a Crypto Millionaire with Just $100",
      excerpt: "Discover the strategies and tools that can help you turn a small investment into significant returns in the cryptocurrency market.",
      date: "2024-01-15",
      readTime: "8 min read",
      category: "Investment Strategy"
    },
    {
      title: "The Dangers of Web3 Coins: What You Need to Know",
      excerpt: "Learn about the risks associated with Web3 tokens and how to identify potential scams and rug pulls before they happen.",
      date: "2024-01-10",
      readTime: "6 min read",
      category: "Risk Management"
    },
    {
      title: "Rug Pull Development: How Scammers Operate",
      excerpt: "An in-depth look at how rug pulls are created and executed, and how to protect yourself from falling victim to these schemes.",
      date: "2024-01-05",
      readTime: "10 min read",
      category: "Security"
    },
    {
      title: "New Markets in Crypto: Opportunities and Risks",
      excerpt: "Explore emerging cryptocurrency markets and learn how to identify early opportunities while managing associated risks.",
      date: "2024-01-01",
      readTime: "7 min read",
      category: "Market Analysis"
    }
  ]

  return (
    <>
      <Favicon />
      <Head>
        <title>Blog - 3omla</title>
        <meta name="description" content="3omla Blog - Expert insights on cryptocurrency trading, market analysis, and investment strategies." />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-4" style={{
                textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff'
              }}>
                3omla Blog
              </h1>
              <p className="text-xl text-slate-300">
                Expert insights on cryptocurrency trading and market analysis
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.map((post, index) => (
                <article key={index} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full">
                      {post.category}
                    </span>
                    <span className="text-slate-400 text-sm">{post.readTime}</span>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-white mb-3 hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-slate-300 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{post.date}</span>
                    <button className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Read More →
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-8 border border-blue-500/30">
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Want to Learn More?
                </h3>
                <p className="text-slate-300 mb-6">
                  Get access to our premium trading signals and advanced analytics to enhance your crypto trading strategy.
                </p>
                <a 
                  href="/" 
                  className="inline-block px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
