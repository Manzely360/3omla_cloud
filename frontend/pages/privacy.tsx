import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'

export default function PrivacyPolicy() {
  const { t } = useI18n()

  return (
    <>
      <Favicon />
      <Head>
        <title>Privacy Policy - 3omla</title>
        <meta name="description" content="3omla Privacy Policy - How we collect, use, and protect your data." />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1 className="text-4xl font-bold text-white mb-8 text-center" style={{
                textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff'
              }}>
                Privacy Policy
              </h1>
              
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 space-y-6">
                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We collect information you provide directly to us, such as when you create an account, 
                      use our trading services, or contact us for support. This may include your name, email address, 
                      trading preferences, and financial information necessary for our services.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We use the information we collect to provide, maintain, and improve our trading platform, 
                      process transactions, send you technical notices and support messages, and communicate with you 
                      about products, services, and promotional offers.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">3. Information Sharing</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We do not sell, trade, or otherwise transfer your personal information to third parties without 
                      your consent, except as described in this policy. We may share your information with service 
                      providers who assist us in operating our platform.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We implement appropriate security measures to protect your personal information against 
                      unauthorized access, alteration, disclosure, or destruction. However, no method of transmission 
                      over the internet is 100% secure.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">5. Cookies and Tracking</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We use cookies and similar tracking technologies to enhance your experience on our platform, 
                      analyze usage patterns, and provide personalized content and advertisements.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights</h2>
                    <p className="text-slate-300 leading-relaxed">
                      You have the right to access, update, or delete your personal information. You may also 
                      opt out of certain communications from us. Contact us to exercise these rights.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">7. Changes to This Policy</h2>
                    <p className="text-slate-300 leading-relaxed">
                      We may update this privacy policy from time to time. We will notify you of any changes by 
                      posting the new policy on this page and updating the "Last Updated" date.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">8. Contact Us</h2>
                    <p className="text-slate-300 leading-relaxed">
                      If you have any questions about this privacy policy, please contact us at:
                      <br />
                      Email: privacy@3omla.com
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
