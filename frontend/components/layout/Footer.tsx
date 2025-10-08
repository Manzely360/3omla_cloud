import React from 'react';
import Image from 'next/image';
import { Twitter, MessageCircle, Users } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { name: 'About Us', href: '#about' },
    { name: 'Contact Us', href: '#contact' },
    { name: 'Privacy Policy', href: '#privacy' },
    { name: 'Terms of Service', href: '#terms' },
  ];

  const resources = [
    { name: 'Blog', href: '#blog' },
    { name: 'Help Center', href: '#help' },
    { name: 'API Documentation', href: '/docs' },
  ];

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Discord', href: '#', icon: Users },
    { name: 'Telegram', href: '#', icon: MessageCircle },
  ];

  return (
    <footer className="bg-black/40 backdrop-blur-md border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image
                src="/3omla-logomark.png"
                alt="3OMLA"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                3omla
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The ultimate AI-powered crypto trading platform for modern investors.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((resource) => (
                <li key={resource.name}>
                  <a
                    href={resource.href}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {resource.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-white/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © 2024 3omla. All rights reserved. | Privacy Policy | Terms of Service
            </div>
            <div className="text-sm text-gray-400">
              The future of trading intelligence – AI-powered crypto analysis built for modern investors
            </div>
          </div>
        </div>

        {/* Trading Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-2">TRADING DISCLAIMER:</p>
              <p className="mb-2">
                Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. 
                Past performance does not guarantee future results. The value of cryptocurrencies can go down as 
                well as up, and you may lose some or all of your invested capital.
              </p>
              <p className="font-semibold">DYOR (Do Your Own Research):</p>
              <p>
                Always conduct your own research and consider consulting with a financial advisor before making 
                investment decisions. Never invest more than you can afford to lose.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
