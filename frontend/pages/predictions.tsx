import { useState } from 'react'
import Head from 'next/head'
import { motion } from 'framer-motion'
import Layout from '../components/Layout'
import { PricePredictionGrid } from '../components/PricePrediction'
import DemoTrading from '../components/DemoTrading'

export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<'predictions' | 'trading'>('predictions')

  return (
    <>
      <Head>
        <title>AI Predictions & Demo Trading • 3omla</title>
        <meta name="description" content="Advanced AI-powered price predictions and demo trading with $10,000 virtual cash" />
      </Head>

      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl font-bold text-white mb-4">
                🔮 AI-Powered Predictions
              </h1>
              <p className="text-xl text-slate-300 mb-8">
                Advanced machine learning algorithms predict market movements with high accuracy
              </p>
              
              {/* Tab Navigation */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setActiveTab('predictions')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'predictions'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  📈 Price Predictions
                </button>
                <button
                  onClick={() => setActiveTab('trading')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === 'trading'
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  💰 Demo Trading
                </button>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {activeTab === 'predictions' ? (
                <PricePredictionGrid />
              ) : (
                <DemoTrading />
              )}
            </motion.div>

            {/* Features Section */}
            <motion.section
              className="mt-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-white mb-4">Why Our Predictions Work</h2>
                <p className="text-slate-300">Advanced technology meets real-world results</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-4xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold text-white mb-4">Machine Learning</h3>
                  <p className="text-slate-300">
                    Our AI analyzes millions of data points including price history, volume, sentiment, and market indicators to make accurate predictions.
                  </p>
                </motion.div>
                
                <motion.div
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-white mb-4">Real-Time Updates</h3>
                  <p className="text-slate-300">
                    Predictions update every minute based on the latest market data, ensuring you always have the most current insights.
                  </p>
                </motion.div>
                
                <motion.div
                  className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl border border-slate-700 text-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-white mb-4">Confidence Scoring</h3>
                  <p className="text-slate-300">
                    Each prediction comes with a confidence score, helping you understand the reliability of each forecast.
                  </p>
                </motion.div>
              </div>
            </motion.section>

            {/* CTA Section */}
            <motion.section
              className="mt-20 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-3xl p-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Ready to Start Trading?
                </h2>
                <p className="text-xl text-slate-300 mb-8">
                  Join thousands of traders who trust our AI predictions
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-amber-400 transition-all">
                    Start Free Trial
                  </button>
                  <button className="px-8 py-4 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-all">
                    Learn More
                  </button>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </Layout>
    </>
  )
}
