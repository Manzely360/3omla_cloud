import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import TradingDashboard from '../components/trading/TradingDashboard';
import StrategyBuilder from '../components/trading/StrategyBuilder';
import TradingHistory from '../components/trading/TradingHistory';
import TradingHistoryAnalytics from '../components/trading/TradingHistoryAnalytics';

const TradingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', name: 'Trading Dashboard', component: TradingDashboard },
    { id: 'history', name: 'History', component: TradingHistory },
    { id: 'strategies', name: 'Strategy Builder', component: StrategyBuilder },
  ];

  const renderTabContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData && activeTabData.component) {
      const Component = activeTabData.component;
      return <Component />;
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>Trading Dashboard - Crypto Lead-Lag Pattern Radar</title>
        <meta name="description" content="Advanced cryptocurrency trading dashboard with automated strategies" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Layout>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'history' ? (
            <div className="space-y-6">
              <TradingHistoryAnalytics />
              <div className="bg-white rounded-lg shadow p-4">
                <TradingHistory />
              </div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </Layout>
    </>
  );
};

export default TradingPage;
