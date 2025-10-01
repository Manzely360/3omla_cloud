"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import TradingPanel from '@/components/trading/TradingPanel';

const TradingPanelPage: React.FC = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trading Panel</h1>
            <p className="text-muted-foreground mt-2">
              Execute trades, manage credentials, and monitor your positions
            </p>
          </div>
        </div>

        <TradingPanel />
      </motion.div>
    </DashboardLayout>
  );
};

export default TradingPanelPage;

