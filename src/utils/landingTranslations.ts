import { Language } from '../types';

export interface LandingTranslation {
  // Hero
  heroTag: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  ctaGetOs: string;
  ctaTestQr: string;
  statPrice: string;
  statPriceSub: string;
  statTrial: string;
  statTrialSub: string;
  statAgency: string;
  statAgencySub: string;
  statPrivate: string;
  statPrivateSub: string;

  // Language Selector Banner
  langBannerTitle: string;
  langBannerDesc: string;

  // Agency Services
  agencyTag: string;
  agencyTitle: string;
  agencySub: string;
  agencyService1Title: string;
  agencyService1Desc: string;
  agencyService2Title: string;
  agencyService2Desc: string;
  agencyService3Title: string;
  agencyService3Desc: string;

  // OS Overview
  osTag: string;
  osTitle: string;
  osSub: string;
  osStep1Title: string;
  osStep1Desc: string;
  osStep2Title: string;
  osStep2Desc: string;
  osStep3Title: string;
  osStep3Desc: string;
  osStep4Title: string;
  osStep4Desc: string;

  // Why Choose DigiMoms OS
  whyChooseTag: string;
  whyChooseTitle: string;
  whyChooseSub: string;
  whyChoosePoints: Array<{ title: string; desc: string }>;

  // What You Get (12 Cards)
  whatYouGetTag: string;
  whatYouGetTitle: string;
  whatYouGetSub: string;
  whatYouGetCards: Array<{ title: string; desc: string }>;

  // More Than Software
  moreThanSoftwareTag: string;
  moreThanSoftwareTitle: string;
  moreThanSoftwareSub: string;
  moreThanSoftwarePillars: Array<{ title: string; desc: string }>;
  moreThanSoftwareDisclaimer: string;

  // AI Assistant Section
  aiAssistantTag: string;
  aiAssistantTitle: string;
  aiAssistantSub: string;
  aiCapabilitiesTitle: string;
  aiCapabilities: string[];
  aiLanguagesTitle: string;
  aiLanguagesDesc: string;
  aiContextNotice: string;

  // Learn While You Work
  learnTag: string;
  learnTitle: string;
  learnSub: string;
  learnPoints: Array<{ title: string; desc: string }>;
  learnDisclaimer: string;

  // Our Journey
  journeyTag: string;
  journeyTitle: string;
  journeyFounder: string;
  journeyEstablished: string;
  journeyStory: string;

  // Our Vision
  visionTag: string;
  visionTitle: string;
  visionStatement: string;
  visionPillars: Array<{ title: string; desc: string }>;

  // Privacy & Tenant Isolation
  privacyTag: string;
  privacyTitle: string;
  privacySub: string;
  privacyPoints: string[];

  // Pricing Summary & CTAs
  pricingTag: string;
  pricingTitle: string;
  pricingSub: string;
  pricingPlanMonthly: string;
  pricingPlanPrice: string;
  pricingPlanDesc: string;

  // Legal Disclaimer
  legalDisclaimerTitle: string;
  legalDisclaimerText: string;

  // FAQ
  faqTag: string;
  faqTitle: string;
  faqItems: Array<{ q: string; a: string }>;

  // Contact / Agency
  contactTag: string;
  contactTitle: string;
  contactSub: string;
  contactCta: string;
  whatsappCta: string;
}

