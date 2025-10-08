import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { WalletIcon, SparklesIcon } from '@heroicons/react/24/outline';

const CoinLaunchSection = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleConnectWallet = () => {
    setWalletConnected(true);
    // Here you would integrate with actual wallet connection logic
    console.log('Connecting wallet...');
  };

  return (
    <section className="relative py-20 bg-gradient-to-b from-black via-slate-900 to-black overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <Image
              src="/3omla-text-logo.svg"
              alt="3OMLA"
              width={400}
              height={120}
              className="mx-auto h-20 w-auto"
            />
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Official 3OMLA COIN
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-white"
            >
              LAUNCHING NOW
            </motion.span>
          </h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl text-gray-300 mb-4"
          >
            EXCLUSIVELY ON SOLANA & PARTNERS
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-2 text-lg text-blue-400"
          >
            <SparklesIcon className="w-6 h-6" />
            <span>Stake SOL to earn 3OMLA tokens</span>
            <SparklesIcon className="w-6 h-6" />
          </motion.div>
        </motion.div>

        {/* Animated Coin Creation */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          viewport={{ once: true }}
          className="relative mb-16 flex justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0, rotateY: -180 }}
            whileInView={{ 
              opacity: 1, 
              scale: 1, 
              rotateY: 0,
              transition: { 
                duration: 1.5,
                type: "spring",
                stiffness: 100
              }
            }}
            viewport={{ once: true }}
            animate={{
              scale: isAnimating ? 1.1 : 1,
              rotateY: isAnimating ? 360 : 0,
              boxShadow: isAnimating 
                ? "0 0 50px rgba(0, 255, 255, 0.5)" 
                : "0 0 20px rgba(0, 255, 255, 0.2)"
            }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <Image
                src="/3omla-coin-logo.svg"
                alt="$3OMLA Token"
                fill
                className="object-contain"
              />
              
              {/* Glow effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isAnimating ? 1 : 0.3 }}
                className="absolute inset-0 bg-cyan-400/20 rounded-full blur-xl"
              />
            </div>
            
            {/* Token indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              viewport={{ once: true }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-lg font-bold">
                $3OMLA
              </div>
            </motion.div>
          </motion.div>
          
          {/* Creation animation effects */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-96 bg-gradient-to-b from-transparent via-cyan-400 to-transparent" />
          </motion.div>
        </motion.div>

        {/* Connect Wallet Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Stake?
            </h3>
            <p className="text-gray-300 mb-8">
              Connect your wallet and start staking SOL to earn $3OMLA tokens
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleConnectWallet}
              className={`group relative px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                walletConnected
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-2xl'
              }`}
            >
              <span className="flex items-center justify-center space-x-3">
                <WalletIcon className="w-6 h-6" />
                <span>
                  {walletConnected ? 'Wallet Connected!' : 'Connect Wallet'}
                </span>
              </span>
              
              {!walletConnected && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
            </motion.button>
            
            {walletConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
              >
                <p className="text-green-400 font-medium">
                  🎉 Wallet connected! You can now stake SOL for $3OMLA tokens.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-green-400 mb-2">100%</div>
              <div className="text-gray-300">Secure on Solana</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-300">Staking Rewards</div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-purple-400 mb-2">0%</div>
              <div className="text-gray-300">Trading Fees</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CoinLaunchSection;
