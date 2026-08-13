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
    id: 'waiter_cash',
    feature: 'Confirming Cash Payment',
    role: 'waiter',
    menuPath: 'Waiter Terminal -> Cash Requests Tab',
    purpose: 'Verify cash received at table and update order to paid',
    keywords: ['cash', 'confirm cash', 'verify payment', 'নগদ', 'ক্যাশ', 'कैश', 'नकद'],
    steps: {
      en: [
        'Customer places order selecting Cash mode.',
        'Order appears in Waiter Terminal with "Pending Cash Payment" badge.',
        'Collect exact cash amount from customer.',
        'Click "Confirm Cash Payment" button on the order card.',
        'Order status changes to Paid (Cash) and kitchen receives prep green signal.'
      ],
      bn: [
        'কাস্টমার ক্যাশ মোডে অর্ডার দিলে তা পেন্ডিং দেখায়।',
        'ওয়েটার টার্মিনালে "Pending Cash Payment" কার্ড ভেসে ওঠে।',
        'কাস্টমার থেকে নগদ টাকা গ্রহণ করুন।',
        '"Confirm Cash Payment" বোতামে চাপুন।',
        'অর্ডার স্ট্যাটাস Paid (Cash) হবে এবং কিচেনে কাজ শুরু হবে।'
      ],
      hi: [
        'जब ग्राहक Cash चुनेगा तो स्थिति Pending होगी।',
        'वेटर टर्मिनल में "Pending Cash" कार्ड दिखेगा।',
        'ग्राहक से नकद राशि प्राप्त करें।',
        '"Confirm Cash Payment" पर क्लिक करें।',
        'ऑर्डर स्थिति Paid (Cash) हो जाएगी।'
      ]
    }
  },

  // KITCHEN TOPICS
  {
    id: 'kitchen_workflow',
    feature: 'KDS Kitchen Workflow',
    role: 'kitchen',
    menuPath: 'Kitchen Terminal (KDS)',
    purpose: 'Process new orders through prep stages',
    keywords: ['kitchen', 'cooking', 'ready', 'kds', 'রান্না', 'কিচেন', 'রেডি', 'किचन', 'पकाना'],
    steps: {
      en: [
        'New verified order arrives with status "Pending" (yellow).',
        'Chef clicks "Accept Order" -> status changes to "Accepted" (blue).',
        'Click "Start Cooking" -> status changes to "Cooking" (purple).',
        'When prepared, click "Mark Ready" -> status changes to "Ready" (green).',
        'Waiter Terminal receives instant alert to collect and serve food.'
      ],
      bn: [
        'নতুন অর্ডার পেন্ডিং (হলুদ) হিসেবে কিচেনে আসবে।',
        'শেফ "Accept Order" চাপবেন -> স্ট্যাটাস হবে Accepted (নীল)।',
        'রান্না শুরু হলে "Start Cooking" চাপবেন (বেগুনী)।',
        'খাবার তৈরি হলে "Mark Ready" চাপবেন (সবুজ)।',
        'ওয়েটার টার্মিনালে সাথে সাথে সংকেত পৌঁছে যাবে।'
      ],
      hi: [
        'नया ऑर्डर Pending (पीला) में आएगा।',
        '"Accept Order" पर क्लिक करें -> Accepted (नीला)।',
        '"Start Cooking" दबाएं -> Cooking (बैंगनी)।',
        'खाना तैयार होने पर "Mark Ready" दबाएं (हरा)।',
        'वेटर टर्मिनल को तुरंत अलर्ट मिल जाएगा।'
      ]
    }
  },

  // OWNER TOPICS
  {
    id: 'owner_menu',
    feature: 'Adding Menu Items & Categories',
    role: 'owner',
    menuPath: 'Owner Dashboard -> Menu Management Tab',
    purpose: 'Manage food categories, items, prices in ₹, and stock status',
    keywords: ['add menu', 'menu item', 'category', 'price', 'veg', 'মেনু', 'আইটেম', 'দাম', 'मेनू', 'कीमत'],
    steps: {
      en: [
        'Log in to Owner Dashboard.',
        'Navigate to "Menu Management" tab.',
        'Click "Add Category" (e.g. Starters, Beverages, Desserts).',
        'Click "Add Menu Item", enter name, description, price in ₹ INR, Veg/Non-Veg toggle, prep time, and image URL.',
        'Click "Save Item". Item becomes visible on customer QR menu immediately.'
      ],
      bn: [
        'ওনার ড্যাশবোর্ডে লগইন করুন।',
        '"Menu Management" ট্যাবে যান।',
        '"Add Category" ক্লিক করে শ্রেণী তৈরি করুন।',
        '"Add Menu Item" বোতাম চেপে নাম, বিবরণ, টাকা (₹ INR), ভেজ/ননভেজ ও ছবি দিন।',
        '"Save Item" চাপুন।'
      ],
      hi: [
        'ओनर डैशबोर्ड में लॉगिन करें।',
        '"Menu Management" टैब पर जाएं।',
        '"Add Category" पर क्लिक करके श्रेणी बनाएं।',
        '"Add Menu Item" पर क्लिक करके विवरण, मूल्य (₹ INR) और चित्र भरें।',
        '"Save Item" पर क्लिक करें।'
      ]
    }
  },
  {
    id: 'owner_renewal',
    feature: 'Subscription Renewal',
    role: 'owner',
    menuPath: 'Owner Dashboard -> Header Subscription Banner',
    purpose: 'Renew restaurant software operating license',
    keywords: ['renew', 'subscription', 'expiry', 'payment', 'রিনিউ', 'সাবস্ক্রিপশন', 'রিন্যু', 'रिन्यू', 'सब्सक्रिप्शन'],
    steps: {
      en: [
        'Click "Renew Subscription" button on the banner at top of Owner Dashboard.',
        'Choose duration: 1, 3, 6, or 12 months.',
        'Select Payment Gateway: PhonePe Live or Demo Mode.',
        'Complete online payment.',
        'Upon server verification, subscription expiry date extends automatically.'
      ],
      bn: [
        'ওনার ড্যাশবোর্ডের শীর্ষে "Renew Subscription" বোতামে চাপুন।',
        'মেয়াদ সিলেক্ট করুন (১, ৩, ৬ বা ১২ মাস)।',
        'PhonePe Live বা Demo Mode নির্বাচন করে পেমেন্ট সম্পন্ন করুন।',
        'সার্ভার ভেরিফিকেশনের পর মেয়াদ সরাসরি বৃদ্ধি পাবে।'
      ],
      hi: [
        'ओनर डैशबोर्ड के ऊपर "Renew Subscription" पर क्लिक करें।',
        'अवधि चुनें (1, 3, 6 या 12 महीने)।',
        'PhonePe Live या Demo Mode चुनकर भुगतान करें।',
        'सत्यापन के बाद सब्सक्रिप्शन तुरंत बढ़ जाएगा।'
      ]
    }
  },

  // CEO TOPICS
  {
    id: 'ceo_restaurants',
    feature: 'Managing Restaurants & Platform',
    role: 'ceo',
    menuPath: 'CEO Dashboard -> Restaurants Tab',
    purpose: 'Create new restaurant tenants, manage subscriptions & trials',
    keywords: ['ceo', 'add restaurant', 'tenant', 'platform', 'সিইও', 'রেস্তোরাঁ', 'सीईओ', 'रेस्तरां'],
    steps: {
      en: [
        'Log in to CEO Control Panel.',
        'Navigate to "Restaurants" tab.',
        'Click "Add New Restaurant", fill in restaurant name, owner contact & initial trial period.',
        'Use "Extend Trial" or "Toggle Active Status" buttons on any restaurant row to manage access.',
        'View global platform revenue and database backup status.'
      ],
      bn: [
        'সিইও কন্ট্রোল প্যানেলে লগইন করুন।',
        '"Restaurants" ট্যাবে যান।',
        '"Add New Restaurant" চাপুন এবং নাম ও কন্টাক্ট দিন।',
        'ট্রায়াল বাড়াতে "Extend Trial" বা স্ট্যাটাস পরিবর্তন করতে "Toggle Active" ব্যবহার করুন।'
      ],
      hi: [
        'CEO कंट्रोल पैनल में लॉगिन करें।',
        '"Restaurants" टैब पर जाएं।',
        '"Add New Restaurant" पर क्लिक करके नाम और संपर्क भरें।',
        'पहुंच प्रबंधित करने के लिए "Extend Trial" या "Toggle Active" का उपयोग करें।'
      ]
    }
  }
];

