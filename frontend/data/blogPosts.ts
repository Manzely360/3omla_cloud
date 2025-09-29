export type LocaleCode = 'en' | 'ar'

export interface BlogPostTranslation {
  title: string
  excerpt: string
  readTime: string
  category: string
  content: Array<{ type: 'paragraph' | 'heading' | 'list'; value: string | string[] }>
}

export interface BlogPost {
  slug: string
  publishDate: string
  heroColor: string
  translations: Record<LocaleCode, BlogPostTranslation>
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'lead-lag-roadmap',
    publishDate: '2024-05-18',
    heroColor: 'from-sky-500/20 to-indigo-500/20',
    translations: {
      en: {
        title: 'The Lead-Lag Roadmap: Finding Leaders Before the Move',
        excerpt:
          'We show how 3OMLA tracks exchange order flow to discover which coins spark the move and which ones follow.',
        readTime: '7 min read',
        category: 'Market Intelligence',
        content: [
          {
            type: 'paragraph',
            value:
              'Institutional traders know the tape is never random. When a whale sweeps liquidity on Binance, a correlated token on Bybit usually blinks within seconds. The 3OMLA lead-lag engine listens to that rhythm and converts it into actionable trades.'
          },
          {
            type: 'heading',
            value: 'How the Scanner Works'
          },
          {
            type: 'paragraph',
            value:
              'Every 15 seconds we refresh 120+ spot pairs across Binance, KuCoin, and OKX. We compute rolling correlations, detect shock events, and timestamp the first venue that moves more than one standard deviation.'
          },
          {
            type: 'list',
            value: [
              'Weighted cross-exchange prices remove fake wicks and stale books.',
              'Lag discovery converts block timestamps into second-by-second offsets.',
              'Hit-rate scoring highlights pairings that repeated at least 68% of the time last week.'
            ]
          },
          {
            type: 'paragraph',
            value:
              'If BTC leads SOL by 18 seconds and the hit-rate stays above 72%, the dashboard promotes it to the top of the Radar list. You can automate the follow trade or send it to the backtesting lab with one click.'
          }
        ]
      },
      ar: {
        title: 'خارطة القيادة والتأخر: اكتشف القائد قبل الحركة',
        excerpt:
          'نشرح كيف يتتبع 3OMLA تدفقات الأوامر عبر البورصات لاكتشاف العملات التي تشعل الحركة وتلك التي تتبعها.',
        readTime: '٧ دقائق قراءة',
        category: 'استخبارات السوق',
        content: [
          {
            type: 'paragraph',
            value:
              'يعرف المتداولون المحترفون أن السوق لا يتحرك عشوائياً. عندما يلتهم حوت السيولة على منصة Binance، تومض عملة مرتبطة بها على Bybit خلال ثوانٍ. يستمع محرك القيادة والتأخر في 3OMLA لهذا الإيقاع ويحوّله إلى صفقات قابلة للتنفيذ.'
          },
          {
            type: 'heading',
            value: 'كيف يعمل الماسح؟'
          },
          {
            type: 'paragraph',
            value:
              'نحدّث أكثر من 120 زوجاً فوريًا كل 15 ثانية عبر Binance وKuCoin وOKX. نحسب الارتباطات المتحركة، نكتشف الصدمات، ونؤقّت أول بورصة تتحرك أكثر من انحراف معياري واحد.'
          },
          {
            type: 'list',
            value: [
              'الأسعار الموزونة عبر البورصات تزيل الشموع المزيفة والكتب الراكدة.',
              'اكتشاف التأخر يحوّل الطوابع الزمنية للكتل إلى فروقات بالثواني.',
              'تسليط الضوء على الأزواج التي تكررت بنسبة لا تقل عن 68٪ خلال الأسبوع الماضي.'
            ]
          },
          {
            type: 'paragraph',
            value:
              'إذا تقدّم BTC على SOL بـ 18 ثانية مع بقاء نسبة الإصابة فوق 72٪، نرفع الزوج إلى أعلى قائمة الرادار. يمكنك أتمتة الصفقة اللاحقة أو إرسالها إلى مختبر الاختبارات بضغطة واحدة.'
          }
        ]
      }
    }
  },
  {
    slug: 'budget-to-profit',
    publishDate: '2024-05-02',
    heroColor: 'from-emerald-500/20 to-teal-500/20',
    translations: {
      en: {
        title: 'From Budget to Profit: Turning $500 into a Structured Plan',
        excerpt:
          'Your investment box on the homepage is more than a calculator—it maps capital into staged entries, protected stops, and rolling targets.',
        readTime: '6 min read',
        category: 'Growth Playbook',
        content: [
          {
            type: 'paragraph',
            value:
              'Enter a budget and 3OMLA immediately splits it across three tactics: momentum follow, mean reversion, and trend continuation. Each tactic references live volatility so you avoid over-sizing.'
          },
          {
            type: 'list',
            value: [
              'Momentum: deploy 40% with trailing protection if the lead-lag confidence > 0.7.',
              'Mean Reversion: allocate 35% with a two standard deviation bounce filter.',
              'Continuation: leave 25% as dry powder for the companion asset that usually lags.'
            ]
          },
          {
            type: 'paragraph',
            value:
              'The Invest Now button routes first-time users to signup so the plan is stored server-side. Returning members jump straight into the trading cockpit with the allocations preloaded.'
          }
        ]
      },
      ar: {
        title: 'من الميزانية إلى الأرباح: خطّة منظمة لمبلغ 500 دولار',
        excerpt:
          'حقل الميزانية على الصفحة الرئيسية ليس مجرد حاسبة؛ بل يحوّل رأس المال إلى مداخل متدرجة ووقف خسارة محمي وأهداف متتابعة.',
        readTime: '٦ دقائق قراءة',
        category: 'خطة النمو',
        content: [
          {
            type: 'paragraph',
            value:
              'أدخل ميزانيتك، فيقسّمها 3OMLA فورًا إلى ثلاث تكتيكات: متابعة الزخم، الارتداد، واستمرار الاتجاه. كل تكتيك يستخدم التقلبات اللحظية حتى لا تبالغ في حجم الصفقة.'
          },
          {
            type: 'list',
            value: [
              'الزخم: استثمر 40٪ مع حماية متحركة إذا تجاوزت ثقة القيادة والتأخر 0.7.',
              'الارتداد: خصص 35٪ مع فلتر ارتداد بمقدار انحرافين معياريين.',
              'استمرار الاتجاه: اترك 25٪ كقوة احتياطية للأصل المرافق الذي يتأخر عادة.'
            ]
          },
          {
            type: 'paragraph',
            value:
              'زر "استثمر الآن" يوجّه المستخدمين الجدد إلى إنشاء حساب لتخزين الخطة على الخادم، بينما ينتقل الأعضاء الحاليون مباشرة إلى لوحة التداول مع تحميل المخصصات مسبقًا.'
          }
        ]
      }
    }
  },
  {
    slug: 'system-status-blueprint',
    publishDate: '2024-04-24',
    heroColor: 'from-violet-500/20 to-fuchsia-500/20',
    translations: {
      en: {
        title: 'Infrastructure Blueprint: Keeping 3OMLA Online 24/7',
        excerpt:
          'A behind-the-scenes look at the health checks, circuit breakers, and redundancy that power the system status page.',
        readTime: '5 min read',
        category: 'Engineering',
        content: [
          {
            type: 'paragraph',
            value:
              'Our FastAPI core runs on Railway in Frankfurt with Postgres on Neon. Health probes monitor the ultra price oracle, CoinMarketCap bridge, and Bybit/Binance collectors every 30 seconds.'
          },
          {
            type: 'paragraph',
            value:
              'If CoinMarketCap times out twice, we fail over to cached dominance stats and mark the widget amber instead of green. Users always see transparent status updates before they enter trades.'
          }
        ]
      },
      ar: {
        title: 'المخطط البنيوي: كيف نحافظ على 3OMLA متصلاً على مدار الساعة',
        excerpt:
          'نقدّم نظرة خلف الكواليس على فحوصات الصحة وقواطع الدوائر والتكرار الذي يدعم صفحة حالة النظام.',
        readTime: '٥ دقائق قراءة',
        category: 'هندسة المنصة',
        content: [
          {
            type: 'paragraph',
            value:
              'يعمل نواة FastAPI على Railway في فرانكفورت مع Postgres على Neon. تقوم المجسّات بمراقبة أوراكل الأسعار الفائق وجسر CoinMarketCap ومجمّعات Bybit/Binance كل 30 ثانية.'
          },
          {
            type: 'paragraph',
            value:
              'إذا فشل CoinMarketCap مرتين، نتحول إلى إحصاءات الهيمنة المخزّنة ونحوّل الأداة إلى اللون الكهرماني بدلاً من الأخضر. يرى المستخدمون حالة شفافة قبل تنفيذ أي صفقة.'
          }
        ]
      }
    }
  },
  {
    slug: 'arabic-onboarding',
    publishDate: '2024-03-30',
    heroColor: 'from-amber-500/20 to-rose-500/20',
    translations: {
      en: {
        title: 'Welcoming Arabic Traders to 3OMLA',
        excerpt:
          'We localised the entire onboarding flow so Egyptian, Saudi, and Emirati traders can activate strategies without friction.',
        readTime: '4 min read',
        category: 'Community',
        content: [
          {
            type: 'paragraph',
            value:
              'Switch to Arabic and the interface mirrors right-to-left. Budget labels, tooltips, and account verification emails are all translated by native speakers from the GCC.'
          },
          {
            type: 'paragraph',
            value:
              'Pricing stays pegged to USD for clarity, but support is available in both Arabic and English through our 24/7 channel.'
          }
        ]
      },
      ar: {
        title: 'مرحباً بالمتداولين العرب في 3OMLA',
        excerpt:
          'قمنا بتعريب مسار الانضمام بالكامل ليبدأ المتداولون في مصر والسعودية والإمارات استراتيجياتهم بدون عوائق.',
        readTime: '٤ دقائق قراءة',
        category: 'المجتمع',
        content: [
          {
            type: 'paragraph',
            value:
              'عند التبديل إلى العربية، تنعكس الواجهة بالكامل من اليمين إلى اليسار. تمت ترجمة ملصقات الميزانية والتلميحات ورسائل التحقق من الحساب بواسطة متحدثين أصليين من الخليج.'
          },
          {
            type: 'paragraph',
            value:
              'تظل الأسعار مقومة بالدولار الأمريكي لضمان الوضوح، لكن فريق الدعم متاح باللغة العربية والإنجليزية على مدار الساعة.'
          }
        ]
      }
    }
  }
]
