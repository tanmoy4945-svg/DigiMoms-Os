import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Bot, User, Send, X, Globe, ShieldAlert, ChevronRight, HelpCircle, RefreshCw } from 'lucide-react';
import { generateLocalAiHelpResponse, AiHelpRequest } from '../../lib/aiHelpKnowledge';
import { useSaaS } from '../../context/SaaSContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface AiHelpAssistantProps {
  role: 'ceo' | 'owner' | 'waiter' | 'kitchen' | 'staff' | 'customer';
  currentView?: string;
  restaurantName?: string;
  activeContext?: any;
}

export const AiHelpAssistant: React.FC<AiHelpAssistantProps> = ({
  role,
  currentView = 'overview',
  restaurantName = 'DigiMoms OS',
  activeContext
}) => {
  const saasContext = useSaaS();
  const globalLanguage = saasContext?.language || 'en';
  const setGlobalLanguage = saasContext?.setLanguage;

  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguageLocal] = useState<'bn' | 'en' | 'hi'>(globalLanguage);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync with global language changes
  useEffect(() => {
    setLanguageLocal(globalLanguage);
  }, [globalLanguage]);

  const setLanguage = (lang: 'bn' | 'en' | 'hi') => {
    setLanguageLocal(lang);
    if (setGlobalLanguage) {
      setGlobalLanguage(lang);
    }
  };

  // Initialize greeting message on language change or open
  useEffect(() => {
    const greetingText =
      language === 'bn'
        ? `নমস্কার! আমি DigiMoms AI সহায়তা সহকারী। (${role.toUpperCase()} - ${currentView})। আমি কীভাবে সাহায্য করতে পারি?`
        : language === 'hi'
        ? `नमस्ते! मैं DigiMoms AI सहायता सहायक हूँ। (${role.toUpperCase()} - ${currentView})। मैं आपकी क्या मदद कर सकता हूँ?`
        : `Hello! I am your DigiMoms AI Help Assistant (${role.toUpperCase()} View - ${currentView}). How can I help you today?`;

    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [language, role, currentView]);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const quickPromptsByRole = {
    customer: {
      en: [
        'How do I place an order?',
        'What is the Friend Code?',
        'How do I call a waiter?',
        'How do I pay online?',
        'Where can I see my digital bill?'
      ],
      bn: [
        'খাবার কীভাবে অর্ডার করব?',
        'ফ্রেন্ড কোড কী এবং কীভাবে যুক্ত হব?',
        'ওয়েটার কীভাবে ডাকব?',
        'অনলাইন পেমেন্ট কীভাবে করব?',
        'আমার বিল কোথায় দেখতে পাব?'
      ],
      hi: [
        'खाना ऑर्डर कैसे करें?',
        'फ्रेंड कोड क्या है?',
        'वेटर कैसे बुलाएं?',
        'ऑनलाइन भुगतान कैसे करें?',
        'मेरा बिल कहां मिलेगा?'
      ]
    },
    waiter: {
      en: [
        'How do I confirm a cash payment?',
        'How do I accept a waiter call?',
        'How do I serve ready food?',
        'How do I complete an order?'
      ],
      bn: [
        'কিভাবে নগদ পেমেন্ট নিশ্চিত করব?',
        'কাস্টমার কল কীভাবে রিসিভ করব?',
        'রেডি খাবার কীভাবে সার্ভ করব?',
        'অর্ডার কীভাবে কমপ্লিট করব?'
      ],
      hi: [
        'कैश पेमेंट कैसे कन्फर्म करें?',
        'वेटर कॉल अनुरोध कैसे स्वीकार करें?',
        'तैयार खाना कैसे परोसें?',
        'ऑर्डर कैसे पूरा करें?'
      ]
    },
    kitchen: {
      en: [
        'How do I accept a new order?',
        'How do I mark cooking in progress?',
        'How do I mark food ready?'
      ],
      bn: [
        'নতুন অর্ডার কীভাবে গ্রহণ করব?',
        'রান্না শুরু কীভাবে মার্ক করব?',
        'খাবার তৈরি (Ready) কীভাবে দেখাব?'
      ],
      hi: [
        'नया ऑर्डर स्वीकार कैसे करें?',
        'पकाना शुरू कैसे करें?',
        'खाना तैयार (Ready) कैसे मार्क करें?'
      ]
    },
    owner: {
      en: [
        'How do I add a new menu item?',
        "Where can I see today's sales?",
        'How do I generate table QR codes?',
        'How do I renew restaurant subscription?',
        'How do I configure payment gateway?'
      ],
      bn: [
        'নতুন মেনু আইটেম কীভাবে যোগ করব?',
        'আজকের সেলস রিপোর্ট কীভাবে দেখব?',
        'টেবিল QR কোড কীভাবে তৈরি করব?',
        'সাবস্ক্রিপশন কিভাবে রিনিউ করব?',
        'পেমেন্ট গেটওয়ে কীভাবে সেটআপ করব?'
      ],
      hi: [
        'नया मेनू आइटम कैसे जोड़ें?',
        'आज की बिक्री रिपोर्ट कहां देखें?',
        'टेबल क्यूआर कोड कैसे बनाएं?',
        'सब्सक्रिप्शन कैसे रिन्यू करें?',
        'पेमेंट गेटवे कैसे सेट करें?'
      ]
    },
    ceo: {
      en: [
        'How do I add a new restaurant?',
        'How do I extend a trial subscription?',
        'How do I export database backup?',
        'Where is platform revenue shown?'
      ],
      bn: [
        'নতুন রেস্তোরাঁ কীভাবে যোগ করব?',
        'ট্রায়াল সাবস্ক্রিপশন কীভাবে বাড়াব?',
        'ডেটাবেস ব্যাকআপ কীভাবে এক্সপোর্ট করব?',
        'প্ল্যাটফর্ম রাজস্ব কোথায় দেখা যাবে?'
      ],
      hi: [
        'नया रेस्तरां कैसे जोड़ें?',
        'ट्रायल सब्सक्रिप्शन कैसे बढ़ाएं?',
        'डेटाबेस बैकअप कैसे निर्यात करें?',
        'प्लेटफ़ॉर्म राजस्व कहां दिखेगा?'
      ]
    }
  };

  const getQuickPrompts = () => {
    const roleKey = role === 'staff' ? 'waiter' : role;
    const promptsForRole = quickPromptsByRole[roleKey as keyof typeof quickPromptsByRole] || quickPromptsByRole.owner;
    return promptsForRole[language] || promptsForRole.en;
  };

  const handleSendMessage = async (promptText?: string) => {
    const textToSend = promptText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptText) setInputMessage('');
    setIsLoading(true);

    try {
      const payload: AiHelpRequest = {
        prompt: textToSend,
        language,
        role,
        currentView,
        restaurantName,
        activeContext
      };

      let aiAnswer = '';

      // For general questions, prefer local instant Knowledge Base response to save DB/API cost
      aiAnswer = generateLocalAiHelpResponse(payload);

      // If generic or complex query, attempt Gemini server backend
      if (!aiAnswer || aiAnswer.includes('AI Customer Help') || aiAnswer.includes('Admin AI Help')) {
        try {
          const res = await fetch('/api/ai-help', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.answer) {
              aiAnswer = data.answer;
            }
          }
        } catch {
          // ignore API error and keep local answer
        }
      }

      if (!aiAnswer) {
        aiAnswer = generateLocalAiHelpResponse(payload);
      }

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: aiAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch {
      const fallbackAnswer = generateLocalAiHelpResponse({
        prompt: textToSend,
        language,
        role,
        currentView,
        restaurantName,
        activeContext
      });

      const botMsg: Message = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: fallbackAnswer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed z-40 transition-all transform hover:scale-105 active:scale-95 group shadow-2xl border border-white/20 flex items-center gap-1.5 sm:gap-2.5 ${
          role === 'customer'
            ? 'bottom-20 sm:bottom-24 right-3 sm:right-6 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full sm:rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold text-xs sm:text-sm shadow-indigo-500/30'
            : 'bottom-6 right-6 px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold text-sm shadow-indigo-500/40'
        }`}
        title="Open AI Help Assistant"
      >
        <div className="relative shrink-0">
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-bounce" />
          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <span className="tracking-wide text-[11px] sm:text-xs">
          {language === 'bn' ? 'এআই সহায়তা' : language === 'hi' ? 'AI मदद' : 'AI Help'}
        </span>
        <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] uppercase font-mono tracking-wider hidden sm:inline">
          {role}
        </span>
      </button>

      {/* Drawer Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-full bg-slate-900 text-white border-l border-slate-800 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shrink-0">
                  <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                      {role === 'customer' ? 'Customer AI Assistant' : 'DigiMoms AI Help Assistant'}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 text-[9px] font-mono border border-purple-500/30 uppercase shrink-0">
                      {role}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                    Context: <span className="text-emerald-400 font-medium">{restaurantName}</span> • View: <span className="text-purple-300 font-medium">{currentView}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 font-bold text-xs shrink-0"
                title="Close AI Assistant"
              >
                <span>Close</span>
                <X className="w-4 h-4 text-rose-400" />
              </button>
            </div>

            {/* Multilingual Selector */}
            <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Language:</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setLanguage('bn')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    language === 'bn'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    language === 'en'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('hi')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    language === 'hi'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-purple-600 text-white rounded-br-none shadow-md'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/60 rounded-bl-none shadow-md whitespace-pre-wrap'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div
                      className={`text-[9px] mt-1.5 text-right ${
                        msg.sender === 'user' ? 'text-purple-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 border border-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="bg-slate-800 text-slate-400 rounded-2xl p-3 text-xs border border-slate-700 flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Analyzing DigiMoms OS workflow...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested Quick Questions */}
            <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3 h-3 text-amber-400" />
                <span>Suggested Questions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {getQuickPrompts().map((qp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(qp)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] border border-slate-700/60 transition-all text-left flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>{qp}</span>
                    <ChevronRight className="w-3 h-3 text-purple-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Input Box */}
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  placeholder={
                    language === 'bn'
                      ? 'কীভাবে কোনো কাজটি করতে হবে জানতে চান লিখুন...'
                      : language === 'hi'
                      ? 'अपनी समस्या या प्रश्न यहाँ टाइप करें...'
                      : 'Ask anything about DigiMoms OS workflows...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white transition-all shrink-0 shadow-md shadow-purple-600/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-500" />
                <span>Instructional Assistant. Will not perform destructive account changes.</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
