import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Language types
type Language = 'en' | 'ar';

// Theme types
type Theme = 'dark' | 'light';

// App context type
interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  user: any;
  setUser: (user: any) => void;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Language translations
const translations = {
  en: {
    // Header
    live: 'LIVE',
    account: 'Account',
    startFreeTrial: 'Start Free Trial',
    viewLiveDemo: 'View Live Demo',
    
    // Hero Section
    heroTitle: 'AI trading copilot',
    heroSubtitle: 'for serious crypto investors',
    heroDescription: 'Live buy & sell signals, exchange comparisons, and guidance in one immersive dashboard.',
    trustedBy: 'Trusted by traders worldwide',
    
    // Features
    whyChoose: 'Why Choose',
    aiPowered: 'AI-Powered Analysis',
    aiPoweredDesc: 'Our advanced algorithms analyze market data 24/7 to find the best opportunities',
    lightningFast: 'Lightning Fast',
    lightningFastDesc: 'Execute trades in milliseconds with our high-speed infrastructure',
    secureSafe: 'Secure & Safe',
    secureSafeDesc: 'Bank-level security with multi-layer encryption and cold storage',
    
    // Trading
    startTrading: 'Start Trading with',
    aiSignals: 'AI Signals',
    tradingDescription: 'Get real-time buy & sell signals powered by advanced AI algorithms',
    investmentCalculator: 'Investment Calculator',
    investmentBudget: 'Investment Budget (USD)',
    timeframe: 'Timeframe',
    estimatedProfit: 'Estimated Profit',
    return: 'return',
    startTradingNow: 'Start Trading Now',
    liveTradingSignals: 'Live Trading Signals',
    confidence: 'Confidence',
    proTip: 'Pro Tip:',
    proTipText: 'Our AI analyzes 1000+ market indicators to generate these signals with 95%+ accuracy',
    
    // Knowledge Hub
    cryptoKnowledgeHub: 'Crypto Knowledge Hub',
    learnFromExperts: 'Learn from our experts and stay ahead of the market',
    all: 'All',
    investmentStrategy: 'Investment Strategy',
    security: 'Security',
    technology: 'Technology',
    tradingTips: 'Trading Tips',
    marketAnalysis: 'Market Analysis',
    readArticle: 'Read Article',
    read: 'Read',
    stayUpdated: 'Stay Updated with Market Insights',
    stayUpdatedDesc: 'Get the latest crypto news, trading tips, and market analysis delivered to your inbox weekly.',
    subscribe: 'Subscribe',
    
    // Footer
    ultimatePlatform: 'The ultimate AI-powered crypto trading platform for modern investors.',
    quickLinks: 'Quick Links',
    aboutUs: 'About Us',
    contactUs: 'Contact Us',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    resources: 'Resources',
    blog: 'Blog',
    helpCenter: 'Help Center',
    apiDocumentation: 'API Documentation',
    tradingDisclaimer: 'TRADING DISCLAIMER:',
    tradingDisclaimerText: 'Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. Past performance does not guarantee future results. The value of cryptocurrencies can go down as well as up, and you may lose some or all of your invested capital.',
    dyor: 'DYOR (Do Your Own Research):',
    dyorText: 'Always conduct your own research and consider consulting with a financial advisor before making investment decisions. Never invest more than you can afford to lose.',
    futureOfTrading: 'The future of trading intelligence – AI-powered crypto analysis built for modern investors',
    allRightsReserved: 'All rights reserved.',
  },
  ar: {
    // Header
    live: 'مباشر',
    account: 'الحساب',
    startFreeTrial: 'ابدأ التجربة المجانية',
    viewLiveDemo: 'عرض العرض التوضيحي المباشر',
    
    // Hero Section
    heroTitle: 'مساعد التداول بالذكاء الاصطناعي',
    heroSubtitle: 'للمستثمرين الجديين في العملات المشفرة',
    heroDescription: 'إشارات البيع والشراء المباشرة، ومقارنات البورصات، والتوجيه في لوحة تحكم تفاعلية واحدة.',
    trustedBy: 'موثوق من قبل المتداولين في جميع أنحاء العالم',
    
    // Features
    whyChoose: 'لماذا تختار',
    aiPowered: 'التحليل المدعوم بالذكاء الاصطناعي',
    aiPoweredDesc: 'تحلل خوارزمياتنا المتقدمة بيانات السوق على مدار الساعة طوال أيام الأسبوع للعثور على أفضل الفرص',
    lightningFast: 'سريع كالبرق',
    lightningFastDesc: 'نفذ الصفقات في أجزاء من الثانية مع بنيتنا التحتية عالية السرعة',
    secureSafe: 'آمن ومضمون',
    secureSafeDesc: 'أمان على مستوى البنوك مع تشفير متعدد الطبقات والتخزين البارد',
    
    // Trading
    startTrading: 'ابدأ التداول مع',
    aiSignals: 'إشارات الذكاء الاصطناعي',
    tradingDescription: 'احصل على إشارات البيع والشراء في الوقت الفعلي مدعومة بخوارزميات الذكاء الاصطناعي المتقدمة',
    investmentCalculator: 'حاسبة الاستثمار',
    investmentBudget: 'ميزانية الاستثمار (دولار أمريكي)',
    timeframe: 'الإطار الزمني',
    estimatedProfit: 'الربح المتوقع',
    return: 'عائد',
    startTradingNow: 'ابدأ التداول الآن',
    liveTradingSignals: 'إشارات التداول المباشرة',
    confidence: 'الثقة',
    proTip: 'نصيحة احترافية:',
    proTipText: 'يحلل ذكاؤنا الاصطناعي أكثر من 1000 مؤشر سوقي لتوليد هذه الإشارات بدقة تزيد عن 95%',
    
    // Knowledge Hub
    cryptoKnowledgeHub: 'مركز المعرفة بالعملات المشفرة',
    learnFromExperts: 'تعلم من خبرائنا وابق متقدماً على السوق',
    all: 'الكل',
    investmentStrategy: 'استراتيجية الاستثمار',
    security: 'الأمان',
    technology: 'التكنولوجيا',
    tradingTips: 'نصائح التداول',
    marketAnalysis: 'تحليل السوق',
    readArticle: 'اقرأ المقال',
    read: 'اقرأ',
    stayUpdated: 'ابق محدثاً مع رؤى السوق',
    stayUpdatedDesc: 'احصل على أحدث أخبار العملات المشفرة ونصائح التداول وتحليل السوق في صندوق الوارد الخاص بك أسبوعياً.',
    subscribe: 'اشترك',
    
    // Footer
    ultimatePlatform: 'منصة التداول بالعملات المشفرة المدعومة بالذكاء الاصطناعي للمستثمرين المعاصرين.',
    quickLinks: 'روابط سريعة',
    aboutUs: 'من نحن',
    contactUs: 'اتصل بنا',
    privacyPolicy: 'سياسة الخصوصية',
    termsOfService: 'شروط الخدمة',
    resources: 'الموارد',
    blog: 'المدونة',
    helpCenter: 'مركز المساعدة',
    apiDocumentation: 'وثائق API',
    tradingDisclaimer: 'إخلاء مسؤولية التداول:',
    tradingDisclaimerText: 'تداول العملات المشفرة ينطوي على مخاطر كبيرة من الخسارة وليس مناسباً لجميع المستثمرين. الأداء السابق لا يضمن النتائج المستقبلية. يمكن أن تنخفض قيمة العملات المشفرة وترتفع، وقد تفقد بعض أو كل رأس المال المستثمر.',
    dyor: 'DYOR (قم ببحثك الخاص):',
    dyorText: 'قم دائماً ببحثك الخاص وفكر في استشارة مستشار مالي قبل اتخاذ قرارات الاستثمار. لا تستثمر أبداً أكثر مما يمكنك تحمل خسارته.',
    futureOfTrading: 'مستقبل ذكاء التداول – تحليل العملات المشفرة المدعوم بالذكاء الاصطناعي للمستثمرين المعاصرين',
    allRightsReserved: 'جميع الحقوق محفوظة.',
  }
};

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('dark');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Load saved preferences on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedTheme) setTheme(savedTheme);
    if (savedAuth === 'true') setIsAuthenticated(true);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const value: AppContextType = {
    language,
    setLanguage,
    theme,
    setTheme,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Hook to get translations
export const useTranslation = () => {
  const { language } = useApp();
  return translations[language];
};

export default AppContext;



