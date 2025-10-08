import React from 'react';
import Layout from '../components/layout/Layout';
import HeroSection from '../components/sections/HeroSection';
import CoinLaunchSection from '../components/sections/CoinLaunchSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import TradingInterface from '../components/sections/TradingInterface';
import KnowledgeHub from '../components/sections/KnowledgeHub';
import ProfitCalculator from '../components/sections/ProfitCalculator';
import LeadLagMatcher from '../components/sections/LeadLagMatcher';

const Home: React.FC = () => {
  return (
      <Layout>
      <HeroSection />
      <CoinLaunchSection />
      <FeaturesSection />
      
      {/* Live Profit Calculator Section */}
      <section className="py-20 bg-gradient-to-b from-slate-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Live Profit Calculator
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Calculate potential profits based on real market data and arbitrage opportunities
            </p>
      </div>
          <div className="max-w-4xl mx-auto">
            <ProfitCalculator />
          </div>
        </div>
      </section>

      <TradingInterface />
      
      {/* Lead-Lag Coin Matcher Section */}
      <section className="py-20 bg-gradient-to-b from-black to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Interactive Lead-Lag Coin Matcher
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Discover correlation patterns between different cryptocurrencies and optimize your trading strategy
            </p>
        </div>
          <div className="max-w-6xl mx-auto">
            <LeadLagMatcher />
            </div>
        </div>
      </section>

      <KnowledgeHub />
      </Layout>
  );
};

export default Home;