export const landingTranslations: Record<Language, LandingTranslation> = {
  en: {
    heroTag: 'DigiMoms Marketing Agency • Smart Restaurant OS',
    heroTitleLine1: 'Empowering Businesses & Restaurants With',
    heroTitleLine2: 'Smart Web & Operating Systems',
    heroSubtitle: 'DigiMoms Marketing Agency provides digital services and creates DigiMoms Smart Restaurant OS — a complete enterprise restaurant management ecosystem for Indian restaurants starting at ₹999/month.',
    ctaGetOs: 'Get Restaurant OS (Starting ₹999/mo)',
    ctaTestQr: 'Test Live QR Menu Scan',
    statPrice: '₹999 / mo',
    statPriceSub: 'Affordable Starting Plan',
    statTrial: '15-Day Trial',
    statTrialSub: 'When Offered by Admin',
    statAgency: 'Web Agency',
    statAgencySub: 'Custom Sites & Mobile Apps',
    statPrivate: '100% Private',
    statPrivateSub: 'Isolated Restaurant Accounts',

    langBannerTitle: 'Select Your Preferred Language',
    langBannerDesc: 'Choose English, বাংলা (Bengali), or हिन्दी (Hindi). All features operate seamlessly in Indian context with INR currency.',

    agencyTag: 'Full-Service Web & Software Development',
    agencyTitle: 'DigiMoms Marketing Agency Services',
    agencySub: 'In addition to our flagship Restaurant OS, DigiMoms provides custom web, e-commerce, and software development for growing brands.',
    agencyService1Title: 'Custom Website Development',
    agencyService1Desc: 'High-performance, modern websites designed with React, Tailwind CSS, and custom CMS backends.',
    agencyService2Title: 'E-Commerce & SaaS Products',
    agencyService2Desc: 'Custom online store setups with secure payment gateways (UPI, Cards, Net Banking), inventory tracking, and client billing.',
    agencyService3Title: 'Android & iOS Mobile Apps',
    agencyService3Desc: 'Cross-platform React Native & Flutter mobile applications tailored for retail and service businesses.',

    osTag: 'Flagship Restaurant Ecosystem',
    osTitle: 'DigiMoms Smart Restaurant OS',
    osSub: 'A complete digital restaurant management ecosystem connecting guest QR ordering, kitchen display, waiter dispatch, and owner controls.',
    osStep1Title: '1. Guest Scans QR',
    osStep1Desc: 'Customer scans table QR code with any camera. Browse menu without downloading any app.',
    osStep2Title: '2. Interactive Menu',
    osStep2Desc: 'Filter Veg/Non-Veg, view prices in ₹ INR, choose language, and add cooking notes.',
    osStep3Title: '3. Kitchen KDS Ticket',
    osStep3Desc: 'Orders land instantly on the Kitchen Display Screen with audio chime alerts.',
    osStep4Title: '4. Service & PDF Invoice',
    osStep4Desc: 'Waiters deliver orders, guests pay via Cash or Online (UPI, Cards, Net Banking), and receive digital PDF invoices.',

    whyChooseTag: 'More Than An Ordering Page',
    whyChooseTitle: 'Why Choose DigiMoms Smart Restaurant OS?',
    whyChooseSub: 'DigiMoms is not simply a food ordering website. It provides a complete digital restaurant management ecosystem designed for operational efficiency in India.',
    whyChoosePoints: [
      { title: 'QR-Based Table Ordering', desc: 'Unique QR codes for every table enabling guest self-ordering.' },
      { title: 'Interactive Digital Menu', desc: 'Categorized, Veg/Non-Veg flagged menu with instant item toggles.' },
      { title: 'Live Order Management', desc: 'Real-time order state updates from pending to cooking and served.' },
      { title: 'Kitchen Display System (KDS)', desc: 'Dedicated kitchen screen with preparation timers and audio chimes.' },
      { title: 'Waiter Management & Terminals', desc: 'PIN-protected waiter terminals for table assignment and cash collection.' },
      { title: 'Call Waiter System', desc: 'One-tap requests for water, spoon, tissue paper, cleaning, or bill.' },
      { title: 'Live Sound Notifications', desc: 'Audible chime alerts when new orders or waiter calls arrive.' },
      { title: 'Online & Cash Payment Workflows', desc: 'All Supported UPI Apps, Debit/Credit Cards, and Cash Collection Verification.' },
      { title: 'Digital Bills & Receipts', desc: 'Automatic GST calculation and downloadable PDF invoices.' },
      { title: 'Sales & Analytics Reports', desc: 'Revenue breakdowns, order metrics, and item popularity analytics.' },
      { title: 'Staff Activity Monitoring', desc: 'Track waiter actions, kitchen preparation times, and shift activity.' },
      { title: 'Complete Owner Dashboard', desc: 'Centralized control panel for full restaurant operations.' },
      { title: 'Restaurant Website Management', desc: 'Customizable public profile, logo, operating hours, and legal pages.' },
      { title: 'Subscription Management', desc: 'Flexible monthly/annual plan renewals directly inside the portal.' },
      { title: 'Payment Transaction Records', desc: 'Verified logs for all cash and online transaction entries.' },
      { title: 'Customer Order History', desc: 'Archived records of completed dining sessions and customer feedback.' },
      { title: 'AI Help Assistant', desc: '24/7 intelligent assistant answering operational and system queries.' },
      { title: 'Multi-Language Assistance', desc: 'Full system guidance available in English, বাংলা, and हिन्दी.' },
      { title: 'Operational Guidance', desc: 'Step-by-step explanations for setup, menus, tables, and reports.' },
      { title: 'Centralized OS Engine', desc: 'Reliable cloud platform powering independent restaurant tenants.' }
    ],

    whatYouGetTag: 'Comprehensive Features',
    whatYouGetTitle: 'What You Get With DigiMoms OS',
    whatYouGetSub: 'A complete suite of modules designed to streamline daily restaurant workflows.',
    whatYouGetCards: [
      { title: 'Digital Restaurant Website', desc: 'Your own web page with logo, address, operating hours, and legal notices.' },
      { title: 'QR Table Ordering', desc: 'Instant QR generation for tables allowing customers to order directly.' },
      { title: 'Table Management', desc: 'Interactive floor grid, table status tracking, and session PIN security.' },
      { title: 'Kitchen Management (KDS)', desc: 'Live ticket system for kitchen staff with preparation status controls.' },
      { title: 'Waiter Management', desc: 'Dedicated waiter login to take orders, serve tables, and collect cash.' },
      { title: 'Live Notifications', desc: 'Real-time sound chime and popup alerts for incoming orders and requests.' },
      { title: 'Payment Management', desc: 'Streamlined workflows for all supported UPI apps, debit/credit cards, and cash verification.' },
      { title: 'Digital Billing', desc: 'Automated invoice generation with itemized breakdown and PDF download.' },
      { title: 'Sales & Reports', desc: 'Detailed daily, weekly, and monthly sales graphs and revenue logs.' },
      { title: 'Owner Control Panel', desc: 'Full administrative authority over menu items, pricing, and staff accounts.' },
      { title: 'AI Help Assistant', desc: 'Smart AI guide built into the portal to explain features and workflows.' },
      { title: 'Learning & Support', desc: 'Continuous operational insights and guidance for staff onboarding.' }
    ],

    moreThanSoftwareTag: 'Our Approach',
    moreThanSoftwareTitle: 'More Than Software',
    moreThanSoftwareSub: 'DigiMoms does not only provide software. We aim to empower restaurant owners and staff with complete operational tools and continuous guidance.',
    moreThanSoftwarePillars: [
      { title: 'Modern Technology', desc: 'Ultra-fast, reliable cloud web tools accessible from any smartphone or tablet.' },
      { title: 'Digital Convenience', desc: 'Automated ordering, kitchen ticket flow, and instant bill generation.' },
      { title: 'Operational Learning', desc: 'Step-by-step guides helping owners understand modern restaurant management.' },
      { title: 'AI-Assisted Guidance', desc: 'Smart AI companion to answer system queries in English, Bengali, or Hindi.' },
      { title: 'Business Support', desc: 'Dedicated agency support to assist with technical setup and configuration.' },
      { title: 'Continuous Improvement', desc: 'Regular software updates and feature enhancements based on user feedback.' }
    ],
    moreThanSoftwareDisclaimer: 'Important Note: DigiMoms provides software technology, digital tools, and operational learning resources. We help restaurant owners and staff operate more effectively. We do not make unrealistic claims or guarantee specific revenue, sales growth, or customer numbers.',

    aiAssistantTag: 'Intelligent Guidance',
    aiAssistantTitle: 'Your AI Help Assistant',
    aiAssistantSub: 'DigiMoms OS includes a built-in AI Help Assistant to guide owners and staff through every feature of the operating system.',
    aiCapabilitiesTitle: 'What the AI Assistant Can Help You Understand:',
    aiCapabilities: [
      'Which menu categories to create and how to structure items',
      'How to create, update, or cancel customer orders',
      'How to manage tables, active sessions, and table PINs',
      'How kitchen staff use the KDS screen and update dish status',
      'How waiter workflows, table assignment, and calls operate',
      'How payment statuses (Pending, Verified, Cash, Online) work',
      'How to view and interpret sales reports and GST calculations',
      'How to customize restaurant settings, logo, and legal pages',
      'How to understand real-time system notifications and sound alerts',
      'What different dashboard options and metrics represent'
    ],
    aiLanguagesTitle: 'Supported Languages for AI Guidance:',
    aiLanguagesDesc: 'Available in English, বাংলা (Bengali), and हिन्दी (Hindi).',
    aiContextNotice: 'Note: Language selection does not alter country context. DigiMoms is strictly based in India, using INR (₹) currency and Indian restaurant workflows.',

    learnTag: 'Empowering Staff',
    learnTitle: 'Learn While You Work',
    learnSub: 'DigiMoms is designed not only to provide tools, but also to help owners and staff learn how to use those tools in daily operations.',
    learnPoints: [
      { title: 'Step-by-Step Guidance', desc: 'Clear, simple instructions for every screen and workflow.' },
      { title: 'Interactive AI Assistance', desc: 'Ask questions directly inside the portal whenever guidance is needed.' },
      { title: 'Staff Onboarding Support', desc: 'Easy-to-understand interfaces for waiters and kitchen staff.' },
      { title: 'Operational Explanations', desc: 'Contextual tips explaining why specific steps or settings matter.' }
    ],
    learnDisclaimer: 'DigiMoms provides software and learning assistance; it does not replace the restaurant owner responsibility for staff training, food quality, and business decisions.',

    journeyTag: 'Our Story',
    journeyTitle: 'Our Journey',
    journeyFounder: 'Tanmoy Jana (Founder & CEO)',
    journeyEstablished: 'Established in 2024',
    journeyStory: 'DigiMoms Marketing Agency was established in 2024 by Tanmoy Jana. Starting as a digital and marketing-focused initiative to help local businesses establish a digital presence, DigiMoms expanded its vision to build technology solutions for the hospitality sector — developing DigiMoms Smart Restaurant OS to make modern digital restaurant tools simpler and more accessible.',

    visionTag: 'Core Purpose',
    visionTitle: 'Our Vision',
    visionStatement: '"To make modern digital tools easier to access and easier to understand for businesses."',
    visionPillars: [
      { title: 'Technology', desc: 'Reliable, enterprise-grade cloud software built for speed.' },
      { title: 'Simplicity', desc: 'Clean, intuitive interfaces designed for effortless staff use.' },
      { title: 'Learning', desc: 'Practical guidance helping owners understand digital operations.' },
      { title: 'Support', desc: 'Responsive agency support whenever assistance is required.' }
    ],

    privacyTag: 'Data Protection & Isolation',
    privacyTitle: 'Restaurant Data Privacy & Confidentiality',
    privacySub: 'Your restaurant account data, owner details, sales reports, and customer records remain strictly private.',
    privacyPoints: [
      'No public listing of restaurant account details or sales data',
      'Complete data isolation between independent restaurant tenants',
      'Private owner dashboard protected by account credentials',
      'Individual restaurants maintain their own optional public profile page e.g., /r/restaurant-slug'
    ],

    pricingTag: 'Simple Pricing',
    pricingTitle: 'DigiMoms OS Subscription Plans',
    pricingSub: 'Transparent India pricing with no hidden commission fees on orders.',
    pricingPlanMonthly: 'Monthly SaaS Plan',
    pricingPlanPrice: '₹999 / month',
    pricingPlanDesc: 'Includes full access to QR Ordering, Kitchen KDS, Waiter Terminal, Owner Dashboard, and AI Help Assistant.',

    legalDisclaimerTitle: 'Legal & Platform Disclaimer',
    legalDisclaimerText: 'DigiMoms Marketing Agency provides software, web development, and digital technology services. Individual restaurants operating on DigiMoms OS are independent businesses solely responsible for their own menu pricing, food quality, safety, FSSAI compliance, GST tax filings, and customer service.',

    faqTag: 'Got Questions?',
    faqTitle: 'Frequently Asked Questions',
    faqItems: [
      {
        q: 'Is DigiMoms a food delivery portal like Swiggy or Zomato?',
        a: 'No. DigiMoms is a direct software technology provider. We provide restaurants with their own Smart Restaurant OS for direct QR table ordering, kitchen KDS, waiter management, and digital billing without taking per-order commissions.'
      },
      {
        q: 'What currency and payment options are supported?',
        a: 'DigiMoms operates strictly in Indian Rupees (₹ INR). It supports Cash payments and Online payments via all supported UPI apps and cards.'
      },
      {
        q: 'How does the AI Help Assistant work?',
        a: 'The built-in AI Help Assistant is available inside the portal. Users can ask questions in English, Bengali, or Hindi to understand how to use menus, tables, kitchen orders, waiter calls, and reports.'
      },
      {
        q: 'Are my restaurant sales and customer data private?',
        a: 'Yes. Restaurant accounts, sales reports, owner details, and customer order histories are strictly confidential and isolated. They are never publicly listed or shared.'
      }
    ],

    contactTag: 'Get Started',
    contactTitle: 'Ready to Transform Your Restaurant?',
    contactSub: 'Get started with DigiMoms Smart Restaurant OS or speak with our agency team.',
    contactCta: 'View OS Plans (Starting ₹999/mo)',
    whatsappCta: 'WhatsApp Agency: +91 9475388085'
  },

  bn: {
    heroTag: 'ডিজিমমস মার্কেটিং এজেন্সি • স্মার্ট রেস্তোরাঁ ওএস',
    heroTitleLine1: 'ব্যবসা ও রেস্তোরাঁগুলোকে ক্ষমতায়ন করুন',
    heroTitleLine2: 'স্মার্ট ওয়েব ও অপারেটিং সিস্টেম দিয়ে',
    heroSubtitle: 'ডিজিমমস মার্কেটিং এজেন্সি ওয়েব সার্ভিস প্রদান করে এবং ডিজিমমস স্মার্ট রেস্তোরাঁ ওএস তৈরি করেছে — ভারতীয় রেস্তোরাঁর জন্য একটি সম্পূর্ণ ডিজিটাল রেস্তোরাঁ ম্যানেজমেন্ট ইকোসিস্টেম।',
    ctaGetOs: 'রেস্তোরাঁ ওএস নিন (শুরু মাত্র ₹৯৯৯/মাস)',
    ctaTestQr: 'লাইভ QR মেনু স্ক্যান পরীক্ষা করুন',
    statPrice: '₹৯৯৯ / মাস',
    statPriceSub: 'সুলভ প্রারম্ভিক প্ল্যান',
    statTrial: '১৫ দিনের ট্রায়াল',
    statTrialSub: 'এডমিন অফার করলে প্রযোজ্য',
    statAgency: 'ওয়েব এজেন্সি',
    statAgencySub: 'কাস্টম সাইট ও মোবাইল অ্যাপ',
    statPrivate: '১০০% প্রাইভেট',
    statPrivateSub: 'স্বতন্ত্র রেস্তোরাঁ একাউন্ট',

    langBannerTitle: 'আপনার পছন্দের ভাষা নির্বাচন করুন',
    langBannerDesc: 'ইংরেজি, বাংলা বা हिन्दी বেছে নিন। ভারতীয় মুদ্রা (₹ INR) এবং ভারতীয় রেস্তোরাঁ ওয়ার্কফ্লো অনুসারেই সমস্ত কিছু পরিচালিত হয়।',

    agencyTag: 'ফুল-সার্ভিস ওয়েব ও সফটওয়্যার ডেভেলপমেন্ট',
    agencyTitle: 'ডিজিমমস মার্কেটিং এজেন্সি সার্ভিসসমূহ',
    agencySub: 'আমাদের ফ্ল্যাগশিপ রেস্তোরাঁ ওএস ছাড়াও, ডিজিমমস ক্রমবর্ধমান ব্র্যান্ডের জন্য কাস্টম ওয়েব, ই-কমার্স এবং সফটওয়্যার তৈরি করে।',
    agencyService1Title: 'কাস্টম ওয়েবসাইট ডেভেলপমেন্ট',
    agencyService1Desc: 'React, Tailwind CSS এবং কাস্টম CMS সহ উচ্চ গতিসম্পন্ন আধুনিক ওয়েবসাইট।',
    agencyService2Title: 'ই-কমার্স ও স্যাশ (SaaS) প্রোডাক্ট',
    agencyService2Desc: 'সুরক্ষিত পেমেন্ট গেটওয়ে (UPI, কার্ড, নেট ব্যাংকিং), ইনভেন্টরি ট্র্যাকিং এবং ক্লায়েন্ট বিলিং সহ অনলাইন স্টোর সেটআপ।',
    agencyService3Title: 'অ্যান্ড্রয়েড ও আইওএস মোবাইল অ্যাপস',
    agencyService3Desc: 'খুচরা ব্যবসা ও সেবামূলক প্রতিষ্ঠানের জন্য React Native ও Flutter ভিত্তিক মোবাইল অ্যাপ।',

    osTag: 'ফ্ল্যাগশিপ রেস্তোরাঁ ইকোসিস্টেম',
    osTitle: 'ডিজিমমস স্মার্ট রেস্তোরাঁ ওএস',
    osSub: 'একটি সম্পূর্ণ ডিজিটাল রেস্তোরাঁ ম্যানেজমেন্ট ইকোসিস্টেম যা কিউআর অর্ডারিং, কিচেন ডিসপ্লে, ওয়েটার ম্যানেজমেন্ট ও ওনার কন্ট্রোলকে যুক্ত করে।',
    osStep1Title: '১. গেস্ট কিউআর স্ক্যান করবেন',
    osStep1Desc: 'গ্রাহক যেকোনো ক্যামেরা দিয়ে টেবিলের QR কোড স্ক্যান করে অ্যাপ ডাউনলোড ছাড়াই মেনু দেখতে পারবেন।',
    osStep2Title: '২. ইন্টারঅ্যাক্টিভ ডিজিটাল মেনু',
    osStep2Desc: 'ভেজ/নন-ভেজ ফিল্টার করুন, ভারতীয় টাকায় (₹) দাম দেখুন, ভাষা বেছে নিন এবং রান্নার নির্দেশ যোগ করুন।',
    osStep3Title: '৩. কিচেন KDS টিকিট',
    osStep3Desc: 'অর্ডার দেওয়ার সাথে সাথে কিচেন স্ক্রিনে নোটিফিকেশন সাউন্ড সহ টিকিট পৌঁছে যায়।',
    osStep4Title: '৪. সার্ভিস ও পিডিএফ ইনভয়েস',
    osStep4Desc: 'ওয়েটার খাবার পরিবেশন করেন, ক্যাশ বা অনলাইনে (UPI, কার্ড, নেট ব্যাংকিং) পেমেন্ট হয় এবং ডিজিটাল পিডিএফ বিল পান।',

    whyChooseTag: 'শুধুমাত্র একটি অর্ডারিং পেজ নয়',
    whyChooseTitle: 'কেন ডিজিমমস স্মার্ট রেস্তোরাঁ ওএস বেছে নেবেন?',
    whyChooseSub: 'ডিজিমমস শুধু একটি খাবার অর্ডারের ওয়েবসাইট নয়। এটি ভারতে রেস্তোরাঁ পরিচালনা সহজ ও দ্রুত করার একটি সম্পূর্ণ ডিজিটাল রেস্তোরাঁ ম্যানেজমেন্ট ইকোসিস্টেম।',
    whyChoosePoints: [
      { title: 'QR-ভিত্তিক টেবিল অর্ডারিং', desc: 'প্রতিটি টেবিলের জন্য আলাদা QR কোড যার মাধ্যমে গ্রাহক নিজেই অর্ডার করতে পারেন।' },
      { title: 'ইন্টারঅ্যাক্টিভ ডিজিটাল মেনু', desc: 'ক্যাটাগরি ভিত্তিক, নিরামিষ/অ্যামীষ চিহ্নিত ডিজিটাল মেনু।' },
      { title: 'লাইভ অর্ডার ম্যানেজমেন্ট', desc: 'পেন্ডিং থেকে রান্নাঘর ও পরিবেশন পর্যন্ত অর্ডারের রিয়েল-টাইম আপডেট।' },
      { title: 'কিচেন ডিসপ্লে সিস্টেম (KDS)', desc: 'রান্নাঘরের জন্য প্রস্তুত সময় ও সাউন্ড অ্যালার্ট সহ ডিসপ্লে স্ক্রিন।' },
      { title: 'ওয়েটার ম্যানেজমেন্ট ও টার্মিনাল', desc: 'পিন-সুরক্ষিত ওয়েটার টার্মিনাল টেবিল ও ক্যাশ পেমেন্ট পরিচালনার জন্য।' },
      { title: 'কল ওয়েটার সিস্টেম', desc: 'জল, চামচ, টিস্যু, টেবিল সাফ বা বিলের জন্য এক ক্লিকে ওয়েটার ডাকার সুবিধা।' },
      { title: 'লাইভ সাউন্ড নোটিফিকেশন', desc: 'নতুন অর্ডার বা ওয়েটার কলের সময় তাৎক্ষণিক অডিও অ্যালার্ট।' },
      { title: 'অনলাইন ও ক্যাশ পেমেন্ট ওয়ার্কফ্লো', desc: 'সমস্ত সাপোর্টেড ইউপিআই (UPI) অ্যাপ, ডেবিট/ক্রেডিট কার্ড এবং ক্যাশ যাচাইকরণ ব্যবস্থা।' },
      { title: 'ডিজিটাল বিল ও রসিদ', desc: 'স্বয়ংক্রিয় জিএসটি হিসাব এবং ডাউনলোডযোগ্য পিডিএফ ইনভয়েস।' },
      { title: 'সেলস ও অ্যানালিটিক্স রিপোর্ট', desc: 'দৈনিক ও মাসিক বিক্রি, অর্ডার সংখ্যা এবং জনপ্রিয় খাবারের রিপোর্ট।' },
      { title: 'স্টাফ অ্যাক্টিভিটি মনিটরিং', desc: 'ওয়েটারের কাজ, রান্নার সময় এবং শিফট অ্যাক্টিভিটি পর্যবেক্ষণ।' },
      { title: 'সম্পূর্ণ ওনার ড্যাশবোর্ড', desc: 'রেস্তোরাঁর সমস্ত কার্যক্রম নিয়ন্ত্রণের জন্য সেন্ট্রালাইজড প্যানেল।' },
      { title: 'রেস্তোরাঁ ওয়েবসাইট ম্যানেজমেন্ট', desc: 'লোগো, ঠিকানা, সময়সূচী ও লিগ্যাল পেজ সহ পাবলিক প্রোফাইল।' },
      { title: 'সাবস্ক্রিপশন ম্যানেজমেন্ট', desc: 'পোর্টাল থেকেই সহজে মাসিক বা বার্ষিক প্ল্যান নবায়নের সুযোগ।' },
      { title: 'পেমেন্ট ট্রানজ্যাকশন রেকর্ড', desc: 'ক্যাশ ও অনলাইন লেনদেনের নিশ্চিত রেকর্ড।' },
      { title: 'কাস্টমার অর্ডার হিস্ট্রি', desc: 'সম্পন্ন হওয়া অর্ডার এবং গ্রাহকের ফিডব্যাকের সংরক্ষিত তথ্য।' },
      { title: 'এআই হেল্প অ্যাসিস্ট্যান্ট', desc: '২৪/৭ সিস্টেম ও অপারেশন বোঝার জন্য বুদ্ধিমান কৃত্রিম বুদ্ধিমত্তা সাহায্যকারী।' },
      { title: 'বহুভাষিক সহায়তা', desc: 'ইংরেজি, বাংলা এবং হিন্দিতে সম্পূর্ণ নির্দেশিকা।' },
      { title: 'অপারেশনাল লার্নিং গাইড', desc: 'সেটআপ, মেনু, টেবিল ও রিপোর্টের ধাপ-ভিত্তিক ব্যাখ্যা।' },
      { title: 'সেন্ট্রালাইজড ওএস ইঞ্জিন', desc: 'নিরাপদ ক্লাউড প্লাটফর্ম যা রেস্তোরাঁ পরিচালনা সহজ করে।' }
    ],

    whatYouGetTag: 'সর্বাঙ্গীন ফিচারসমূহ',
    whatYouGetTitle: 'ডিজিমমস ওএস-এ আপনি যা যা পাচ্ছেন',
    whatYouGetSub: 'দৈনন্দিন রেস্তোরাঁ পরিচালনা সহজ করার জন্য সমস্ত মডিউলের সমাহার।',
    whatYouGetCards: [
      { title: 'ডিজিটাল রেস্তোরাঁ ওয়েবসাইট', desc: 'লোগো, ঠিকানা, সময়সূচী ও তথ্য সহ নিজস্ব ওয়েব পেজ।' },
      { title: 'QR টেবিল অর্ডারিং', desc: 'টেবিলের জন্য কিউআর কোড যাতে গ্রাহকরা সরাসরি অর্ডার করতে পারেন।' },
      { title: 'টেবিল ম্যানেজমেন্ট', desc: 'টেবিল স্ট্যাটাস ট্র্যাকিং এবং সেশন পিন নিরাপত্তা।' },
      { title: 'কিচেন ম্যানেজমেন্ট (KDS)', desc: 'শেফদের জন্য রিয়েল-টাইম অর্ডার স্ট্যাটাস কন্ট্রোল।' },
      { title: 'ওয়েটার ম্যানেজমেন্ট', desc: 'ওয়েটারদের অর্ডার নেওয়া ও ক্যাশ সংগ্রহের জন্য আলাদা প্যানেল।' },
      { title: 'লাইভ নোটিফিকেশন', desc: 'নতুন অর্ডার এলে তাৎক্ষণিক সাউন্ড ও পপআপ অ্যালার্ট।' },
      { title: 'পেমেন্ট ম্যানেজমেন্ট', desc: 'সমস্ত সাপোর্টেড ইউপিআই অ্যাপের মাধ্যমে অনলাইন পেমেন্ট ও ক্যাশ ভেরিফিকেশন ব্যবস্থা।' },
      { title: 'ডিজিটাল বিলিং', desc: 'আইটেমভিত্তিক জিএসটি সহ পিডিএফ বিল ডাউনলোড।' },
      { title: 'সেলস ও রিপোর্টস', desc: 'বিক্রি ও আয়ের গ্রাফিক্যাল এবং সংখ্যাগত রিপোর্ট।' },
      { title: 'ওনার কন্ট্রোল প্যানেল', desc: 'মেনু, দাম ও স্টাফ একাউন্টের ওপর ওনারের পূর্ণ নিয়ন্ত্রণ।' },
      { title: 'এআই হেল্প অ্যাসিস্ট্যান্ট', desc: 'সিস্টেমের ফিচার বুঝতে সাহায্য করার জন্য এআই অ্যাসিস্ট্যান্ট।' },
      { title: 'লার্নিং ও সাপোর্ট', desc: 'স্টাফদের কাজ শেখানোর জন্য ধাপভিত্তিক নির্দেশিকা।' }
    ],

    moreThanSoftwareTag: 'আমাদের দৃষ্টিভঙ্গি',
    moreThanSoftwareTitle: 'সফটওয়্যারের চেয়েও বেশি কিছু',
    moreThanSoftwareSub: 'ডিজিমমস শুধু সফটওয়্যার প্রদান করে না। আমরা প্রযুক্তি, ডিজিটাল টুলস, সহজ পরিচালনা এবং শেখার সুযোগের মাধ্যমে রেস্তোরাঁকে সহায়তার লক্ষ্য রাখি।',
    moreThanSoftwarePillars: [
      { title: 'আধুনিক প্রযুক্তি', desc: 'যেকোনো স্মার্টফোন থেকে ব্যবহারযোগ্য দ্রুত ও নির্ভরযোগ্য ক্লাউড প্রযুক্তি।' },
      { title: 'ডিজিটাল সুবিধা', desc: 'অটোমেটেড অর্ডার, কিচেন টিকিট এবং তাৎক্ষণিক ডিজিটাল বিল।' },
      { title: 'অপারেশনাল লার্নিং', desc: 'আধুনিক রেস্তোরাঁ পরিচালনা সহজে বুঝতে সাহায্যকারী গাইড।' },
      { title: 'এআই-সহায়তা', desc: 'ইংরেজি, বাংলা বা হিন্দিতে সিস্টেমের প্রশ্নের উত্তর দেওয়া এআই সঙ্গী।' },
      { title: 'বিজনেস সাপোর্ট', desc: 'টেকনিক্যাল সেটআপের জন্য এজেন্সির সার্বিক সহায়তা।' },
      { title: 'ক্রমাগত উন্নতি', desc: 'ব্যবহারকারীদের মতামতের ওপর ভিত্তি করে নিয়মিত সফটওয়্যার আপডেট।' }
    ],
    moreThanSoftwareDisclaimer: 'বিশেষ দ্রষ্টব্য: ডিজিমমস সফটওয়্যার প্রযুক্তি, ডিজিটাল টুলস এবং পরিচালনার তথ্য প্রদান করে। আমরা রেস্তোরাঁ মালিক ও স্টাফদের কার্যক্ষমতা বাড়াতে সাহায্য করি। আমরা কোনো গ্যারান্টিযুক্ত আয়, অতিরিক্ত গ্রাহক বা নিশ্চিত মুনাফার দাবি করি না।',

    aiAssistantTag: 'বুদ্ধিমান নির্দেশিকা',
    aiAssistantTitle: 'আপনার এআই হেল্প অ্যাসিস্ট্যান্ট',
    aiAssistantSub: 'ডিজিমমস ওএস-এ রয়েছে একটি বিল্ট-ইন এআই হেল্প অ্যাসিস্ট্যান্ট যা রেস্তোরাঁ মালিক ও স্টাফদের সিস্টেমের প্রতিটি ধাপ সহজে বুঝতে সাহায্য করে।',
    aiCapabilitiesTitle: 'এআই অ্যাসিস্ট্যান্ট আপনাকে যা যা বুঝতে সাহায্য করে:',
    aiCapabilities: [
      'কোন মেনু কীভাবে তৈরি করবেন এবং আইটেম সাজাবেন',
      'কীভাবে নতুন অর্ডার তৈরি, আপডেট বা বাতিল করবেন',
      'কীভাবে টেবিল পরিচালনা, সক্রিয় সেশন ও টেবিল পিন ব্যবহার করবেন',
      'কীভাবে কিচেন স্টাফ KDS স্ক্রিন ব্যবহার করে রান্নার আপডেট দেবেন',
      'কীভাবে ওয়েটারের কাজ, টেবিল বরাদ্দ এবং কাস্টমার কল কাজ করে',
      'কীভাবে পেমেন্ট স্ট্যাটাস (পেন্ডিং, ভেরিফায়েড, ক্যাশ, অনলাইন) কাজ করে',
      'কীভাবে সেলস রিপোর্ট ও জিএসটি হিসাব দেখবেন',
      'কীভাবে রেস্তোরাঁর সেটিংস, লোগো ও লিগ্যাল তথ্য পরিবর্তন করবেন',
      'কীভাবে সাউন্ড অ্যালার্ট ও নোটিফিকেশন বুঝতে পারবেন',
      'ড্যাশবোর্ডের বিভিন্ন অপশন ও তথ্যের অর্থ কী'
    ],
    aiLanguagesTitle: 'সহায়তার ভাষা সমুহ:',
    aiLanguagesDesc: 'ইংরেজি (English), বাংলা এবং হিন্দিতে (हिन्दी) সম্পূর্ণ উপলব্ধ।',
    aiContextNotice: 'মনে রাখবেন: ভাষা পরিবর্তনের মাধ্যমে দেশের তথ্য পরিবর্তিত হয় না। ডিজিমমস সম্পূর্ণ ভারতীয় প্ল্যাটফর্ম যা ভারতীয় টাকা (₹ INR) এবং পেমেন্ট ব্যবস্থা ব্যবহার করে।',

    learnTag: 'স্টাফ দক্ষতা বৃদ্ধি',
    learnTitle: 'কাজের সাথে সাথে শিখুন (Learn While You Work)',
    learnSub: 'ডিজিমমস এমনভাবে ডিজাইন করা হয়েছে যাতে কেবল টুলস দেওয়াই নয়, বরং মালিক ও স্টাফরা দৈনন্দিন কাজে সেই প্রযুক্তি ব্যবহার করতে পারেন।',
    learnPoints: [
      { title: 'ধাপ-ভিত্তিক নির্দেশিকা', desc: 'প্রতিটি স্ক্রিন ও কাজের জন্য সহজ স্পষ্ট নির্দেশনা।' },
      { title: 'ইন্টারঅ্যাক্টিভ এআই সাহায্য', desc: 'পোর্টালের ভেতরে যেকোনো সময় প্রশ্ন করে সমাধান নেওয়ার সুযোগ।' },
      { title: 'স্টাফ অনবোর্ডিং সাপোর্ট', desc: 'ওয়েটার ও কিচেন স্টাফদের জন্য অত্যন্ত সহজ ইন্টারফেস।' },
      { title: 'অপারেশনাল ব্যাখ্যা', desc: 'কেন কোন ধাপটি গুরুত্বপূর্ণ তার স্পষ্ট বর্ণনা।' }
    ],
    learnDisclaimer: 'ডিজিমমস সফটওয়্যার ও লার্নিং সহায়তা প্রদান করে; এটি রেস্তোরাঁ মালিকের স্টাফ ট্রেনিং ও ব্যবসা সংক্রান্ত নিজস্ব সিদ্ধান্তের বিকল্প নয়।',

    journeyTag: 'আমাদের পথচলা',
    journeyTitle: 'আমাদের পথচলা (Our Journey)',
    journeyFounder: 'তন্ময় জানা (প্রতিষ্ঠাতা ও সিইও)',
    journeyEstablished: 'প্রতিষ্ঠিত: ২০২৪',
    journeyStory: 'ডিজিমমস মার্কেটিং এজেন্সি ২০২৪ সালে তন্ময় জানা প্রতিষ্ঠা করেন। স্থানীয় ব্যবসাগুলোকে ডিজিটাল উপস্থিতিতে সাহায্য করার লক্ষ্য নিয়ে যাত্রা শুরু করে, ডিজিমমস পরবর্তীতে রেস্তোরাঁ খাতের জন্য একটি সম্পূর্ণ ডিজিটাল অপারেটিং সিস্টেম — "ডিজিমমস স্মার্ট রেস্তোরাঁ ওএস" তৈরি করে।',

    visionTag: 'মূল লক্ষ্য',
    visionTitle: 'আমাদের ভিশন (Our Vision)',
    visionStatement: '"আধুনিক ডিজিটাল প্রযুক্তিকে প্রতিটি ব্যবসার জন্য সহজলভ্য ও সহজে বোধগম্য করে তোলা।"',
    visionPillars: [
      { title: 'প্রযুক্তি (Technology)', desc: 'দ্রুত গতিসম্পন্ন ও নির্ভরযোগ্য ক্লাউড সফটওয়্যার।' },
      { title: 'সহজতা (Simplicity)', desc: 'স্টাফদের ব্যবহারের উপযোগী অত্যন্ত সহজ ইন্টারফেস।' },
      { title: 'শিক্ষা (Learning)', desc: 'ডিজিটাল পরিচালনা বোঝার ব্যবহারিক দিকনির্দেশনা।' },
      { title: 'সহায়তা (Support)', desc: 'প্রয়োজনে এজেন্সির দ্রুত টেকনিক্যাল সাপোর্ট।' }
    ],

    privacyTag: 'ডেটা সুরক্ষা ও গোপনীয়তা',
    privacyTitle: 'রেস্তোরাঁর ডেটা গোপনীয়তা ও আইসোলেশন',
    privacySub: 'আপনার রেস্তোরাঁর একাউন্ট, মালিকের বিবরণ, বিক্রির হিসাব ও কাস্টমার ডাটা ১০০% গোপন ও সুরক্ষিত থাকে।',
    privacyPoints: [
      'পাবলিক ওয়েবসাইটে রেস্তোরাঁর অভ্যন্তরীণ বিক্রির তথ্য বা একাউন্ট ডেটা প্রকাশ করা হয় না',
      'প্রতিটি স্বতন্ত্র রেস্তোরাঁ একাউন্টের মধ্যে সম্পূর্ণ ডেটা আইসোলেশন বজায় থাকে',
      'মালিকের প্রাইভেট ড্যাশবোর্ড কেবল পাসওয়ার্ড দ্বারা সুরক্ষিত',
      'মালিক চাইলে কেবল তার নিজস্ব রেস্তোরাঁ লিংক e.g. /r/restaurant-slug কাস্টমারদের জন্য ব্যবহার করতে পারেন'
    ],

    pricingTag: 'সহজ প্রাইসিং',
    pricingTitle: 'ডিজিমমস ওএস সাবস্ক্রিপশন প্ল্যান',
    pricingSub: 'স্বচ্ছ ভারতীয় প্রাইসিং, অর্ডারের ওপর কোনো কমিশন ফি নেই।',
    pricingPlanMonthly: 'মাসিক স্যাশ প্ল্যান',
    pricingPlanPrice: '₹৯৯৯ / মাস',
    pricingPlanDesc: 'QR অর্ডারিং, কিচেন KDS, ওয়েটার টার্মিনাল, ওনার ড্যাশবোর্ড এবং এআই হেল্প অ্যাসিস্ট্যান্ট অন্তর্ভুক্ত।',

    legalDisclaimerTitle: 'আইনি সত্ত্বা ও প্ল্যাটফর্ম ঘোষণা',
    legalDisclaimerText: 'ডিজিমমস মার্কেটিং এজেন্সি সফটওয়্যার ও প্রযুক্তি সেবা প্রদানকারী প্রতিষ্ঠান। ডিজিমমস ওএস ব্যবহারকারী প্রতিটি রেস্তোরাঁ স্বতন্ত্র ব্যবসা প্রতিষ্ঠান এবং তারা তাদের খাবারের গুণমান, দাম, এফএসএসএআই (FSSAI) লাইসেন্স, জিএসটি ট্যাক্স ও কাস্টমার সার্ভিসের জন্য নিজেরাই দায়বদ্ধ।',

    faqTag: 'প্রশ্ন আছে?',
    faqTitle: 'সাধারণ জিজ্ঞাসাসমূহ (FAQ)',
    faqItems: [
      {
        q: 'ডিজিমমস কি সুইগি বা জোম্যাটোর মতো ফুড ডেলিভারি অ্যাপ?',
        a: 'না। ডিজিমমস একটি সফটওয়্যার প্রযুক্তি প্রদানকারী প্রতিষ্ঠান। আমরা রেস্তোরাঁকে সরাসরি কিউআর অর্ডারিং, কিচেন KDS, ওয়েটার টার্মিনাল ও ডিজিটাল বিলিং সফটওয়্যার প্রদান করি কোনো কমিশন ছাড়া।'
      },
      {
        q: 'কী ধরনের কারেন্সি ও পেমেন্ট অপশন সমর্থিত?',
        a: 'ডিজিমমস সম্পূর্ণ ভারতীয় টাকায় (₹ INR) পরিচালিত হয়। এতে ক্যাশ পেমেন্ট এবং সমস্ত সাপোর্টেড ইউপিআই অ্যাপ সহ অনলাইন পেমেন্ট সুবিধা রয়েছে।'
      },
      {
        q: 'এআই হেল্প অ্যাসিস্ট্যান্ট কীভাবে কাজ করে?',
        a: 'পোর্টালের ভেতরেই এআই অ্যাসিস্ট্যান্ট যুক্ত আছে। ব্যবহারকারীরা ইংরেজি, বাংলা বা হিন্দিতে প্রশ্ন করে মেনু, কিচেন অর্ডার, ওয়েটার কল ও রিপোর্ট ব্যবহারের নিয়ম জানতে পারেন।'
      },
      {
        q: 'আমার রেস্তোরাঁর বিক্রির তথ্য কি অন্য কেউ দেখতে পাবে?',
        a: 'না। প্রতিটি রেস্তোরাঁর হিসাব, কাস্টমার তথ্য ও একাউন্ট ১০০% গোপন ও নিরাপদ থাকে।'
      }
    ],

    contactTag: 'শুরু করুন',
    contactTitle: 'আজই আপনার রেস্তোরাঁকে ডিজিটালাইজ করুন',
    contactSub: 'ডিজিমমস স্মার্ট রেস্তোরাঁ ওএস শুরু করতে বা আমাদের সাথে কথা বলতে যোগাযোগ করুন।',
    contactCta: 'ওএস প্ল্যান দেখুন (শুরু ₹৯৯৯/মাস)',
    whatsappCta: 'হোয়াটসঅ্যাপ এজেন্সি: +91 9475388085'
  },

  hi: {
    heroTag: 'DigiMoms मार्केटिंग एजेंसी • स्मार्ट रेस्टोरेंट OS',
    heroTitleLine1: 'व्यवसायों और रेस्टोरेंटों को सशक्त बनाएं',
    heroTitleLine2: 'स्मार्ट वेब और ऑपरेटिंग सिस्टम से',
    heroSubtitle: 'DigiMoms मार्केटिंग एजेंसी वेब सेवाएं प्रदान करती है और DigiMoms स्मार्ट रेस्टोरेंट OS बनाती है — जो भारतीय रेस्टोरेंटों के लिए ₹999/माह से शुरू होने वाला एक संपूर्ण डिजिटल रेस्टोरेंट मैनेजमेंट इकोसिस्टम है।',
    ctaGetOs: 'रेस्टोरेंट OS प्राप्त करें (मात्र ₹999/माह से)',
    ctaTestQr: 'लाइव QR मेनू स्कैन टेस्ट करें',
    statPrice: '₹999 / माह',
    statPriceSub: 'किफायती शुरुआती प्लान',
    statTrial: '15-दिन का ट्रायल',
    statTrialSub: 'एडमिन द्वारा ऑफर करने पर',
    statAgency: 'वेब एजेंसी',
    statAgencySub: 'कस्टम वेबसाइट्स व ऐप्स',
    statPrivate: '100% प्राइवेट',
    statPrivateSub: 'सुरक्षित पृथक अकाउंट्स',

    langBannerTitle: 'अपनी पसंदीदा भाषा चुनें',
    langBannerDesc: 'अंग्रेजी, বাংলা (बंगाली) या हिन्दी चुनें। सभी फीचर्स भारतीय संदर्भ और ₹ INR मुद्रा में ही संचालित होते हैं।',

    agencyTag: 'फुल-सर्विस वेब और सॉफ्टवेयर डेवलपमेंट',
    agencyTitle: 'DigiMoms मार्केटिंग एजेंसी सेवाएं',
    agencySub: 'हमारे फ्लैगशिप रेस्टोरेंट OS के अलावा, DigiMoms आधुनिक ब्रांड्स के लिए कस्टम वेब, ई-कॉमर्स और सॉफ्टवेयर विकसित करती है।',
    agencyService1Title: 'कस्टम वेबसाइट डेवलपमेंट',
    agencyService1Desc: 'React, Tailwind CSS और कस्टम CMS बैकएंड के साथ उच्च गति वाली आधुनिक वेबसाइट्स।',
    agencyService2Title: 'ई-कॉमर्स और SaaS उत्पाद',
    agencyService2Desc: 'सुरक्षित पेमेंट गेटवे (UPI, कार्ड, नेट बैंकिंग), इन्वेंट्री ट्रैकिंग और ऑटोमेटेड क्लाइंट बिलिंग के साथ ऑनलाइन स्टोर्स।',
    agencyService3Title: 'एंड्रॉइड और iOS मोबाइल ऐप्स',
    agencyService3Desc: 'खुदरा व्यापार और सेवा उद्योगों के लिए React Native और Flutter आधारित मोबाइल एप्लीकेशन।',

    osTag: 'फ्लैगशिप रेस्टोरेंट इकोसिस्टम',
    osTitle: 'DigiMoms स्मार्ट रेस्टोरेंट OS',
    osSub: 'एक संपूर्ण डिजिटल रेस्टोरेंट मैनेजमेंट इकोसिस्टम जो QR ऑर्डरिंग, किचन डिस्प्ले, वेटर डिस्पैच और ओनर कंट्रोल को जोड़ता है।',
    osStep1Title: '1. गेस्ट QR स्कैन करें',
    osStep1Desc: 'ग्राहक किसी भी कैमरा से टेबल QR कोड स्कैन करके बिना ऐप डाउनलोड किए मेनू देख सकते हैं।',
    osStep2Title: '2. इंटरएक्टिव डिजिटल मेनू',
    osStep2Desc: 'वेज/नॉन-वेज फ़िल्टर करें, भारतीय रुपये (₹) में मूल्य देखें, भाषा चुनें और कुकिंग नोट्स जोड़ें।',
    osStep3Title: '3. किचन KDS टिकट',
    osStep3Desc: 'ऑर्डर दर्ज होते ही किचन डिस्प्ले स्क्रीन पर ऑडियो अलर्ट के साथ टिकट पहुंच जाता है।',
    osStep4Title: '4. सर्विस और PDF इनवॉइस',
    osStep4Desc: 'वेटर भोजन परोसते हैं, नकद या ऑनलाइन (UPI, कार्ड, नेट बैंकिंग) से भुगतान होता है और ग्राहक को डिजिटल PDF बिल मिलता है।',

    whyChooseTag: 'केवल एक ऑर्डरिंग पेज से कहीं अधिक',
    whyChooseTitle: 'DigiMoms स्मार्ट रेस्टोरेंट OS क्यों चुनें?',
    whyChooseSub: 'DigiMoms केवल भोजन ऑर्डर करने की वेबसाइट नहीं है। यह भारत में रेस्टोरेंट संचालन को आसान और सुव्यवस्थित बनाने वाला एक पूर्ण डिजिटल रेस्टोरेंट मैनेजमेंट इकोसिस्टम है।',
    whyChoosePoints: [
      { title: 'QR-आधारित टेबल ऑर्डरिंग', desc: 'प्रत्येक टेबल के लिए अलग QR कोड जिससे ग्राहक स्वयं ऑर्डर कर सकते हैं।' },
      { title: 'इंटरएक्टिव डिजिटल मेनू', desc: 'श्रेणीबद्ध, शाकाहारी/मांसाहारी चिह्नित डिजिटल मेनू।' },
      { title: 'लाइव ऑर्डर मैनेजमेंट', desc: 'पेंडिंग से किचन और टेबल परोसने तक रीयल-टाइम ऑर्डर स्थिति।' },
      { title: 'किचन डिस्प्ले सिस्टम (KDS)', desc: 'तैयारी के समय और साउंड अलर्ट के साथ समर्पित किचन स्क्रीन।' },
      { title: 'वेटर मैनेजमेंट व टर्मिनल', desc: 'टेबल और नकद भुगतान प्रबंधन के लिए पिन-सुरक्षित वेटर टर्मिनल।' },
      { title: 'कॉल वेटर सिस्टम', desc: 'पानी, चम्मच, टिश्यू, टेबल सफाई या बिल के लिए एक क्लिक पर वेटर बुलाएं।' },
      { title: 'लाइव साउंड नोटिफिकेशन', desc: 'नए ऑर्डर या वेटर कॉल आने पर तुरंत ऑडियो अलर्ट।' },
      { title: 'ऑनलाइन व नकद भुगतान वर्कफ़्लो', desc: 'सभी समर्थित यूपीआई (UPI) ऐप्स, डेबिट/क्रेडिट कार्ड और नकद भुगतान सत्यापन।' },
      { title: 'डिजिटल बिल व रसीदें', desc: 'स्वचालित जीएसटी गणना और डाउनलोड करने योग्य PDF इनवॉइस।' },
      { title: 'सेल्स व एनालिटिक्स रिपोर्ट', desc: 'दैनिक व मासिक बिक्री, ऑर्डर संख्या और लोकप्रिय व्यंजनों की रिपोर्ट।' },
      { title: 'स्टाफ गतिविधि निगरानी', desc: 'वेटर के कार्य, खाना पकाने का समय और शिफ्ट गतिविधि का अवलोकन।' },
      { title: 'संपूर्ण ओनर डैशबोर्ड', desc: 'रेस्टोरेंट के सभी कार्यों को नियंत्रित करने के लिए केंद्रीय पैनल।' },
      { title: 'रेस्टोरेंट वेबसाइट मैनेजमेंट', desc: 'लोगो, पता, समय और कानूनी पृष्ठों के साथ सार्वजनिक प्रोफाइल।' },
      { title: 'सब्सक्रिप्शन मैनेजमेंट', desc: 'पोर्टल से ही आसानी से मासिक या वार्षिक प्लान नवीनीकृत करें।' },
      { title: 'भुगतान लेनदेन रिकॉर्ड', desc: 'नकद और ऑनलाइन लेनदेन का सत्यापित रिकॉर्ड।' },
      { title: 'ग्राहक ऑर्डर इतिहास', desc: 'पूर्ण हुए ऑर्डर और ग्राहक प्रतिक्रियाओं का सुरक्षित रिकॉर्ड।' },
      { title: 'AI हेल्प असिस्टेंट', desc: 'सॉफ्टवेयर और संचालन को समझने के लिए 24/7 बुद्धिमानीपूर्ण AI सहायक।' },
      { title: 'बहुभाषी सहायता', desc: 'अंग्रेजी, बंगाली और हिंदी में संपूर्ण मार्गदर्शन।' },
      { title: 'ऑपरेशनल लर्निंग गाइड', desc: 'सेटअप, मेनू, टेबल और रिपोर्ट की चरण-दर-चरण व्याख्या।' },
      { title: 'सेंट्रलाइज्ड OS इंजन', desc: 'सुरक्षित क्लाउड प्लेटफॉर्म जो रेस्टोरेंट संचालन को सरल बनाता है।' }
    ],

    whatYouGetTag: 'व्यापक फीचर्स',
    whatYouGetTitle: 'DigiMoms OS में आपको क्या मिलता है',
    whatYouGetSub: 'दैनिक रेस्टोरेंट कार्यों को आसान बनाने के लिए सभी आवश्यक मॉड्यूल।',
    whatYouGetCards: [
      { title: 'डिजिटल रेस्टोरेंट वेबसाइट', desc: 'लोगो, पता, समय और जानकारी के साथ अपनी निजी वेब पेज।' },
      { title: 'QR टेबल ऑर्डरिंग', desc: 'टेबल के लिए QR कोड जिससे ग्राहक सीधे ऑर्डर कर सकते हैं।' },
      { title: 'टेबल मैनेजमेंट', desc: 'टेबल स्थिति ट्रैकिंग और सत्र पिन सुरक्षा।' },
      { title: 'किचन मैनेजमेंट (KDS)', desc: 'शेफ के लिए रीयल-टाइम ऑर्डर स्थिति नियंत्रण।' },
      { title: 'वेटर मैनेजमेंट', desc: 'वेटर द्वारा ऑर्डर लेने और नकद जमा करने के लिए अलग पैनल।' },
      { title: 'लाइव नोटिफिकेशन', desc: 'नया ऑर्डर आने पर तुरंत साउंड व पॉपअप अलर्ट।' },
      { title: 'पेमेंट मैनेजमेंट', desc: 'सभी समर्थित यूपीआई ऐप्स से ऑनलाइन भुगतान और नकद सत्यापन प्रणाली।' },
      { title: 'डिजिटल बिलिंग', desc: 'जीएसटी विवरण के साथ ऑटोमेटेड PDF बिल डाउनलोड।' },
      { title: 'सेल्स व रिपोर्ट्स', desc: 'बिक्री और आय के विस्तृत ग्राफिकल रिपोर्ट।' },
      { title: 'ओनर कंट्रोल पैनल', desc: 'मेनू, मूल्यों और स्टाफ अकाउंट्स पर ओनर का पूर्ण नियंत्रण।' },
      { title: 'AI हेल्प असिस्टेंट', desc: 'सिस्टम फीचर्स को समझने में मदद करने वाला AI सहायक।' },
      { title: 'लर्निंग व सपोर्ट', desc: 'स्टाफ को कार्य सिखाने के लिए चरणबद्ध मार्गदर्शन।' }
    ],

    moreThanSoftwareTag: 'हमारा दृष्टिकोण',
    moreThanSoftwareTitle: 'सॉफ्टवेयर से भी अधिक',
    moreThanSoftwareSub: 'DigiMoms केवल सॉफ्टवेयर प्रदान नहीं करता। हमारा उद्देश्य रेस्टोरेंट मालिकों और स्टाफ को आधुनिक तकनीक, डिजिटल टूल्स और सीखने के अवसरों से सशक्त बनाना है।',
    moreThanSoftwarePillars: [
      { title: 'आधुनिक तकनीक', desc: 'किसी भी स्मार्टफोन से उपयोग योग्य तीव्र और विश्वसनीय क्लाउड तकनीक।' },
      { title: 'डिजिटल सुविधा', desc: 'ऑटोमेटेड ऑर्डर, किचन टिकट और तुरंत डिजिटल बिलिंग।' },
      { title: 'ऑपरेशनल लर्निंग', desc: 'आधुनिक रेस्टोरेंट संचालन को आसानी से समझने के लिए गाइड।' },
      { title: 'AI-सहायता', desc: 'अंग्रेजी, बंगाली या हिंदी में प्रश्नों का उत्तर देने वाला AI साथी।' },
      { title: 'बिजनेस सपोर्ट', desc: 'तकनीकी सेट-अप के लिए एजेंसी की निरंतर सहायता।' },
      { title: 'निरंतर सुधार', desc: 'उपयोगकर्ताओं के फीडबैक के आधार पर नियमित सॉफ्टवेयर अपडेट।' }
    ],
    moreThanSoftwareDisclaimer: 'महत्वपूर्ण सूचना: DigiMoms सॉफ्टवेयर तकनीक, डिजिटल टूल्स और संचालन संबंधी जानकारी प्रदान करता है। हम रेस्टोरेंट मालिकों व स्टाफ की कार्यक्षमता बढ़ाने में मदद करते हैं। हम गारंटीकृत आय या ग्राहकों की संख्या का कोई झूठा दावा नहीं करते।',

    aiAssistantTag: 'बुद्धिमानीपूर्ण मार्गदर्शन',
    aiAssistantTitle: 'आपका AI हेल्प असिस्टेंट',
    aiAssistantSub: 'DigiMoms OS में एक अंतर्निहित AI हेल्प असिस्टेंट शामिल है जो रेस्टोरेंट मालिकों और कर्मचारियों को सिस्टम के हर फीचर को समझने में मदद करता है।',
    aiCapabilitiesTitle: 'AI असिस्टेंट आपको क्या समझने में मदद कर सकता है:',
    aiCapabilities: [
      'कौन से मेनू श्रेणियां बनानी हैं और व्यंजनों को कैसे व्यवस्थित करना है',
      'ग्राहक ऑर्डर कैसे बनाएं, अपडेट करें या रद्द करें',
      'टेबल प्रबंधन, सक्रिय सत्र और टेबल पिन का उपयोग कैसे करें',
      'किचन स्टाफ KDS स्क्रीन का उपयोग करके व्यंजन स्थिति कैसे अपडेट करें',
      'वेटर के कार्य, टेबल आवंटन और ग्राहक कॉल कैसे कार्य करते हैं',
      'भुगतान स्थिति (पेंडिंग, सत्यापित, नकद, ऑनलाइन) कैसे काम करती है',
      'बिक्री रिपोर्ट और जीएसटी गणना कैसे देखें और समझें',
      'रेस्टोरेंट सेटिंग्स, लोगो और कानूनी पृष्ठों को कैसे कस्टमाइज़ करें',
      'रीयल-टाइम सिस्टम नोटिफिकेशन और साउंड अलर्ट का अर्थ क्या है',
      'विभिन्न डैशबोर्ड विकल्पों और आंकड़ों का क्या अर्थ है'
    ],
    aiLanguagesTitle: 'सहायता के लिए समर्थित भाषाएं:',
    aiLanguagesDesc: 'अंग्रेजी (English), বাংলা (बंगाली), और हिन्दी (Hindi) में पूर्ण रूप से उपलब्ध।',
    aiContextNotice: 'ध्यान दें: भाषा बदलने से देश का संदर्भ नहीं बदलता है। DigiMoms पूरी तरह से भारत आधारित है, जो ₹ INR मुद्रा और भारतीय रेस्टोरेंट वर्कफ़्लो का उपयोग करता है।',

    learnTag: 'स्टाफ सशक्तिकरण',
    learnTitle: 'काम करते हुए सीखें (Learn While You Work)',
    learnSub: 'DigiMoms को केवल टूल्स प्रदान करने के लिए नहीं, बल्कि मालिकों और कर्मचारियों को दैनिक कार्यों में उन टूल्स का उपयोग करने में मदद के लिए डिज़ाइन किया गया है।',
    learnPoints: [
      { title: 'चरण-दर-चरण मार्गदर्शन', desc: 'प्रत्येक स्क्रीन और प्रक्रिया के लिए स्पष्ट निर्देश।' },
      { title: 'इंटरएक्टिव AI सहायता', desc: 'पोर्टल के भीतर कभी भी सवाल पूछकर मदद पाने की सुविधा।' },
      { title: 'स्टाफ ऑनबोर्डिंग सपोर्ट', desc: 'वेटरों और किचन कर्मचारियों के लिए अत्यंत सरल इंटरफ़ेस।' },
      { title: 'ऑपरेशनल व्याख्या', desc: 'प्रत्येक कदम और सेटिंग्स के महत्व का स्पष्ट वर्णन।' }
    ],
    learnDisclaimer: 'DigiMoms सॉफ्टवेयर और सीखने की सहायता प्रदान करता है; यह स्टाफ प्रशिक्षण और व्यावसायिक निर्णयों के लिए रेस्टोरेंट मालिक की जिम्मेदारी का विकल्प नहीं है।',

    journeyTag: 'हमारी यात्रा',
    journeyTitle: 'हमारी यात्रा (Our Journey)',
    journeyFounder: 'तन्मय जाना (संस्थापक एवं सीईओ)',
    journeyEstablished: 'स्थापना: 2024',
    journeyStory: 'DigiMoms मार्केटिंग एजेंसी की स्थापना 2024 में तन्मय जाना द्वारा की गई थी। स्थानीय व्यवसायों को डिजिटल उपस्थिति स्थापित करने में मदद करने वाली एक एजेंसी के रूप में शुरुआत करके, DigiMoms ने आतिथ्य क्षेत्र के लिए डिजिटल तकनीक — "DigiMoms स्मार्ट रेस्टोरेंट OS" का निर्माण किया।',

    visionTag: 'मूल उद्देश्य',
    visionTitle: 'हमारा विजन (Our Vision)',
    visionStatement: '"आधुनिक डिजिटल टूल्स को हर व्यवसाय के लिए आसान और सुलभ बनाना।"',
    visionPillars: [
      { title: 'तकनीक (Technology)', desc: 'तेज और विश्वसनीय क्लाउड सॉफ्टवेयर।' },
      { title: 'सरलता (Simplicity)', desc: 'कर्मचारियों के लिए सहज और आसान इंटरफ़ेस।' },
      { title: 'सीखना (Learning)', desc: 'डिजिटल संचालन समझने के लिए व्यावहारिक मार्गदर्शन।' },
      { title: 'सहायता (Support)', desc: 'आवश्यकता पड़ने पर एजेंसी का तुरंत तकनीकी सहयोग।' }
    ],

    privacyTag: 'डेटा सुरक्षा व गोपनीयता',
    privacyTitle: 'रेस्टोरेंट डेटा गोपनीयता और पृथक्करण',
    privacySub: 'आपके रेस्टोरेंट का अकाउंट डेटा, मालिक का विवरण, बिक्री रिपोर्ट और ग्राहक रिकॉर्ड 100% गोपनीय और सुरक्षित रहते हैं।',
    privacyPoints: [
      'सार्वजनिक वेबसाइट पर किसी भी रेस्टोरेंट के आंतरिक बिक्री डेटा या अकाउंट का प्रदर्शन नहीं किया जाता है',
      'प्रत्येक स्वतंत्र रेस्टोरेंट अकाउंट के बीच 100% डेटा पृथक्करण बनाए रखा जाता है',
      'मालिक का निजी डैशबोर्ड पासवर्ड द्वारा सुरक्षित रहता है',
      'मालिक चाहें तो केवल अपने रेस्टोरेंट लिंक e.g. /r/restaurant-slug का उपयोग ग्राहकों के लिए कर सकते हैं'
    ],

    pricingTag: 'पारदर्शी मूल्य निर्धारण',
    pricingTitle: 'DigiMoms OS सब्सक्रिप्शन प्लान्स',
    pricingSub: 'पारदर्शी भारतीय मूल्य, ऑर्डर पर कोई कमीशन शुल्क नहीं।',
    pricingPlanMonthly: 'मासिक SaaS प्लान',
    pricingPlanPrice: '₹999 / माह',
    pricingPlanDesc: 'QR ऑर्डरिंग, किचन KDS, वेटर टर्मिनल, ओनर डैशबोर्ड और AI हेल्प असिस्टेंट शामिल हैं।',

    legalDisclaimerTitle: 'कानूनी और प्लेटफॉर्म घोषणा',
    legalDisclaimerText: 'DigiMoms मार्केटिंग एजेंसी सॉफ्टवेयर, वेब डेवलपमेंट और डिजिटल तकनीक सेवाएं प्रदान करती है। DigiMoms OS का उपयोग करने वाला प्रत्येक रेस्टोरेंट एक स्वतंत्र व्यवसाय है जो अपने मेनू मूल्यों, खाद्य गुणवत्ता, सुरक्षा, FSSAI लाइसेंस, जीएसटी और ग्राहक सेवा के लिए स्वयं उत्तरदायी है।',

    faqTag: 'कोई प्रश्न हैं?',
    faqTitle: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
    faqItems: [
      {
        q: 'क्या DigiMoms स्विगी या जोमैटो जैसा फूड डिलीवरी ऐप है?',
        a: 'नहीं। DigiMoms एक सॉफ्टवेयर तकनीक प्रदाता है। हम रेस्टोरेंटों को प्रत्यक्ष QR टेबल ऑर्डरिंग, किचन KDS, वेटर टर्मिनल और डिजिटल बिलिंग सॉफ्टवेयर बिना किसी कमीशन के प्रदान करते हैं।'
      },
      {
        q: 'किस प्रकार की मुद्रा और भुगतान विकल्प समर्थित हैं?',
        a: 'DigiMoms पूरी तरह से भारतीय रुपये (₹ INR) में संचालित होता है। इसमें नकद भुगतान और सभी समर्थित यूपीआई ऑनलाइन भुगतान शामिल हैं।'
      },
      {
        q: 'AI हेल्प असिस्टेंट कैसे काम करता है?',
        a: 'पोर्टल के भीतर ही AI हेल्प असिस्टेंट उपलब्ध है। उपयोगकर्ता अंग्रेजी, बंगाली या हिंदी में प्रश्न पूछकर मेनू, किचन ऑर्डर, वेटर कॉल और रिपोर्ट्स के उपयोग के नियम जान सकते हैं।'
      },
      {
        q: 'क्या मेरे रेस्टोरेंट की बिक्री का डेटा गोपनीय रहेगा?',
        a: 'हाँ। प्रत्येक रेस्टोरेंट का खाता, बिक्री रिपोर्ट और ग्राहक इतिहास 100% गोपनीय और सुरक्षित रहता है।'
      }
    ],

    contactTag: 'शुरुआत करें',
    contactTitle: 'क्या आप अपने रेस्टोरेंट को डिजिटल बनाने के लिए तैयार हैं?',
    contactSub: 'DigiMoms स्मार्ट रेस्टोरेंट OS शुरू करें या हमारी एजेंसी टीम से संपर्क करें।',
    contactCta: 'OS प्लान देखें (मात्र ₹999/माह से)',
    whatsappCta: 'व्हाट्सएप एजेंसी: +91 9475388085'
  }
};
