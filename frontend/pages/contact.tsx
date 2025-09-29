import Head from 'next/head'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'
import Favicon from '../components/Favicon'
import { useState } from 'react'

const SUBJECT_OPTIONS = ['general', 'technical', 'billing', 'feature', 'bug', 'partnership'] as const

type Subject = (typeof SUBJECT_OPTIONS)[number]

export default function Contact() {
  const { t, language } = useI18n()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '' as Subject | '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: wire to backend contact endpoint or CRM webhook
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <>
      <Favicon />
      <Head>
        <title>{t('contact.title', 'Contact our team')} - 3OMLA</title>
        <meta name="description" content={t('contact.subtitle', 'We are here to help you understand and scale with 3OMLA')} />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
              <h1
                className="text-4xl font-bold text-white mb-8 text-center"
                style={{ textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff' }}
              >
                {t('contact.title', 'Contact our team')}
              </h1>

              {submitted ? (
                <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-6 text-center text-green-200">
                  {t('contact.thanks', 'Thank you! Our team will get back to you within 24 hours.')}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-6">{t('contact.form_title', 'Send us a message')}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                          {t('contact.form.name', 'Name')}
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={t('contact.form.name_placeholder', 'Your full name')}
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                          {t('contact.form.email', 'Email')}
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                          {t('contact.form.subject', 'Subject')}
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">{t('contact.form.subject_placeholder', 'Select a subject')}</option>
                          {SUBJECT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {t(`contact.subjects.${option}`, option)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                          {t('contact.form.message', 'Message')}
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={6}
                          className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder={t('contact.form.message_placeholder', 'Tell us how we can help you...')}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                      >
                        {t('contact.form.submit', 'Send message')}
                      </button>
                    </form>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-6">{t('contact.channels_title', 'Get in touch')}</h2>
                    <div className="space-y-6">
                      <div className="bg-slate-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-3">{t('contact.support', 'Support')}</h3>
                        <p className="text-slate-300 mb-2">{t('contact.support_copy', 'General questions and account help')}</p>
                        <p className="text-blue-400">support@3omla.com</p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-3">{t('contact.technical', 'Technical issues')}</h3>
                        <p className="text-slate-300 mb-2">{t('contact.technical_copy', 'Found a bug or integration issue?')}</p>
                        <p className="text-blue-400">tech@3omla.com</p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-3">{t('contact.business', 'Business inquiries')}</h3>
                        <p className="text-slate-300 mb-2">{t('contact.business_copy', 'Partnerships, affiliates, and media')}</p>
                        <p className="text-blue-400">business@3omla.com</p>
                      </div>

                      <div className="bg-slate-700/50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-white mb-3">{t('contact.response', 'Response time')}</h3>
                        <p className="text-slate-300">
                          {t('contact.response_copy', 'We typically respond within 24 hours. Mention “URGENT” for priority technical issues.')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
                      <h3 className="text-lg font-medium text-white mb-3">{t('contact.instant', 'Need instant help?')}</h3>
                      <p className="text-slate-300 mb-4">
                        {t('contact.instant_copy', 'Ask the Cryptologist AI doctor for instant guidance.')}
                      </p>
                      <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                        {t('contact.assistant_cta', 'Chat with the Cryptologist')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  )
}
