"use client";

import { Check, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import type { Lang } from "@/lib/core/types";
import { deleteAllData } from "@/lib/storage";

const POINTS = {
  hi: [
    "आपकी जानकारी सिर्फ़ आपके डिवाइस के ब्राउज़र में सेव होती है। हमारे पास उपयोगकर्ताओं का कोई डेटाबेस नहीं है।",
    "हम कभी नाम, फ़ोन नंबर, आधार नंबर, बैंक खाता नंबर या OTP नहीं माँगते।",
    "योजनाओं का मिलान आपके डिवाइस पर ही होता है और इंटरनेट न होने पर भी काम करता है।",
    "AI सारांश के लिए सिर्फ़ पात्रता से जुड़ी जानकारी (जैसे उम्र, राज्य, काम) बिना किसी पहचान के भेजी जाती है।",
    "सभी आवेदन लिंक सिर्फ़ आधिकारिक सरकारी वेबसाइटों पर जाते हैं।",
    "आप नीचे दिए बटन से कभी भी अपनी सारी जानकारी मिटा सकते हैं।",
  ],
  en: [
    "Your details are stored only in this device's browser. We keep no database of users.",
    "We never ask for your name, phone number, Aadhaar number, bank account number or OTP.",
    "Scheme matching runs on your device and keeps working without an internet connection.",
    "For AI summaries, only eligibility details (such as age, state and occupation) are sent, with nothing that identifies you.",
    "All apply links go only to official government websites.",
    "You can delete all of your data at any time using the button below.",
  ],
  bn: [
    "আপনার তথ্য শুধু এই ডিভাইসের ব্রাউজারে সংরক্ষিত থাকে। আমাদের কাছে ব্যবহারকারীদের কোনো ডেটাবেস নেই।",
    "আমরা কখনো আপনার নাম, ফোন নম্বর, আধার নম্বর, ব্যাংক অ্যাকাউন্ট নম্বর বা OTP চাই না।",
    "প্রকল্প মেলানো আপনার ডিভাইসেই হয় এবং ইন্টারনেট ছাড়াও কাজ করে।",
    "AI সারাংশের জন্য শুধু যোগ্যতার তথ্য (যেমন বয়স, রাজ্য, পেশা) পাঠানো হয়, আপনাকে চেনা যায় এমন কিছু নয়।",
    "সব আবেদনের লিঙ্ক শুধু সরকারি ওয়েবসাইটে যায়।",
    "নিচের বোতাম দিয়ে যেকোনো সময় আপনার সব তথ্য মুছে ফেলতে পারেন।",
  ],
  mr: [
    "तुमची माहिती फक्त याच डिव्हाइसच्या ब्राउझरमध्ये जतन होते. आमच्याकडे वापरकर्त्यांचा कोणताही डेटाबेस नाही.",
    "आम्ही कधीही तुमचे नाव, फोन नंबर, आधार नंबर, बँक खाते क्रमांक किंवा OTP मागत नाही.",
    "योजनांची जुळवणी तुमच्या डिव्हाइसवरच होते आणि इंटरनेटशिवायही काम करते.",
    "AI सारांशासाठी फक्त पात्रतेची माहिती (उदा. वय, राज्य, व्यवसाय) पाठवली जाते, तुमची ओळख पटेल असे काहीही नाही.",
    "सर्व अर्जाच्या लिंक फक्त अधिकृत सरकारी वेबसाइटवर जातात.",
    "खालील बटणाने तुम्ही कधीही तुमची सर्व माहिती हटवू शकता.",
  ],
  ta: [
    "உங்கள் விவரங்கள் இந்தச் சாதனத்தின் உலாவியில் மட்டுமே சேமிக்கப்படும். பயனர்களின் தரவுத்தளம் எதுவும் எங்களிடம் இல்லை.",
    "உங்கள் பெயர், தொலைபேசி எண், ஆதார் எண், வங்கிக் கணக்கு எண் அல்லது OTP ஆகியவற்றை நாங்கள் ஒருபோதும் கேட்பதில்லை.",
    "திட்டப் பொருத்தம் உங்கள் சாதனத்திலேயே நடக்கும், இணையம் இல்லாமலும் வேலை செய்யும்.",
    "AI சுருக்கங்களுக்குத் தகுதி விவரங்கள் (வயது, மாநிலம், தொழில் போன்றவை) மட்டுமே அனுப்பப்படும்; உங்களை அடையாளம் காட்டும் எதுவும் இல்லை.",
    "எல்லா விண்ணப்ப இணைப்புகளும் அதிகாரப்பூர்வ அரசு இணையதளங்களுக்கு மட்டுமே செல்லும்.",
    "கீழே உள்ள பொத்தான் மூலம் எப்போது வேண்டுமானாலும் உங்கள் எல்லாத் தரவையும் நீக்கலாம்.",
  ],
} satisfies Record<Lang, string[]>;

export default function PrivacyPage() {
  const { lang, t } = useApp();
  const router = useRouter();
  return (
    <div className="container container-narrow page">
      <div className="page-head">
        <h1>{t("privacy")}</h1>
        <p className="muted">{t("trust4")}</p>
      </div>
      <div className="card">
        <ul className="list-check list-roomy">
          {POINTS[lang].map((p) => (
            <li key={p}>
              <Check size={16} className="ic-success" aria-hidden />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="divider" />
        <button
          className="btn btn-danger-ghost"
          onClick={() => {
            deleteAllData();
            alert(t("deleted"));
            router.push("/");
          }}
        >
          <Trash2 size={16} aria-hidden /> {t("deleteData")}
        </button>
      </div>
    </div>
  );
}
