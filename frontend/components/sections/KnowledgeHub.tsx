import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenIcon, ArrowRightIcon, ClockIcon, UserIcon } from '@heroicons/react/24/outline';

const KnowledgeHub = () => {
  const articles = [
    {
      id: 1,
      title: 'How to Become a Crypto Millionaire with Just $100',
      description: 'Discover the secrets of turning small investments into massive wealth through strategic crypto trading.',
      emoji: '💰',
      readTime: '8 min read',
      author: 'Crypto Expert',
      category: 'Investment Strategy',
      featured: true,
    },
    {
      id: 2,
      title: 'Web3 Dangers: The Rise of Rugpulls',
      description: 'Learn how to identify and avoid dangerous Web3 projects that could wipe out your investments.',
      emoji: '⚠️',
      readTime: '6 min read',
      author: 'Security Analyst',
      category: 'Security',
      featured: false,
    },
    {
      id: 3,
      title: 'Crypto Development Trends 2024',
      description: 'Stay updated with the latest developments in cryptocurrency technology and market trends.',
      emoji: '🚀',
      readTime: '10 min read',
      author: 'Tech Researcher',
      category: 'Technology',
      featured: false,
    },
  ];

  const categories = ['All', 'Investment Strategy', 'Security', 'Technology', 'Trading Tips', 'Market Analysis'];

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
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpenIcon className="w-8 h-8 text-blue-400" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Crypto Knowledge Hub
            </h2>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Learn from our experts and stay ahead of the market
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-4 mb-12"
        >
          {categories.map((category, index) => (
            <button
              key={category}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                index === 0
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Featured Article */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          {articles.filter(article => article.featured).map((article) => (
            <div
              key={article.id}
              className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="text-6xl">{article.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{article.readTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <UserIcon className="w-4 h-4" />
                        <span>{article.author}</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    {article.description}
                  </p>
                  <button className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 font-medium group">
                    <span>Read Article</span>
                    <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Articles Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          {articles.filter(article => !article.featured).map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
            >
              <div className="text-4xl mb-4">{article.emoji}</div>
              
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-2 py-1 bg-white/10 text-white rounded text-xs font-medium">
                  {article.category}
                </span>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <ClockIcon className="w-3 h-3" />
                  <span>{article.readTime}</span>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                {article.title}
              </h3>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                {article.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <UserIcon className="w-3 h-3" />
                  <span>{article.author}</span>
                </div>
                <button className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-medium text-sm group">
                  <span>Read</span>
                  <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/30">
            <h3 className="text-2xl font-bold text-white mb-4">
              Stay Updated with Market Insights
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get the latest crypto news, trading tips, and market analysis delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default KnowledgeHub;



