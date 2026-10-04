import { DIGIMOMS_OFFICIAL } from '../config/officialDetails';

export interface AiHelpRequest {
  prompt: string;
  language: 'bn' | 'en' | 'hi';
  role: 'ceo' | 'owner' | 'waiter' | 'kitchen' | 'staff' | 'customer';
  currentView?: string;
  restaurantName?: string;
  activeContext?: any;
}

export interface HelpTopic {
  id: string;
  feature: string;
  role: 'ceo' | 'owner' | 'waiter' | 'kitchen' | 'customer' | 'all';
  menuPath: string;
  purpose: string;
  keywords: string[];
  steps: {
    en: string[];
    bn: string[];
    hi: string[];
  };
  commonProblems?: {
    en: string[];
    bn: string[];
    hi: string[];
  };
}

export const HELP_KNOWLEDGE_BASE: HelpTopic[] = [
  // CUSTOMER TOPICS
  {
    id: 'cust_order',
    feature: 'Placing an Order',
    role: 'customer',
    menuPath: 'Customer QR Menu Page',
    purpose: 'Select menu items and submit order to kitchen',
    keywords: ['order', 'food', 'add', 'cart', 'buy', 'অর্ডার', 'খাবার', 'যোগ', 'ऑर्डर', 'खाना'],
    steps: {
      en: [
        'Browse food items by category or use search bar.',
        'Click "+ Add" on your desired food items.',
        'Tap the sticky "View Cart & Checkout" bar at the bottom.',
        'Add optional special instructions for the chef.',
        'Select Cash or Online Payment mode.',
        'Click "Place Order" to submit directly to the kitchen.'
      ],
      bn: [
        'ক্যাটাগরি ব্রাউজ করুন অথবা সার্চ বার ব্যবহার করে খাবার খুঁজুন।',
        'পছন্দের খাবারের পাশে "+ Add" চাপুন।',
        'নিচের "কার্ট দেখুন ও অর্ডার করুন" বারে ক্লিক করুন।',
        'শেফের জন্য বিশেষ অনুরোধ থাকলে লিখে দিন।',
        'ক্যাশ বা অনলাইন পেমেন্ট সিলেক্ট করুন।',
        '"অর্ডার নিশ্চিত করুন" বোতামে চাপুন।'
      ],
      hi: [
        'श्रेणी के अनुसार भोजन ब्राउज़ करें या सर्च बार का उपयोग करें।',
        'पसंदीदा भोजन पर "+ Add" पर क्लिक करें।',
        'नीचे "कार्ट देखें और ऑर्डर करें" बार पर टैप करें।',
        'यदि चाहें तो शेफ के लिए विशेष निर्देश लिखें।',
        'कैश या ऑनलाइन भुगतान का तरीका चुनें।',
        '"ऑर्डर दें" पर क्लिक करें।'
      ]
    }
  },
  {
    id: 'cust_friend_code',
    feature: 'Friend Code / Group Dining',
    role: 'customer',
    menuPath: 'Customer QR Welcome Page',
    purpose: 'Join the same table ordering session with group members',
    keywords: ['friend code', 'pin', 'join', 'group', 'table code', 'ফ্রেন্ড কোড', 'পিন', 'গ্রুপ', 'फ्रेंड कोड', 'पिन'],
    steps: {
      en: [
        'The first person scanning the table QR starts the session and sees a 4-digit Friend Code.',
        'Friends sitting at the same table scan the QR on their phones.',
        'Enter the 4-digit Friend Code from your table friend.',
        'Click "Verify & Join Table" to order together on the same table bill.'
      ],
      bn: [
        'টেবিল QR প্রথম যে স্ক্যান করবে সে ৪-সংখ্যার ফ্রেন্ড কোড দেখতে পাবে।',
        'একই টেবিলে বসা বন্ধুরা তাদের ফোনে QR স্ক্যান করবেন।',
        'বন্ধু থেকে প্রাপ্ত ৪-সংখ্যার ফ্রেন্ড কোডটি ইনপুট বক্সে লিখুন।',
        '"যাচাই করুন ও টেবিলে যোগ দিন" বোতামে চাপুন।'
      ],
      hi: [
        'टेबल QR स्कैन करने वाला पहला व्यक्ति 4-अंकीय फ्रेंड कोड देखता है।',
        'टेबल पर बैठे दोस्त अपने फोन पर QR स्कैन करते हैं।',
        'अपने दोस्त से मिला 4-अंकीय फ्रेंड कोड दर्ज करें।',
        '"सत्यापित करें और शामिल हों" पर क्लिक करें।'
      ]
    }
  },
  {
    id: 'cust_call_waiter',
    feature: 'Calling a Waiter',
    role: 'customer',
    menuPath: 'Header -> Bell Icon / Call Waiter',
    purpose: 'Request table assistance, water, spoon, tissue or bill',
    keywords: ['call waiter', 'waiter', 'water', 'spoon', 'tissue', 'bill', 'কল', 'ওয়েটার', 'জল', 'বিল', 'वेटर', 'पानी', 'बिल'],
    steps: {
      en: [
        'Tap the "Call Waiter" (Bell icon) button at the top header.',
        'Select request type: Water, Spoon/Fork, Tissue, Table Cleaning, or Bill.',
        'Click "Send Request".',
        'Waiter Terminal immediately plays a sound alert and notifies assigned waiter.'
      ],
      bn: [
        'উপরে "Call Waiter" (ঘণ্টি আইকন) বোতামে চাপুন।',
        'অনুরোধের ধরন সিলেক্ট করুন: জল, চামচ, টিস্যু, টেবিল পরিষ্কার বা বিল।',
        '"Send Request" চাপুন।',
        'ওয়েটার টার্মিনালে সাথে সাথে সংকেত যাবে।'
      ],
      hi: [
        'ऊपर "Call Waiter" बटन पर टैप करें।',
        'अनुरोध चुनें: पानी, चम्मच, टिश्यू, टेबल सफाई, या बिल।',
        '"Send Request" पर क्लिक करें।',
        'वेटर टर्मिनल पर तुरंत नोटिफिकेशन साउंड बजेगा।'
      ]
    }
  },

  // WAITER TOPICS
  {
    id: 'waiter_calls',
    feature: 'Accepting Waiter Calls',
    role: 'waiter',
    menuPath: 'Waiter Terminal -> Waiter Calls Tab',
    purpose: 'Respond to customer requests at tables',
    keywords: ['waiter call', 'accept call', 'table request', 'call', 'কল', 'গ্রহণ', 'कॉल'],
    steps: {
      en: [
        'Open Waiter Terminal.',
        'Flashing cards appear under "New Waiter Calls" with table number and request details.',
        'Click "Accept" to acknowledge.',
        'Visit the table and provide requested items.',
        'Click "Complete" to close the call request.'
      ],
      bn: [
        'ওয়েটার টার্মিনাল খুলুন।',
        '"New Waiter Calls" ট্যাবে টেবিল নম্বরসহ সংকেত দেখতে পাবেন।',
        '"Accept" চেপে অনুরোধ গ্রহণ করুন।',
        'টেবিলে গিয়ে কাস্টমারকে পরিষেবা দিন।',
        '"Complete" চাপুন।'
      ],
      hi: [
        'वेटर टर्मिनल खोलें।',
        '"New Waiter Calls" टैब में टेबल नंबर देखें।',
        '"Accept" पर क्लिक करें।',
        'टेबल पर जाकर सहायता प्रदान करें।',
        '"Complete" दबाएं।'
      ]
    }
  },
  {
    id: 'waiter_cash_confirm',
    feature: 'Confirming Cash Payments',
    role: 'waiter',
    menuPath: 'Waiter Terminal -> Orders Tab',
    purpose: 'Verify and record cash received from dine-in guests',
    keywords: ['cash payment', 'confirm cash', 'received cash', 'ক্যাশ', 'পেমেন্ট', 'টাকা', 'कैश', 'भुगतान'],
    steps: {
      en: [
        'In Waiter Terminal, find the order showing "Pending Cash Payment" (Amber badge).',
        'Collect the exact amount from the guest.',
        'Click the green "Confirm Cash Payment" button.',
        'The order is instantly updated to "Paid (Cash)" and synchronized with Kitchen & Owner Dashboard.'
      ],
      bn: [
        'ওয়েটার টার্মিনালে "Pending Cash Payment" চিহ্নিত অর্ডারটি খুঁজুন।',
        'কাস্টমারের কাছ থেকে নগদ অর্থ গ্রহণ করুন।',
        'সবুজ "Confirm Cash Payment" বোতামে চাপুন।',
        'অর্ডারটি সরাসরি "Paid (Cash)" হিসেবে সংরক্ষিত হবে।'
      ],
      hi: [
        'वेटर टर्मिनल में "Pending Cash Payment" वाला ऑर्डर खोजें।',
        'ग्राहक से नकद राशि प्राप्त करें।',
        'हरे रंग के "Confirm Cash Payment" बटन पर क्लिक करें।'
      ]
    }
  },

  // KITCHEN TOPICS
  {
    id: 'kds_workflow',
    feature: 'Kitchen Display System (KDS) Order Lifecycle',
    role: 'kitchen',
    menuPath: 'Kitchen Display System',
    purpose: 'Manage order preparation workflow from pending to ready',
    keywords: ['kds', 'kitchen', 'cooking', 'ready', 'accept order', 'কিচেন', 'রান্না', 'অর্ডার', 'किचन', 'कुक'],
    steps: {
      en: [
        'New incoming orders sound an alert tone and display under "Pending Orders" (Amber).',
        'Click "Accept Order" (Blue) to assign cooking team.',
        'Click "Start Cooking" (Purple) when food preparation begins.',
        'When dishes are plated and ready for pickup, click "Mark Ready" (Green).',
        'Assigned Waiter Terminal immediately receives a pickup notification.'
      ],
      bn: [
        'নতুন অর্ডার আসলে কিচেন ডিসপ্লেতে অডিও সংকেত বাজবে।',
        '"Accept Order" (নীল) চেপে অর্ডার গ্রহণ করুন।',
        'রান্না শুরু হলে "Start Cooking" (বেগুনি) চাপুন।',
        'খাবার প্রস্তুত হলে "Mark Ready" (সবুজ) বোতামে চাপুন।'
      ],
      hi: [
        'नया ऑर्डर आने पर किचन डिस्प्ले में ऑडियो अलर्ट बजेगा।',
        '"Accept Order" पर क्लिक करें।',
        'पकाना शुरू होने पर "Start Cooking" दबाएं।',
        'खाना तैयार होने पर "Mark Ready" दबाएं।'
      ]
    }
  },

  // OWNER TOPICS
  {
    id: 'owner_menu',
    feature: 'Menu Management',
    role: 'owner',
    menuPath: 'Owner Dashboard -> Menu Management',
    purpose: 'Add categories, food items, prices and availability',
    keywords: ['menu', 'add item', 'price', 'food item', 'category', 'মেনু', 'আইটেম', 'দাম', 'मेनू', 'आइटम'],
    steps: {
      en: [
        'Navigate to "Menu Management" tab in Owner Dashboard.',
        'Click "+ Add Category" to create sections like Starters, Main Course, Beverages.',
        'Click "+ Add Item", enter dish name, description, price in ₹ INR, and upload an image.',
        'Toggle item availability switch anytime a dish goes out of stock.'
      ],
      bn: [
        'ওনার ড্যাশবোর্ডে "Menu Management" ট্যাবে যান।',
        'নতুন ক্যাটাগরি তৈরি করতে "+ Add Category" চাপুন।',
        'খাবার যোগ করতে "+ Add Item" চেপে নাম, বিবরণ ও দাম (₹) লিখুন।'
      ],
      hi: [
        'ओनर डैशबोर्ड में "Menu Management" टैब पर जाएं।',
        'नई श्रेणी बनाने के लिए "+ Add Category" पर क्लिक करें।',
        'नया भोजन जोड़ने के लिए "+ Add Item" दबाएं।'
      ]
    }
  },
  {
    id: 'owner_qr',
    feature: 'Table QR Code Generation',
    role: 'owner',
    menuPath: 'Owner Dashboard -> Tables & QR Codes',
    purpose: 'Generate high-resolution printable table QR codes',
    keywords: ['qr code', 'table qr', 'print qr', 'generate qr', 'কিউআর', 'টেবিল', 'क्यूआर कोड'],
    steps: {
      en: [
        'Go to "Tables & QR" tab in Owner Dashboard.',
        'Set total dining tables count.',
        'Click "Download All Table QRs" for print-ready high-DPI QR graphics.',
        'Print and place stickers on dining tables for contactless ordering.'
      ],
      bn: [
        'ওনার ড্যাশবোর্ডে "Tables & QR" ট্যাবে যান।',
        'টেবিলের সংখ্যা নির্ধারণ করুন।',
        '"Download All Table QRs" চাপুন প্রিন্ট করার জন্য।'
      ],
      hi: [
        'ओनर डैशबोर्ड में "Tables & QR" टैब पर जाएं।',
        'टेबल्स की संख्या सेट करें और QR कोड डाउनलोड करें।'
      ]
    }
  },

  // CEO TOPIC
  {
    id: 'ceo_restaurants',
    feature: 'Tenant Restaurant Management & Agreements',
    role: 'ceo',
    menuPath: 'CEO Control Panel -> Restaurants & Agreements',
    purpose: 'Onboard restaurants, configure free trials and generate official agreements',
    keywords: ['tenant', 'agreement', 'contract', 'add restaurant', 'চুক্তিপত্র', 'রেস্তোরাঁ', 'अनुबंध'],
    steps: {
      en: [
        'Log in to CEO Control Panel.',
        'Navigate to "Agreement Generator" or "Restaurants" tab.',
        'Select target restaurant and configure trial days, start date, and monthly subscription amount.',
        'Select language: English or বাংলা (Bengali).',
        'Click "Generate Agreement PDF" for direct client-side download.'
      ],
      bn: [
        'সিইও কন্ট্রোল প্যানেলে লগইন করুন।',
        '"Agreement Generator" ট্যাবে যান।',
        'রেস্তোরাঁ সিলেক্ট করে ট্রায়ালের মেয়াদ ও মাসিক সাবস্ক্রিপশন ফি সেট করুন।',
        'ভাষা নির্বাচন করুন: English বা বাংলা।',
        '"Generate Agreement PDF" বোতামে চাপুন।'
      ],
      hi: [
        'CEO कंट्रोल पैनल में जाएं।',
        '"Agreement Generator" टैब खोलें और विवरण सेट करें।'
      ]
    }
  },

  // SUPPORT & CONTACT TOPIC
  {
    id: 'support_contact',
    feature: 'DigiMoms Official Support & Helpdesk',
    role: 'all',
    menuPath: 'Official Support Channels',
    purpose: 'Get official technical assistance, onboarding help, or billing support',
    keywords: ['support', 'whatsapp', 'contact', 'helpdesk', 'phone', 'number', 'হোয়াটসঅ্যাপ', 'যোগাযোগ', 'সাহায্য', 'হোয়াটসঅ্যাপ', 'व्हाट्सएप', 'सपोर्ट', 'नंबर'],
    steps: {
      en: [
        `WhatsApp Support Line: ${DIGIMOMS_OFFICIAL.whatsapp} (${DIGIMOMS_OFFICIAL.phone})`,
        `Official Email: ${DIGIMOMS_OFFICIAL.email}`,
        `Company: ${DIGIMOMS_OFFICIAL.companyName} (${DIGIMOMS_OFFICIAL.productName})`,
        `Founder & Representative: ${DIGIMOMS_OFFICIAL.ownerName} (${DIGIMOMS_OFFICIAL.location})`,
        `Web Portals: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}`,
        `Operating Hours: ${DIGIMOMS_OFFICIAL.operatingHours}`,
        `Supported Payment Gateways: ${DIGIMOMS_OFFICIAL.supportedGateways.join(', ')}`
      ],
      bn: [
        `হোয়াটসঅ্যাপ সাপোর্ট নম্বর: ${DIGIMOMS_OFFICIAL.whatsapp} (${DIGIMOMS_OFFICIAL.phone})`,
        `অফিসিয়াল ইমেইল: ${DIGIMOMS_OFFICIAL.email}`,
        `কোম্পানি: ${DIGIMOMS_OFFICIAL.companyName} (${DIGIMOMS_OFFICIAL.productName})`,
        `প্রতিষ্ঠাতা ও ওনার: ${DIGIMOMS_OFFICIAL.ownerName} (${DIGIMOMS_OFFICIAL.location})`,
        `ওয়েবসাইট: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}`,
        `কাজের সময়: ${DIGIMOMS_OFFICIAL.operatingHours}`
      ],
      hi: [
        `व्हाट्सएप सहायता नंबर: ${DIGIMOMS_OFFICIAL.whatsapp} (${DIGIMOMS_OFFICIAL.phone})`,
        `आधिकारिक ईमेल: ${DIGIMOMS_OFFICIAL.email}`,
        `कंपनी: ${DIGIMOMS_OFFICIAL.companyName} (${DIGIMOMS_OFFICIAL.productName})`,
        `संस्थापक एवं ओनर: ${DIGIMOMS_OFFICIAL.ownerName} (${DIGIMOMS_OFFICIAL.location})`,
        `आधिकारिक वेबसाइट: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}`,
        `सहायता समय: ${DIGIMOMS_OFFICIAL.operatingHours}`
      ]
    }
  }
];

