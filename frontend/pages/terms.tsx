import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function Terms() {
  const { t } = useI18n()

  return (
    <>
      <Favicon />
      <Head>
        <title>Terms of Service - 3omla</title>
        <meta name="description" content="3omla Terms of Service - Read our terms and conditions for using our trading platform." />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center" style={{
                textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff'
              }}>
                Terms of Service
              </h1>
              
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 space-y-6">
                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
                    <p className="text-slate-300 leading-relaxed">
                      By accessing and using 3omla's trading intelligence platform, you accept and agree to be bound 
                      by the terms and provision of this agreement. If you do not agree to abide by the above, 
                      please do not use this service.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
                    <p className="text-slate-300 leading-relaxed">
                      3omla provides AI-powered cryptocurrency trading analysis, signals, and automated trading tools. 
                      Our platform includes real-time market data, lead-lag analysis, correlation matrices, and 
                      automated trading features designed to assist users in making informed trading decisions.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
                    <p className="text-slate-300 leading-relaxed">
                      To access certain features of our service, you must create an account. You are responsible 
                      for maintaining the confidentiality of your account credentials and for all activities that 
                      occur under your account. You agree to notify us immediately of any unauthorized use.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">4. Free Trial and Subscription</h2>
                    <p className="text-slate-300 leading-relaxed">
                      New users receive a 48-hour free trial of our premium features. After the trial period, 
                      continued access to premium features requires a paid subscription. Subscription fees are 
                      non-refundable except as required by law.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">5. Trading Risks and Disclaimers</h2>
                    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                      <p className="text-yellow-200">
                        <strong>IMPORTANT:</strong> Cryptocurrency trading involves substantial risk of loss and is not 
                        suitable for all investors. Past performance does not guarantee future results.
                      </p>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Our signals and analysis are for educational and informational purposes only and should not 
                      be considered as financial advice. You acknowledge that all trading decisions are your own 
                      responsibility and that you should conduct your own research before making any trades.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">6. Prohibited Uses</h2>
                    <p className="text-slate-300 leading-relaxed">
                      You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts. 
                      You may not violate any international, federal, provincial, or state regulations, rules, laws, 
                      or local ordinances. You may not transmit any worms, viruses, or any code of a destructive nature.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property</h2>
                    <p className="text-slate-300 leading-relaxed">
                      The service and its original content, features, and functionality are and will remain the 
                      exclusive property of 3omla and its licensors. The service is protected by copyright, trademark, 
                      and other laws.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy Policy</h2>
                    <p className="text-slate-300 leading-relaxed">
                      Your privacy is important to us. Please review our Privacy Policy, which also governs your 
                      use of the service, to understand our practices.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We may terminate or suspend your account and bar access to the service immediately, without 
                      prior notice or liability, under our sole discretion, for any reason whatsoever and without 
                      limitation, including but not limited to a breach of the Terms.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
                    <p className="text-slate-300 leading-relaxed">
                      In no event shall 3omla, nor its directors, employees, partners, agents, suppliers, or affiliates, 
                      be liable for any indirect, incidental, special, consequential, or punitive damages, including 
                      without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting 
                      from your use of the service.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law</h2>
                    <p className="text-slate-300 leading-relaxed">
                      These Terms shall be interpreted and governed by the laws of the jurisdiction in which 3omla 
                      operates, without regard to its conflict of law provisions.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                      If a revision is material, we will provide at least 30 days notice prior to any new terms 
                      taking effect.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Information</h2>
                    <p className="text-slate-300 leading-relaxed">
                      If you have any questions about these Terms of Service, please contact us at:
                      <br />
                      Email: legal@3omla.com
                      <br />
                      Address: 3omla Trading Intelligence Platform
                    </p>
                  </section>

                  <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                    <p className="text-yellow-200 text-sm">
                      <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                    </p>
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
