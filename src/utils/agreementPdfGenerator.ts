import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Restaurant } from '../types';
import { DIGIMOMS_OFFICIAL } from '../config/officialDetails';

export type AgreementLanguage = 'en' | 'bn';

export interface AgreementData {
  restaurant: Restaurant;
  language: AgreementLanguage;
  providerName: string;
  subCompany: string;
  providerOwner: string;
  providerEmail: string;
  providerPhone: string;
  providerAddress: string;
  providerWebsites: string;
  clientName: string;
  clientOwner: string;
  clientAddress: string;
  clientMobile: string;
  monthlyAmount: number;
  trialPeriodText: string;
  startDate: string;
  endDate: string;
  agreementDate: string;
  specialNotes?: string;
  agreementNumber: string;
}

/**
 * Generates an official Master Service & Subscription Agreement PDF
 * Purely client-side in the browser, triggering direct download.
 * ZERO Supabase/cloud storage or database persistence.
 */
export async function generateRestaurantAgreementPdf(data: AgreementData): Promise<boolean> {
  const isBn = data.language === 'bn';

  // Create a clean off-screen printable DOM container for perfect typography, formatting, and unicode support (English & Bengali)
  const container = document.createElement('div');
  container.id = 'agreement-print-render-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = isBn
    ? "'Noto Sans Bengali', 'Hind Siliguri', 'SolaimanLipi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  container.style.padding = '40px 48px';
  container.style.lineHeight = '1.6';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-9999';

  // Construct Agreement HTML according to chosen language
  if (isBn) {
    // BENGALI CONTRACT TEMPLATE
    container.innerHTML = `
      <div style="border: 2px solid #1e293b; border-radius: 12px; padding: 28px; background: #ffffff;">
        <!-- Header -->
        <div style="background: #0f172a; color: #ffffff; padding: 18px 24px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">
                ${DIGIMOMS_OFFICIAL.companyName}
              </h1>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px; font-weight: 600;">
                সার্ভিস ডিভিশন: ${DIGIMOMS_OFFICIAL.productName} (${DIGIMOMS_OFFICIAL.subCompany})
              </div>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                মাস্টার সফটওয়্যার সার্ভিস এবং পার্টনারশিপ চুক্তিপত্র (SaaS Agreement)
              </div>
            </div>
            <div style="text-align: right;">
              <div style="background: #eab308; color: #000000; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                রেফারেন্স: ${data.agreementNumber}
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                তারিখ: ${data.agreementDate}
              </div>
            </div>
          </div>
        </div>

        <!-- Introduction -->
        <div style="margin-bottom: 20px; font-size: 13px; color: #334155; text-align: justify;">
          এই চুক্তিপত্রটি <strong>${data.agreementDate}</strong> তারিখে কার্যকর করা হলো। একদিকে সার্ভিস প্রদানকারী প্রতিষ্ঠান <strong>${DIGIMOMS_OFFICIAL.companyName}</strong> (যার সার্ভিস প্ল্যাটফর্ম <strong>${DIGIMOMS_OFFICIAL.productName}</strong>) এবং অন্যদিকে নিম্নে উল্লেখিত রেস্তোরাঁ গ্রাহক/পার্টনার (<strong>Client / Restaurant Partner</strong>) এর মধ্যে।
        </div>

        <!-- Parties Box (2 Columns) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 14px; font-size: 11.5px;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase;">
              সার্ভিস প্রোভাইডার (DigiMoms)
            </div>
            <div><strong>কোম্পানি:</strong> ${DIGIMOMS_OFFICIAL.companyName}</div>
            <div><strong>সার্ভিস প্ল্যাটফর্ম:</strong> ${DIGIMOMS_OFFICIAL.productName}</div>
            <div><strong>স্বত্বাধিকারী / ওনার:</strong> ${DIGIMOMS_OFFICIAL.ownerName} (${DIGIMOMS_OFFICIAL.designation})</div>
            <div><strong>ঠিকানা:</strong> ${DIGIMOMS_OFFICIAL.location}</div>
            <div><strong>অফিসিয়াল WhatsApp / ফোন:</strong> ${DIGIMOMS_OFFICIAL.phone}</div>
            <div><strong>ইমেইল:</strong> ${DIGIMOMS_OFFICIAL.email}</div>
            <div><strong>ওয়েবসাইট:</strong> ${DIGIMOMS_OFFICIAL.websites.join(' | ')}</div>
          </div>

          <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 14px; font-size: 11.5px;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase;">
              রেস্তোরাঁ পার্টনার (Client Details)
            </div>
            <div><strong>রেস্তোরাঁর নাম:</strong> ${data.clientName}</div>
            <div><strong>অনুমোদিত প্রতিনিধি / ওনার:</strong> ${data.clientOwner || 'প্রতিনিধি'}</div>
            <div><strong>যোগাযোগের নম্বর:</strong> ${data.clientMobile || 'অনুপলব্ধ'}</div>
            <div><strong>ব্যবসার ঠিকানা:</strong> ${data.clientAddress || 'নিবন্ধিত রেস্তোরাঁ অবস্থান'}</div>
            <div><strong>সিস্টেম আইডি (Slug):</strong> ${data.restaurant.slug}</div>
            <div><strong>নিবন্ধন স্থিতি:</strong> সক্রিয় পার্টনার</div>
          </div>
        </div>

        <!-- Section: Specific Subscription & Trial Terms Table -->
        <div style="margin-bottom: 24px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 8px; border-left: 4px solid #3b82f6; padding-left: 8px;">
            চুক্তির আর্থিক ও ট্রায়াল শর্তাবলী (Subscription & Trial Terms)
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; border: 1px solid #cbd5e1;">
            <tbody>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 12px; font-weight: 700; width: 40%; color: #334155;">বিনামূল্যে সেবা / ট্রায়াল সময়সীমা</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${data.trialPeriodText}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 12px; color: #475569;">ফ্রি সার্ভিস শুরু ও শেষের তারিখ</td>
                <td style="padding: 8px 12px; font-weight: 600; color: #0f172a;">${data.startDate} থেকে ${data.endDate} পর্যন্ত</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 12px; font-weight: 700; color: #334155;">মাসিক সাবস্ক্রিপশন ফি (Post-Trial)</td>
                <td style="padding: 8px 12px; font-weight: 800; color: #059669; font-size: 13px;">₹${data.monthlyAmount.toLocaleString('en-IN')} / প্রতি মাস</td>
              </tr>
              ${data.specialNotes ? `
              <tr>
                <td style="padding: 8px 12px; color: #475569;">বিশেষ শর্ত / নোট</td>
                <td style="padding: 8px 12px; color: #b45309; font-style: italic; background: #fffbeb;">${data.specialNotes}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <!-- Section 1: Scope of Service -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ১. সেবার পরিধি ও সিস্টেমের সুবিধাসমূহ (Scope of Service)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms Smart Restaurant OS হলো ক্লাউড-ভিত্তিক রেস্তোরাঁ ও কাস্টমার অর্ডারিং ম্যানেজমেন্ট সফটওয়্যার যা রেস্তোরাঁর নির্বাচিত ও সক্রিয় প্ল্যান অনুযায়ী নিম্নলিখিত সুবিধাসমূহ প্রদান করতে পারে:
            <ul style="margin: 4px 0 6px 20px; padding: 0;">
              <li>ডিজিটাল কিউআর কোড (QR Code) মেনু ও কাস্টমার টেবিল অর্ডারিং সিস্টেম।</li>
              <li>রিয়েল-টাইম কিচেন ডিসপ্লে সিস্টেম (KDS) ও ওয়েটার কল অ্যালার্ট সিস্টেম।</li>
              <li>রেস্তোরাঁ ওনার ড্যাশবোর্ড, লাইভ সেলস অ্যানালিটিক্স ও মেনু নিয়ন্ত্রণ।</li>
              <li>বিলিং, ইনভয়েস জেনারেশন ও দৈনিক হিসাব-নিকাশ ট্র্যাকিং।</li>
              <li>পেমেন্ট গেটওয়ে ইন্টিগ্রেশন এবং অফলাইন ক্যাশ পেমেন্ট রেকর্ড ব্যবস্থাপনা।</li>
              <li>রেস্তোরাঁর নিজস্ব অনলাইন মেনু ও পাবলিক ল্যান্ডিং পেজ।</li>
            </ul>
            <em>দ্রষ্টব্য: সকল ফিচার প্রতিটি রেস্তোরাঁর জন্য বাধ্যতামূলক নয়; রেস্তোরাঁর সক্রিয় প্ল্যান ও কনফিগারেশন অনুযায়ী ফিচার প্রযোজ্য হবে।</em>
          </div>
        </div>

        <!-- Section 2: Payment Gateways -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ২. পেমেন্ট পদ্ধতি এবং পেমেন্ট গেটওয়ে প্রাপ্যতা (Payment Methods & Gateway Availability)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms Smart Restaurant OS সিস্টেমে উপলব্ধ এবং কনফিগার করা পেমেন্ট গেটওয়ে সমর্থন করতে পারে। সিস্টেমে বর্তমানে নিম্নোক্ত গেটওয়েসমূহ সক্রিয় বা কনফিগারযোগ্য রয়েছে:
            <strong>PayU, PhonePe, Razorpay</strong> এবং ভবিষ্যতে DigiMoms দ্বারা আনুষ্ঠানিকভাবে অন্তর্ভুক্ত অন্যান্য অনুমোদিত গেটওয়ে।
            <ul style="margin: 4px 0 6px 20px; padding: 0;">
              <li>গ্রাহকদের সামনে কোন কোন পেমেন্ট অপশন প্রদর্শিত হবে তা নির্ভর করবে রেস্তোরাঁ কর্তৃপক্ষ কোন গেটওয়ে সক্রিয় করেছেন এবং প্রয়োজনীয় ভেরিফিকেশন সম্পন্ন করেছেন কিনা তার ওপর।</li>
              <li>যদি কোনো রেস্তোরাঁয় অনলাইন গেটওয়ে সক্রিয় না থাকে, তবে গ্রাহকদের কোনো অপ্রাপ্য অপশন দেখানো হবে না।</li>
              <li><strong>তৃতীয় পক্ষের দায়মুক্তি:</strong> তৃতীয় পক্ষের পেমেন্ট গেটওয়ে, ব্যাংক, UPI নেটওয়ার্ক বা সার্ভারের নিজস্ব প্রযুক্তিগত বিভ্রাট DigiMoms এর নিয়ন্ত্রণের বাইরে। DigiMoms তৃতীয় পক্ষের ট্রানজ্যাকশন অনুমোদনের কোনো নিশ্চয়তা দেয় না।</li>
            </ul>
          </div>
        </div>

        <!-- Section 3: Free Trial Terms -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৩. ফ্রি ট্রায়াল ও প্রমোশনাল অফারের শর্তাবলী (Free Trial Terms)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            ফ্রি ট্রায়াল হলো DigiMoms কর্তৃক প্রদত্ত একটি প্রচারমূলক অফার। এই চুক্তির সারণীতে উল্লেখিত সময়সীমা অনুযায়ী রেস্তোরাঁ বিনামূল্যে সেবা ব্যবহার করতে পারবে। ফ্রি ট্রায়াল মেয়াদ শেষ হওয়ার পর সেবা অব্যাহত রাখতে নিয়মিত মাসিক সাবস্ক্রিপশন ফি প্রদান করতে হবে।
          </div>
        </div>

        <!-- Section 4: Subscription & Price Changes -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৪. মাসিক সাবস্ক্রিপশন ও মূল্য পরিবর্তন নীতি (Subscription & Pricing Policy)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            রেস্তোরাঁ তার নির্ধারিত প্ল্যান অনুযায়ী মাসিক সাবস্ক্রিপশন ফি সময়মতো পরিশোধ করতে বাধ্য থাকবে। ভবিষ্যতের অপারেটিং খরচ, নতুন ফিচার সংযোজন বা ব্যবসার প্রয়োজনীয়তার ওপর ভিত্তি করে সাবস্ক্রিপশন মূল্যে পরিবর্তন আসতে পারে। যেকোনো উল্লেখযোগ্য মূল্য পরিবর্তনের পূর্বে রেস্তোরাঁ কর্তৃপক্ষকে পূর্বেই অবহিত করা হবে।
          </div>
        </div>

        <!-- Section 5: Technical Problems & Offline Operations -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৫. প্রযুক্তিগত ত্রুটি এবং অফলাইন ব্যবসা পরিচালনা (Technical Issues & Offline Operation)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            যেহেতু এটি একটি অনলাইন ক্লাউড ভিত্তিক সফটওয়্যার, সফটওয়্যার আপডেট, সার্ভার, ক্লাউড হোস্টিং, ইন্টারনেট নেটওয়ার্ক, বিদ্যুৎ বিভ্রাট বা তৃতীয় পক্ষের কারণে সাময়িক বিভ্রাট ঘটতে পারে।
            <strong>অতএব, সিস্টেম বিভ্রাটের সময় রেস্তোরাঁ কর্তৃপক্ষকে নিজস্ব বিকল্প অফলাইন বা ম্যানুয়াল পদ্ধতিতে অর্ডার গ্রহণ ও ব্যবসা চালু রাখার প্রস্তুতি রাখতে হবে।</strong> DigiMoms যেকোনো প্রকৃত কারিগরি সমস্যা দ্রুত সমাধান করার আন্তরিক প্রচেষ্টা চালাবে।
          </div>
        </div>

        <!-- Section 6: Business Loss & Liability -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৬. ব্যবসায়িক লাভ-ক্ষতি ও দায়বদ্ধতার সীমাবদ্ধতা (Limitation of Liability)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms কোনো নির্দিষ্ট বিক্রয়, গ্রাহক বৃদ্ধি, ব্যবসায়িক মুনাফা বা নিরবচ্ছিন্ন সার্ভিসের কোনো অবাস্তব গ্যারান্টি দেয় না। প্রযুক্তিগত কোনো বিভ্রাট বা সার্ভার ডাউনটাইমের কারণে রেস্তোরাঁর কোনো পরোক্ষ আর্থিক বা ব্যবসায়িক ক্ষতি হলে, প্রযোজ্য আইনের অধীনে DigiMoms সেই পরোক্ষ ক্ষতির জন্য দায়ী থাকবে না।
          </div>
        </div>

        <!-- Section 7: 15-Day Refund Policy -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৭. ১৫ দিনের রিফান্ড ও সেবা সমন্বয় নীতি (15-Day Refund & Service Policy)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            <strong>প্রথম ১৫ দিনের মধ্যে:</strong> পেইড মাসিক সাবস্ক্রিপশন শুরুর প্রথম ১৫ দিনের মধ্যে যদি DigiMoms সিস্টেমের নিজস্ব যাচাইকৃত ত্রুটির কারণে সেবা অনুপলব্ধ বা সম্পূর্ণ অচল থাকে, তবে রেস্তোরাঁ ডাউনটাইমের আনুপাতিক রিফান্ড, সার্ভিস ক্রেডিট বা সাবস্ক্রিপশন সমন্বয় পাবে।<br/>
            <strong>১৫ দিন অতিবাহিত হওয়ার পর:</strong> পেইড মেয়াদের ১৫ দিন পার হয়ে গেলে মাসিক সাবস্ক্রিপশন ফি সম্পূর্ণরূপে অফেরতযোগ্য (Non-Refundable)। কেবলমাত্র ব্যক্তিগত সিদ্ধান্ত পরিবর্তন বা ব্যবহার না করার কারণে রিফান্ড প্রযোজ্য হবে না। রেস্তোরাঁর নিজস্ব ইন্টারনেট, ডিভাইস সমস্যা বা কর্মীদের ভুলের কারণে রিফান্ড দেওয়া হবে না।
          </div>
        </div>

        <!-- Section 8: Restaurant Responsibilities -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৮. রেস্তোরাঁ পার্টনারের দায়িত্ব ও বাধ্যবাধকতা (Restaurant Responsibilities)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            রেস্তোরাঁ কর্তৃপক্ষ তাদের খাদ্য মেনু, মূল্য তালিকা, বর্ণনা, খাদ্য নিরাপত্তা ও গুণমান (FSSAI), ট্যাক্স ও জিএসটি (GST) সংক্রান্ত সকল আইনি দায়িত্ব নিজেরাই বহন করবে। রেস্তোরাঁ আইডি ও পাসওয়ার্ড গোপন রাখা তাদের দায়িত্ব। DigiMoms শুধুমাত্র প্রযুক্তি সেবা প্রদানকারী, রেস্তোরাঁর খাদ্য বা ব্যবসার অংশীদার নয়।
          </div>
        </div>

        <!-- Section 9: Data, Privacy & Security -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            ৯. ডেটা গোপনীয়তা ও নিরাপত্তা (Data Privacy & Security)
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms আধুনিক এনক্রিপশন ও সর্বোত্তম শিল্প-মানের নিরাপত্তা ব্যবস্থা বজায় রাখবে। রেস্তোরাঁর সকল ডেটা গোপনীয় ও সুরক্ষিত রাখা হবে।
          </div>
        </div>

        <!-- Section 10: Electronic Acceptance Instructions -->
        <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="font-weight: 800; font-size: 13px; color: #166534; margin-bottom: 6px;">
            ১০. চুক্তিপত্রের বৈদ্যুতিন অনুমোদন ও সম্মতি (Electronic Acceptance Instructions)
          </div>
          <div style="font-size: 12px; color: #14532d; line-height: 1.6;">
            এই চুক্তিপত্রের শর্তাবলী মনোযোগ দিয়ে পড়ে তা আনুষ্ঠানিকভাবে গ্রহণ করতে, আপনার নিবন্ধিত মোবাইল নম্বর বা অনুমোদিত হোয়াটসঅ্যাপ/ইমেইল থেকে নিচের ফরম্যাটে উত্তর দিন:
            <div style="background: #ffffff; border: 1px solid #86efac; border-radius: 6px; padding: 10px; margin-top: 8px; font-family: monospace; font-size: 13px; font-weight: 700; color: #166534;">
              YES<br/>
              Full Name: [আপনার পুরো নাম]<br/>
              Date: [তারিখ]
            </div>
            <div style="font-size: 10.5px; color: #15803d; margin-top: 6px; font-style: italic;">
              *প্রযোজ্য আইন সাপেক্ষে এই বৈদ্যুতিন সম্মতি উভয় পক্ষের মধ্যে পারস্পরিক চুক্তি গ্রহণের বৈধ প্রমাণ হিসেবে বিবেচিত হবে।
            </div>
          </div>
        </div>

        <!-- Signatures Block -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; border-top: 1px solid #cbd5e1; pt: 18px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 11px; background: #fafafa;">
            <div style="font-weight: 700; color: #0f172a;">DigiMoms Marketing Agency এর পক্ষে</div>
            <div style="margin-top: 4px; color: #475569;">অনুমোদিত স্বাক্ষরকারী: ${DIGIMOMS_OFFICIAL.ownerName}</div>
            <div style="color: #64748b; font-size: 10px;">পদবী: ${DIGIMOMS_OFFICIAL.designation}</div>
            <div style="border-bottom: 1px solid #94a3b8; margin: 28px 0 6px 0;"></div>
            <div style="color: #64748b; font-size: 10px;">ডিজিটাল ভেরিফায়েড ও অনুমোদিত স্বাক্ষর</div>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 11px; background: #fafafa;">
            <div style="font-weight: 700; color: #0f172a;">রেস্তোরাঁ পার্টনারের পক্ষে (${data.clientName})</div>
            <div style="margin-top: 4px; color: #475569;">অনুমোদিত ব্যক্তি: ${data.clientOwner || 'Owner / Representative'}</div>
            <div style="color: #64748b; font-size: 10px;">ফোন: ${data.clientMobile || 'Registered Number'}</div>
            <div style="border-bottom: 1px solid #94a3b8; margin: 28px 0 6px 0;"></div>
            <div style="color: #64748b; font-size: 10px;">অনুমোদিত স্বাক্ষর ও সিল (Signature & Seal)</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          DigiMoms Marketing Agency • ${DIGIMOMS_OFFICIAL.location} • অফিসিয়াল পোর্টাল: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
        </div>
      </div>
    `;
  } else {
    // ENGLISH CONTRACT TEMPLATE
    container.innerHTML = `
      <div style="border: 2px solid #1e293b; border-radius: 12px; padding: 28px; background: #ffffff;">
        <!-- Header -->
        <div style="background: #0f172a; color: #ffffff; padding: 18px 24px; border-radius: 8px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; color: #ffffff;">
                ${DIGIMOMS_OFFICIAL.companyName}
              </h1>
              <div style="font-size: 13px; color: #94a3b8; margin-top: 4px; font-weight: 600;">
                Service Division: ${DIGIMOMS_OFFICIAL.productName} (${DIGIMOMS_OFFICIAL.subCompany})
              </div>
              <div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">
                Master Software-as-a-Service (SaaS) Agreement & Partner Terms
              </div>
            </div>
            <div style="text-align: right;">
              <div style="background: #eab308; color: #000000; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; display: inline-block;">
                REF: ${data.agreementNumber}
              </div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                Date: ${data.agreementDate}
              </div>
            </div>
          </div>
        </div>

        <!-- Introduction -->
        <div style="margin-bottom: 20px; font-size: 13px; color: #334155; text-align: justify;">
          This Master Service Agreement ("Agreement") is executed on <strong>${data.agreementDate}</strong> by and between <strong>${DIGIMOMS_OFFICIAL.companyName}</strong> (operating the service platform <strong>${DIGIMOMS_OFFICIAL.productName}</strong>) and the Restaurant Partner ("Client") identified below.
        </div>

        <!-- Parties Box (2 Columns) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 14px; font-size: 11.5px;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase;">
              Service Provider (DigiMoms)
            </div>
            <div><strong>Company:</strong> ${DIGIMOMS_OFFICIAL.companyName}</div>
            <div><strong>Service Division:</strong> ${DIGIMOMS_OFFICIAL.productName}</div>
            <div><strong>Owner / Authorized Person:</strong> ${DIGIMOMS_OFFICIAL.ownerName} (${DIGIMOMS_OFFICIAL.designation})</div>
            <div><strong>Location:</strong> ${DIGIMOMS_OFFICIAL.location}</div>
            <div><strong>WhatsApp / Phone:</strong> ${DIGIMOMS_OFFICIAL.phone}</div>
            <div><strong>Support Email:</strong> ${DIGIMOMS_OFFICIAL.email}</div>
            <div><strong>Websites:</strong> ${DIGIMOMS_OFFICIAL.websites.join(' | ')}</div>
          </div>

          <div style="border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 14px; font-size: 11.5px;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; text-transform: uppercase;">
              Restaurant Partner (Client Details)
            </div>
            <div><strong>Restaurant Name:</strong> ${data.clientName}</div>
            <div><strong>Owner / Authorized Person:</strong> ${data.clientOwner || 'Owner / Representative'}</div>
            <div><strong>Contact Number:</strong> ${data.clientMobile || 'N/A'}</div>
            <div><strong>Business Address:</strong> ${data.clientAddress || 'Registered Location'}</div>
            <div><strong>System Slug ID:</strong> ${data.restaurant.slug}</div>
            <div><strong>Account Status:</strong> Registered Partner</div>
          </div>
        </div>

        <!-- Section: Specific Subscription & Trial Terms Table -->
        <div style="margin-bottom: 24px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 8px; border-left: 4px solid #3b82f6; padding-left: 8px;">
            Subscription & Trial Terms Summary
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; border: 1px solid #cbd5e1;">
            <tbody>
              <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 12px; font-weight: 700; width: 40%; color: #334155;">Free Service / Trial Duration</td>
                <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${data.trialPeriodText}</td>
              </tr>
              <tr style="border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 12px; color: #475569;">Free Service Start & End Dates</td>
                <td style="padding: 8px 12px; font-weight: 600; color: #0f172a;">From: ${data.startDate} To: ${data.endDate}</td>
              </tr>
              <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                <td style="padding: 8px 12px; font-weight: 700; color: #334155;">Monthly Subscription Fee (Post-Trial)</td>
                <td style="padding: 8px 12px; font-weight: 800; color: #059669; font-size: 13px;">₹${data.monthlyAmount.toLocaleString('en-IN')} / Month (Standard Rate)</td>
              </tr>
              ${data.specialNotes ? `
              <tr>
                <td style="padding: 8px 12px; color: #475569;">Special Provisions / Custom Notes</td>
                <td style="padding: 8px 12px; color: #b45309; font-style: italic; background: #fffbeb;">${data.specialNotes}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <!-- Section 1: Scope of Service -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            1. SCOPE OF SERVICES & SYSTEM MODULES
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms Smart Restaurant OS is a digital restaurant management and ordering software service operated by DigiMoms Marketing Agency. The system may provide applicable features based on the Restaurant's activated plan:
            <ul style="margin: 4px 0 6px 20px; padding: 0;">
              <li>Digital interactive QR Menu and customer ordering engine.</li>
              <li>Real-time Kitchen Display System (KDS) and Waiter Call alert terminal.</li>
              <li>Restaurant Owner / Admin Dashboard with live analytics and menu control.</li>
              <li>Customer Billing, PDF Invoicing, and settlement tracking.</li>
              <li>Payment Gateway integration and offline cash settlement logs.</li>
              <li>Dedicated public landing page and online menu showcase.</li>
            </ul>
            <em>Note: Features are provided subject to the Restaurant's specific activated plan and configuration.</em>
          </div>
        </div>

        <!-- Section 2: Payment Gateways -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            2. PAYMENT METHODS AND PAYMENT GATEWAY AVAILABILITY
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms Smart Restaurant OS supports payment gateways and methods that are available and activated within the system. The platform is configured with and supports the following gateways:
            <strong>PayU, PhonePe, Razorpay</strong>, and other officially supported gateways enabled by DigiMoms in the future.
            <ul style="margin: 4px 0 6px 20px; padding: 0;">
              <li>The payment options shown to dining customers depend entirely on which gateway/method is enabled for that specific Restaurant and whether required merchant setup has been completed.</li>
              <li>If online payment is not enabled for a Restaurant, customers will not be shown unavailable online payment options.</li>
              <li><strong>Third-Party Disclaimer:</strong> Third-party payment providers, banks, UPI networks, and payment gateways operate independently. DigiMoms does not guarantee third-party payment provider uptime or individual transaction approvals.</li>
            </ul>
          </div>
        </div>

        <!-- Section 3: Free Trial Terms -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            3. FREE TRIAL & PROMOTIONAL TERMS
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            The Free Trial is a promotional offer provided by DigiMoms. The approved duration is specified in this Agreement. After the Free Trial period ends, continued service requires an active paid monthly subscription.
          </div>
        </div>

        <!-- Section 4: Subscription & Price Changes -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            4. MONTHLY SUBSCRIPTION FEES & PRICING ADJUSTMENTS
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            The Restaurant agrees to pay the applicable monthly subscription fee for its activated plan. Subscription pricing may change in the future based on feature upgrades, infrastructure costs, or operational requirements. Important pricing changes will be communicated to the Restaurant in advance before taking effect.
          </div>
        </div>

        <!-- Section 5: Technical Problems & Offline Operations -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            5. TECHNICAL ISSUES & OFFLINE BUSINESS OPERATION
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms Smart Restaurant OS is a technology-based cloud system. Occasional technical issues may arise due to server updates, cloud hosting, internet connectivity, electricity interruptions, or third-party provider downtime.
            <strong>The Restaurant MUST maintain and be prepared to operate its own alternative offline / manual ordering and billing process during any technical interruption.</strong> DigiMoms will make reasonable efforts to resolve genuine system issues promptly.
          </div>
        </div>

        <!-- Section 6: Business Loss & Liability -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            6. BUSINESS RESULTS & LIMITATION OF LIABILITY
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms does not guarantee uninterrupted service or specific sales, customer footfall, revenue, or business profits. If a technical issue causes temporary business disruption, DigiMoms will not be liable for indirect or consequential business losses to the extent permitted by applicable law.
          </div>
        </div>

        <!-- Section 7: 15-Day Refund Policy -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            7. 15-DAY REFUND & SERVICE ADJUSTMENT POLICY
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            <strong>During the first 15 days:</strong> If a verified service problem directly caused by DigiMoms OS renders the service unusable during the first 15 days of a paid monthly subscription, DigiMoms will investigate and provide an appropriate proportional refund, service credit, or subscription adjustment.<br/>
            <strong>After 15 days:</strong> Subscription fees are non-refundable. Refunds are not available due to a change of mind or cessation of use. Issues caused by the Restaurant's own internet, hardware, staff errors, or third-party networks do not qualify for a service refund.
          </div>
        </div>

        <!-- Section 8: Restaurant Responsibilities -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            8. RESTAURANT RESPONSIBILITIES & COMPLIANCE
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            The Restaurant is solely responsible for menu prices, descriptions, food quality, hygiene (FSSAI), tax compliance (GST), and staff operations. DigiMoms provides software tools and does not operate the Restaurant's food business.
          </div>
        </div>

        <!-- Section 9: Data, Privacy & Security -->
        <div style="margin-bottom: 18px;">
          <div style="font-weight: 800; font-size: 12.5px; color: #0f172a; margin-bottom: 6px;">
            9. DATA PRIVACY & SECURITY
          </div>
          <div style="font-size: 11.5px; color: #334155; line-height: 1.6;">
            DigiMoms implements reasonable, industry-standard security measures and handles restaurant and customer information according to applicable privacy practices.
          </div>
        </div>

        <!-- Section 10: Electronic Acceptance Instructions -->
        <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="font-weight: 800; font-size: 13px; color: #166534; margin-bottom: 6px;">
            10. ELECTRONIC ACCEPTANCE INSTRUCTIONS
          </div>
          <div style="font-size: 12px; color: #14532d; line-height: 1.6;">
            To accept this Agreement and its terms, reply from your registered/authorized communication channel (WhatsApp/Email) in the following format:
            <div style="background: #ffffff; border: 1px solid #86efac; border-radius: 6px; padding: 10px; margin-top: 8px; font-family: monospace; font-size: 13px; font-weight: 700; color: #166534;">
              YES<br/>
              Full Name: [Your Full Name]<br/>
              Date: [Date]
            </div>
            <div style="font-size: 10.5px; color: #15803d; margin-top: 6px; font-style: italic;">
              *Electronic acceptance may be used as evidence of mutual contract acceptance subject to applicable law.
            </div>
          </div>
        </div>

        <!-- Signatures Block -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; border-top: 1px solid #cbd5e1; pt: 18px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 11px; background: #fafafa;">
            <div style="font-weight: 700; color: #0f172a;">For DigiMoms Marketing Agency</div>
            <div style="margin-top: 4px; color: #475569;">Authorized Signatory: ${DIGIMOMS_OFFICIAL.ownerName}</div>
            <div style="color: #64748b; font-size: 10px;">Designation: ${DIGIMOMS_OFFICIAL.designation}</div>
            <div style="border-bottom: 1px solid #94a3b8; margin: 28px 0 6px 0;"></div>
            <div style="color: #64748b; font-size: 10px;">Digitally Verified & Authorized Signature</div>
          </div>

          <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; font-size: 11px; background: #fafafa;">
            <div style="font-weight: 700; color: #0f172a;">For Restaurant Partner (${data.clientName})</div>
            <div style="margin-top: 4px; color: #475569;">Authorized Person: ${data.clientOwner || 'Owner / Representative'}</div>
            <div style="color: #64748b; font-size: 10px;">Contact: ${data.clientMobile || 'Registered Number'}</div>
            <div style="border-bottom: 1px solid #94a3b8; margin: 28px 0 6px 0;"></div>
            <div style="color: #64748b; font-size: 10px;">Authorized Signature & Seal</div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          DigiMoms Marketing Agency • ${DIGIMOMS_OFFICIAL.location} • Official Portals: ${DIGIMOMS_OFFICIAL.websites.join(' | ')}
        </div>
      </div>
    `;
  }

  document.body.appendChild(container);

  try {
    // Render the high-resolution canvas with html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, // 2x high-DPI scaling for ultra-crisp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const printWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * printWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, printWidth, imgHeight);
    heightLeft -= (pageHeight - (margin * 2));

    // Subsequent pages if content overflows A4
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, printWidth, imgHeight);
      heightLeft -= (pageHeight - (margin * 2));
    }

    // Save directly to the client machine (ZERO Supabase storage / DB upload)
    const sanitizedName = data.clientName.replace(/[^a-zA-Z0-9]/g, '_');
    const langSuffix = isBn ? 'BN' : 'EN';
    pdf.save(`DigiMoms_Agreement_${sanitizedName}_${langSuffix}_${data.agreementNumber}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating Agreement PDF:', error);
    throw error;
  } finally {
    // Clean up temporary DOM element
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