export function generateLocalAiHelpResponse(req: AiHelpRequest): string {
  const { prompt, language = 'en', role = 'customer', restaurantName = 'DigiMoms OS' } = req;
  const p = prompt.toLowerCase().trim();

  // STRICT SAFETY ENFORCEMENT
  if (
    p.includes('password') ||
    p.includes('secret key') ||
    p.includes('token') ||
    p.includes('api key') ||
    p.includes('service_role') ||
    p.includes('supabase key') ||
    p.includes('razorpay secret') ||
    p.includes('phonepe salt') ||
    p.includes('database credentials')
  ) {
    if (language === 'bn') {
      return `নিরাপত্তা সতর্কতা: DigiMoms AI সহায়তা কোনো গোপন পাসওয়ার্ড, সার্ভিস কি (Service Role Keys), API সিক্রেট, পেমেন্ট হ্যাশ বা সিস্টেম ক্রেডেনশিয়াল প্রকাশ করে না। কোনো সমস্যার জন্য অনুমোদিত অ্যাডমিনের সাথে যোগাযোগ করুন।`;
    } else if (language === 'hi') {
      return `सुरक्षा चेतावनी: DigiMoms AI सहायता किसी भी गुप्त पासवर्ड, API सीक्रेट, सर्विस की (Service Keys), पेमेंट हैश या सिस्टम क्रेडेंशियल का खुलासा नहीं करती है।`;
    } else {
      return `Security Warning: DigiMoms AI Help Assistant is strictly forbidden from exposing passwords, authentication tokens, API secrets, Razorpay/PhonePe secret keys, or private system credentials.`;
    }
  }

  // DIRECT SUPPORT EMAIL CHECK
  if (
    (p.includes('email') || p.includes('mail') || p.includes('ইমেইল') || p.includes('ইমেল') || p.includes('ईमेल')) &&
    (p.includes('support') || p.includes('official') || p.includes('digimoms') || p.includes('contact') || p.includes('ঠিকানা') || p.includes('নম্বর'))
  ) {
    if (language === 'bn') {
      return `✉️ DigiMoms অফিশিয়াল সাপোর্ট ইমেইল: ${DIGIMOMS_OFFICIAL.email}
আপনার যেকোনো প্রযুক্তিগত বা বিলিং সংক্রান্ত প্রশ্নের জন্য ${DIGIMOMS_OFFICIAL.email} এ ইমেইল পাঠান অথবা হোয়াটসঅ্যাপে ${DIGIMOMS_OFFICIAL.whatsapp} নম্বরে যোগাযোগ করুন।`;
    } else if (language === 'hi') {
      return `✉️ DigiMoms आधिकारिक सहायता ईमेल: ${DIGIMOMS_OFFICIAL.email}
किसी भी तकनीकी या बिलिंग सहायता के लिए ${DIGIMOMS_OFFICIAL.email} पर ईमेल करें या व्हाट्सएप पर ${DIGIMOMS_OFFICIAL.whatsapp} पर संपर्क करें।`;
    } else {
      return `✉️ Official DigiMoms Support Email: ${DIGIMOMS_OFFICIAL.email}
For any technical inquiries or assistance, please reach out via email to ${DIGIMOMS_OFFICIAL.email} or WhatsApp at ${DIGIMOMS_OFFICIAL.whatsapp}.`;
    }
  }

  // DIRECT SUPPORT / WHATSAPP NUMBER CHECK
  if (
    p.includes('whatsapp') ||
    p.includes('support number') ||
    p.includes('contact number') ||
    p.includes('customer care') ||
    p.includes('help line') ||
    p.includes('phone number') ||
    p.includes('mobile number') ||
    p.includes('হোয়াটসঅ্যাপ') ||
    p.includes('সাপোর্ট নম্বর') ||
    p.includes('হোয়াটসঅ্যাপ') ||
    p.includes('যোগাযোগ নম্বর') ||
    p.includes('ফোন নম্বর') ||
    p.includes('হোয়াটসঅ্যাপ নম্বর') ||
    p.includes('व्हाट्सएप नंबर') ||
    p.includes('हेल्पलाइन')
  ) {
    if (language === 'bn') {
      return `📞 DigiMoms অফিসিয়াল সহায়তা ও যোগাযোগ:
• হোয়াটসঅ্যাপ সাপোর্ট নম্বর: ${DIGIMOMS_OFFICIAL.whatsapp} (${DIGIMOMS_OFFICIAL.phone})
• স্বত্বাধিকারী / ফাউন্ডার: ${DIGIMOMS_OFFICIAL.ownerName}
• অফিসিয়াল ইমেইল: ${DIGIMOMS_OFFICIAL.email}
• অফিসিয়াল ওয়েবসাইট: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
• কোম্পানি: ${DIGIMOMS_OFFICIAL.companyName} (${DIGIMOMS_OFFICIAL.productName})
• ঠিকানা: ${DIGIMOMS_OFFICIAL.location}
• কাজের সময়: ${DIGIMOMS_OFFICIAL.operatingHours}`;
    } else if (language === 'hi') {
      return `📞 DigiMoms आधिकारिक सहायता और संपर्क:
• व्हाट्सएप सहायता नंबर: ${DIGIMOMS_OFFICIAL.whatsapp} (${DIGIMOMS_OFFICIAL.phone})
• संस्थापक / ओनर: ${DIGIMOMS_OFFICIAL.ownerName}
• आधिकारिक ईमेल: ${DIGIMOMS_OFFICIAL.email}
• आधिकारिक वेबसाइट: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
• कंपनी: ${DIGIMOMS_OFFICIAL.companyName} (${DIGIMOMS_OFFICIAL.productName})
• पता: ${DIGIMOMS_OFFICIAL.location}
• सहायता समय: ${DIGIMOMS_OFFICIAL.operatingHours}`;
    } else {
      return `📞 DigiMoms Official Support & Helpdesk:
• Official WhatsApp / Support Line: ${DIGIMOMS_OFFICIAL.whatsapp} (${DIGIMOMS_OFFICIAL.phone})
• Founder / Owner: ${DIGIMOMS_OFFICIAL.ownerName}
• Email: ${DIGIMOMS_OFFICIAL.email}
• Official Website: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
• Company: ${DIGIMOMS_OFFICIAL.companyName} (${DIGIMOMS_OFFICIAL.productName})
• Address: ${DIGIMOMS_OFFICIAL.location}
• Operating Hours: ${DIGIMOMS_OFFICIAL.operatingHours}`;
    }
  }

  // DIRECT "WHAT IS DIGIMOMS SMART RESTAURANT OS" / COMPANY / OWNER CHECK
  if (
    p.includes('what is digimoms') ||
    p.includes('about digimoms') ||
    p.includes('who is the owner') ||
    p.includes('who is tanmoy jana') ||
    p.includes('company name') ||
    p.includes('ডিজিমমস কী') ||
    p.includes('ডিজিমমস কি') ||
    p.includes('মালিক কে') ||
    p.includes('কোম্পানি') ||
    p.includes('डिजिमॉम्स क्या है')
  ) {
    if (language === 'bn') {
      return `🏢 ${DIGIMOMS_OFFICIAL.productName} সম্পর্কে তথ্য:
• কোম্পানি: ${DIGIMOMS_OFFICIAL.companyName}
• সার্ভিস ডিভিশন: ${DIGIMOMS_OFFICIAL.productName} (${DIGIMOMS_OFFICIAL.subCompany})
• প্রতিষ্ঠাতা ও স্বত্বাধিকারী: ${DIGIMOMS_OFFICIAL.ownerName}
• ব্যবসায়িক অবস্থান: ${DIGIMOMS_OFFICIAL.location}
• হোয়াটসঅ্যাপ সাপোর্ট: ${DIGIMOMS_OFFICIAL.whatsapp}
• সাপোর্ট ইমেইল: ${DIGIMOMS_OFFICIAL.email}
• প্রধান ওয়েবসাইট: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
এটি একটি আধুনিক ডিজিটাল রেস্তোরাঁ ও কাস্টমার অর্ডারিং ম্যানেজমেন্ট সফটওয়্যার যা কিউআর মেনু, কিচেন ডিসপ্লে (KDS), লাইভ বিলিং ও পেমেন্ট গেটওয়ে প্রদান করে।`;
    } else if (language === 'hi') {
      return `🏢 ${DIGIMOMS_OFFICIAL.productName} के बारे में जानकारी:
• कंपनी: ${DIGIMOMS_OFFICIAL.companyName}
• सर्विस डिवीजन: ${DIGIMOMS_OFFICIAL.productName}
• संस्थापक एवं ओनर: ${DIGIMOMS_OFFICIAL.ownerName}
• व्यावसायिक स्थान: ${DIGIMOMS_OFFICIAL.location}
• व्हाट्सएप सहायता: ${DIGIMOMS_OFFICIAL.whatsapp}
• सहायता ईमेल: ${DIGIMOMS_OFFICIAL.email}
• आधिकारिक वेबसाइट: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}`;
    } else {
      return `🏢 About ${DIGIMOMS_OFFICIAL.productName}:
• Company: ${DIGIMOMS_OFFICIAL.companyName}
• Service Division: ${DIGIMOMS_OFFICIAL.productName} (${DIGIMOMS_OFFICIAL.subCompany})
• Founder & Authorized Representative: ${DIGIMOMS_OFFICIAL.ownerName}
• Business Location: ${DIGIMOMS_OFFICIAL.location}
• Official WhatsApp Support: ${DIGIMOMS_OFFICIAL.whatsapp}
• Support Email: ${DIGIMOMS_OFFICIAL.email}
• Official Websites: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
DigiMoms Smart Restaurant OS is a digital restaurant management and ordering software service providing QR-based menus, Kitchen Display Systems (KDS), waiter alerting, live billing, and multi-gateway payment processing.`;
    }
  }

  // DIRECT PAYMENT GATEWAYS CHECK
  if (
    p.includes('payment gateway') ||
    p.includes('payu') ||
    p.includes('phonepe') ||
    p.includes('razorpay') ||
    p.includes('পেমেন্ট গেটওয়ে') ||
    p.includes('গেটওয়ে') ||
    p.includes('पेमेंट गेटवे')
  ) {
    if (language === 'bn') {
      return `💳 সমর্থিত পেমেন্ট গেটওয়েসমূহ (Supported Payment Gateways):
DigiMoms Smart Restaurant OS সিস্টেমে উপলব্ধ এবং কনফিগার করা পেমেন্ট গেটওয়েসমূহ:
1. PayU (অনলাইন কার্ড, নেটব্যাঙ্কিং ও ইউপিআই)
2. PhonePe (ভারত-নেতৃস্থানীয় UPI ও পেমেন্ট গেটওয়ে)
3. Razorpay (নিরাপদ অনলাইন পেমেন্ট গেটওয়ে)
4. ডিরেক্ট UPI QR কোড এবং ক্যাশ পেমেন্ট (ক্যাশ অন টেবিল / কাউন্টার)
গ্রাহকদের কোন গেটওয়ে দেখানো হবে তা নির্ভর করে রেস্তোরাঁ ওনার কোন গেটওয়ে সক্রিয় করেছেন তার ওপর।`;
    } else if (language === 'hi') {
      return `💳 समर्थित पेमेंट गेटवे (Supported Payment Gateways):
1. PayU
2. PhonePe
3. Razorpay
4. डायरेक्ट UPI QR और काउंटर कैश पेमेंट`;
    } else {
      return `💳 Supported Payment Gateways:
DigiMoms Smart Restaurant OS supports the following integrated gateways:
1. PayU (Cards, NetBanking, UPI, Wallets)
2. PhonePe (India's leading UPI & Payment Gateway)
3. Razorpay (Secure multi-mode checkout)
4. Direct UPI QR Code and Cash on Table / Counter settlements
Payment options shown to dining guests depend on which gateway has been verified and activated for that restaurant.`;
    }
  }

  // ROLE PERMISSION CHECK
  if (role === 'customer' && (p.includes('ceo') || p.includes('owner login') || p.includes('secret') || p.includes('revenue') || p.includes('supabase'))) {
    if (language === 'bn') {
      return `আপনি বর্তমানে কাস্টমার ভিউতে আছেন। খাবার অর্ডার করা, ফ্রেন্ড কোড ব্যবহার, ওয়েটার ডাকা বা বিল সংক্রান্ত প্রশ্ন টাইপ করুন।`;
    } else if (language === 'hi') {
      return `आप वर्तमान में कस्टमर व्यू में हैं। कृपया भोजन ऑर्डर करने, फ्रेंड कोड, वेटर बुलाने या बिल के बारे में प्रश्न पूछें।`;
    } else {
      return `You are currently in Customer View. Please ask questions about ordering food, Friend Code, calling a waiter, online payment, or digital bills.`;
    }
  }

  // MATCH WITH HELP KNOWLEDGE BASE
  const matchedTopic = HELP_KNOWLEDGE_BASE.find(topic => {
    if (topic.role !== 'all' && topic.role !== role && role !== 'ceo' && role !== 'owner') return false;
    return topic.keywords.some(kw => p.includes(kw.toLowerCase()));
  });

  if (matchedTopic) {
    const steps = matchedTopic.steps[language] || matchedTopic.steps.en;
    const header = `📌 ${matchedTopic.feature} (${matchedTopic.menuPath}):`;
    const stepsFormatted = steps.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
    return `${header}\n\n${stepsFormatted}`;
  }

  // GENERIC ROLE-SPECIFIC FALLBACKS
  if (role === 'customer') {
    if (language === 'bn') {
      return `${restaurantName} এআই কাস্টমার সহায়তা:
আপনার প্রশ্নের উত্তর পেতে জানতে চাইতে পারেন:
1. "খাবার অর্ডার কীভাবে করব?"
2. "ফ্রেন্ড কোড কী এবং কীভাবে যুক্ত হব?"
3. "ওয়েটার কীভাবে ডাকব?"
4. "অনলাইন পেমেন্ট কীভাবে করব?"
5. "আমার বিল কীভাবে ডাউনলোড করব?"`;
    } else {
      return `${restaurantName} AI Customer Help:
You can ask:
1. "How do I place an order?"
2. "What is the Friend Code and how do I join?"
3. "How do I call a waiter?"
4. "How do I pay online?"
5. "How do I download my bill?"`;
    }
  }

  if (role === 'waiter') {
    if (language === 'bn') {
      return `ওয়েটার টার্মিনাল সহায়তা:
1. "কাস্টমার ক্যাশ পেমেন্ট কনফার্ম কীভাবে করব?"
2. "ওয়েটার কল রিকোয়েস্ট কীভাবে অ্যাকসেপ্ট করব?"
3. "রেডি খাবার টেবিলে কীভাবে সার্ভ করব?"`;
    } else {
      return `Waiter Terminal Help:
1. "How do I confirm cash payment?"
2. "How do I accept waiter calls?"
3. "How do I serve ready orders?"`;
    }
  }

  if (role === 'kitchen') {
    if (language === 'bn') {
      return `কিচেন KDS সহায়তা:
1. "নতুন অর্ডার অ্যাকসেপ্ট কীভাবে করব?"
2. "রান্না শুরু (Start Cooking) কীভাবে করব?"
3. "খাবার রেডি (Mark Ready) কীভাবে করব?"`;
    } else {
      return `Kitchen KDS Help:
1. "How do I accept a new order?"
2. "How do I start cooking?"
3. "How do I mark food ready?"`;
    }
  }

  // OWNER / CEO
  if (language === 'bn') {
    return `${restaurantName} অ্যাডমিন সাহায্য সহকারী:
আপনি প্রশ্ন করতে পারেন:
1. "নতুন মেনু আইটেম কীভাবে যোগ করব?"
2. "আজকের সেলস রিপোর্ট কীভাবে দেখব?"
3. "সাবস্ক্রিপশন কীভাবে রিনিউ করব?"
4. "টেবিল QR কোড কীভাবে তৈরি করব?"
5. "সাপোর্ট নম্বর বা হোয়াটসঅ্যাপ হেল্পডেস্ক কত?"`;
  } else {
    return `${restaurantName} Admin AI Help:
Ask any workflow question:
1. "How do I add a new menu item?"
2. "Where can I see today's sales?"
3. "How do I renew subscription?"
4. "How do I generate table QR codes?"
5. "What is DigiMoms WhatsApp support number?"`;
  }
}
