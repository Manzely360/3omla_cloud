import React from 'react';
import { motion } from 'framer-motion';
import { CpuChipIcon, BoltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const FeaturesSection = () => {
  const features = [
    {
      icon: CpuChipIcon,
      title: 'AI-Powered Analysis',
      description: 'Our advanced algorithms analyze market data 24/7 to find the best opportunities',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: BoltIcon,
      title: 'Lightning Fast',
      description: 'Execute trades in milliseconds with our high-speed infrastructure',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Safe',
      description: 'Bank-level security with multi-layer encryption and cold storage',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-900 to-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Why Choose <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">3omla</span>?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Advanced technology meets simple interface
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="group relative"
              >
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 h-full">
                  <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-400 text-lg leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              'Real-time Market Data',
              'Multi-Exchange Support',
              'Advanced Charting',
              'Risk Management',
              'Portfolio Tracking',
              'Custom Alerts',
              'Mobile Trading',
              '24/7 Support'
            ].map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10 text-center hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-sm font-medium text-white">{feature}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;