export function generateLocalAiHelpResponse(req: AiHelpRequest): string {
  const { prompt, language = 'en', role = 'customer', restaurantName = 'DigiMoms OS' } = req;
  const p = prompt.toLowerCase();

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
      return `सुरक्षा चेतावनी: DigiMoms AI सहायता किसी भी गुप्त पासवर्ड, API सीक्रेट, सर्विस की (Service Keys), पेमेंट हैश या सिस्टम क्रेडेंशियल का खुलासा नहीं करती है। किसी भी समस्या के लिए अधिकृत व्यवस्थापक से संपर्क करें।`;
    } else {
      return `Security Warning: DigiMoms AI Help Assistant is strictly forbidden from exposing passwords, authentication tokens, API secrets, Razorpay/PhonePe secret keys, or private system credentials. Please contact an authorized administrator.`;
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

  if ((role === 'waiter' || role === 'kitchen') && (p.includes('renew subscription') || p.includes('ceo control') || p.includes('delete restaurant'))) {
    if (language === 'bn') {
      return `আপনার রোল: ${role.toUpperCase()}। সাবস্ক্রিপশন রিনিউ ও অ্যাডমিন সেটিংস কেবল ওনার এবং সিইও পরিচালনা করতে পারেন। অর্ডার ম্যানেজমেন্ট বা কাস্টমার কল সম্পর্কিত প্রশ্ন করুন।`;
    } else if (language === 'hi') {
      return `आपकी भूमिका: ${role.toUpperCase()}। सब्सक्रिप्शन रिन्यू और एडमिन सेटिंग्स केवल ओनर और सीईओ संभाल सकते हैं। ऑर्डर मैनेजमेंट या वेटर कॉल के बारे में पूछें।`;
    } else {
      return `Your Role: ${role.toUpperCase()}. Subscription renewals and administrative configurations are reserved for Owners and CEO. Please ask about waiter or kitchen order workflows!`;
    }
  }

  // MATCH WITH HELP KNOWLEDGE BASE
  const matchedTopic = HELP_KNOWLEDGE_BASE.find(topic => {
    if (topic.role !== 'all' && topic.role !== role && role !== 'ceo' && role !== 'owner') return false;
    return topic.keywords.some(kw => p.includes(kw.toLowerCase()));
  });

  if (matchedTopic) {
    const steps = matchedTopic.steps[language] || matchedTopic.steps.en;
    const header =
      language === 'bn'
        ? `📌 ${matchedTopic.feature} (${matchedTopic.menuPath}):`
        : language === 'hi'
        ? `📌 ${matchedTopic.feature} (${matchedTopic.menuPath}):`
        : `📌 ${matchedTopic.feature} (${matchedTopic.menuPath}):`;

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
    } else if (language === 'hi') {
      return `${restaurantName} AI कस्टमर सहायता:
आप इस प्रकार के प्रश्न पूछ सकते हैं:
1. "खाना ऑर्डर कैसे करें?"
2. "फ्रेंड कोड क्या है और कैसे शामिल हों?"
3. "वेटर कैसे बुलाएं?"
4. "ऑनलाइन भुगतान कैसे करें?"
5. "अपना बिल कैसे डाउनलोड करें?"`;
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
    } else if (language === 'hi') {
      return `वेटर टर्मिनल सहायता:
1. "कैश पेमेंट कैसे कन्फर्म करें?"
2. "वेटर कॉल अनुरोध कैसे स्वीकार करें?"
3. "तैयार खाना टेबल पर कैसे परोसें?"`;
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
    } else if (language === 'hi') {
      return `किचन KDS सहायता:
1. "नया ऑर्डर स्वीकार कैसे करें?"
2. "पकाना शुरू (Start Cooking) कैसे करें?"
3. "खाना तैयार (Mark Ready) कैसे करें?"`;
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
4. "টেবিল QR কোড কীভাবে তৈরি করব?"`;
  } else if (language === 'hi') {
    return `${restaurantName} एडमिन सहायता सहायक:
आप प्रश्न पूछ सकते हैं:
1. "नया मेनू आइटम कैसे जोड़ें?"
2. "आज की बिक्री रिपोर्ट कहां देखें?"
3. "सब्सक्रिप्शन कैसे रिन्यू करें?"
4. "टेबल क्यूआर कोड कैसे बनाएं?"`;
  } else {
    return `${restaurantName} Admin AI Help:
Ask any workflow question:
1. "How do I add a new menu item?"
2. "Where can I see today's sales?"
3. "How do I renew subscription?"
4. "How do I generate table QR codes?"`;
  }
}
