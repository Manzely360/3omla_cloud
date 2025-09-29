import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function Help() {
  const { t } = useI18n()

  return (
    <>
      <Favicon />
      <Head>
        <title>Help Center - 3omla</title>
        <meta name="description" content="3omla Help Center - Get support and learn how to use our trading platform." />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center" style={{
                textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff'
              }}>
                Help Center
              </h1>
              
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Getting Started</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">How do I create an account?</h3>
                      <p className="text-slate-300">
                        Click the "Sign Up" button on our homepage and follow the registration process. 
                        You'll need to provide your email address and create a secure password.
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">What is the 48-hour free trial?</h3>
                      <p className="text-slate-300">
                        New users get 48 hours of free access to all premium features including live signals, 
                        advanced analytics, and automated trading tools.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Trading Features</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">How do I use the profit calculator?</h3>
                      <p className="text-slate-300">
                        Enter your investment budget in the calculator on the homepage. Our AI will analyze 
                        current market conditions and show you potential profit scenarios based on our signals.
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">What are lead-lag signals?</h3>
                      <p className="text-slate-300">
                        Lead-lag signals identify when one cryptocurrency typically moves before another, 
                        helping you predict price movements and time your trades more effectively.
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">How does auto-trading work?</h3>
                      <p className="text-slate-300">
                        Our blue pill auto-trading feature uses AI to automatically execute trades based on 
                        our signals. You can set risk parameters and let the system trade for you.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Account & Billing</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">How do I upgrade to VIP?</h3>
                      <p className="text-slate-300">
                        Click "Try VIP Now!" in the header dropdown or visit your account settings. 
                        VIP members get access to premium signals, priority support, and advanced features.
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">What payment methods do you accept?</h3>
                      <p className="text-slate-300">
                        We accept major credit cards, PayPal, and cryptocurrency payments including Bitcoin, 
                        Ethereum, and other major cryptocurrencies.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Technical Support</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">How do I contact support?</h3>
                      <p className="text-slate-300">
                        You can reach our support team through the contact form, email us at support@3omla.com, 
                        or use the Cryptologist AI doctor for instant help.
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">Who is the Cryptologist?</h3>
                      <p className="text-slate-300">
                        The Cryptologist is our AI-powered doctor who can help you navigate the platform, 
                        explain features in plain language, and provide instant support 24/7.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mb-4">Safety & Security</h2>
                  <div className="space-y-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">Is my data secure?</h3>
                      <p className="text-slate-300">
                        Yes, we use bank-level encryption and security measures to protect your personal 
                        and financial information. We never share your data with third parties.
                      </p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-white mb-2">What about trading risks?</h3>
                      <p className="text-slate-300">
                        Cryptocurrency trading involves substantial risk. Our signals are for educational 
                        purposes and should not be considered financial advice. Always do your own research.
                      </p>
                    </div>
                  </div>
                </section>

                <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                  <h3 className="text-xl font-semibold text-white mb-3">Still Need Help?</h3>
                  <p className="text-slate-300 mb-4">
                    Can't find what you're looking for? Our support team is here to help.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a 
                      href="/contact" 
                      className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      Contact Support
                    </a>
                    <a 
                      href="mailto:support@3omla.com" 
                      className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                    >
                      Email Us
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
