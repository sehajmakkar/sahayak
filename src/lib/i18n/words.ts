// Small grammar words used to build sentences from rules and answers, per language.
import type { Lang } from "../core/types";

type Words = {
  years: string;
  aYear: string;
  hectares: string;
  acres: string;
  or: string;
  and: string;
  orMore: string;
  upTo: (x: string) => string;
  not: (x: string) => string;
  anyOneOf: string;
  ownsLand: string;
  dontKnow: string;
  rupees: string;
  officialSite: string;
  details: string;
};

export const WORDS: Record<Lang, Words> = {
  en: {
    years: "years", aYear: " a year", hectares: "hectares", acres: "acres", or: " or ", and: " and ", orMore: "or more",
    upTo: (x) => `up to ${x}`, not: (x) => `not ${x}`, anyOneOf: "Any one of: ", ownsLand: "Owns farm land",
    dontKnow: "Don't know", rupees: " rupees ", officialSite: "Official website: ", details: "Details: ",
  },
  hi: {
    years: "साल", aYear: " सालाना", hectares: "हेक्टेयर", acres: "एकड़", or: " या ", and: " और ", orMore: "या ज़्यादा",
    upTo: (x) => `${x} तक`, not: (x) => `यह न हो — ${x}`, anyOneOf: "इनमें से कोई एक: ", ownsLand: "खेती की ज़मीन आपके नाम पर हो",
    dontKnow: "पता नहीं", rupees: " रुपये ", officialSite: "आधिकारिक वेबसाइट: ", details: "विवरण: ",
  },
  bn: {
    years: "বছর", aYear: " বছরে", hectares: "হেক্টর", acres: "একর", or: " বা ", and: " এবং ", orMore: "বা তার বেশি",
    upTo: (x) => `${x} পর্যন্ত`, not: (x) => `এগুলি নয় — ${x}`, anyOneOf: "এর যেকোনো একটি: ", ownsLand: "নিজের নামে চাষের জমি আছে",
    dontKnow: "জানি না", rupees: " টাকা ", officialSite: "সরকারি ওয়েবসাইট: ", details: "বিস্তারিত: ",
  },
  mr: {
    years: "वर्षे", aYear: " वार्षिक", hectares: "हेक्टर", acres: "एकर", or: " किंवा ", and: " आणि ", orMore: "किंवा जास्त",
    upTo: (x) => `${x} पर्यंत`, not: (x) => `हे नसावे — ${x}`, anyOneOf: "यापैकी कोणतेही एक: ", ownsLand: "स्वतःच्या नावावर शेतजमीन आहे",
    dontKnow: "माहीत नाही", rupees: " रुपये ", officialSite: "अधिकृत वेबसाइट: ", details: "तपशील: ",
  },
  ta: {
    years: "வயது", aYear: " ஆண்டுக்கு", hectares: "ஹெக்டேர்", acres: "ஏக்கர்", or: " அல்லது ", and: " மற்றும் ", orMore: "அல்லது அதற்கு மேல்",
    upTo: (x) => `${x} வரை`, not: (x) => `இவை அல்ல — ${x}`, anyOneOf: "இவற்றில் ஏதேனும் ஒன்று: ", ownsLand: "சொந்தப் பெயரில் விவசாய நிலம் உள்ளது",
    dontKnow: "தெரியாது", rupees: " ரூபாய் ", officialSite: "அதிகாரப்பூர்வ இணையதளம்: ", details: "விவரங்கள்: ",
  },
};

/** BCP-47 tags for speech synthesis / recognition. */
export const SPEECH_LOCALE: Record<Lang, string> = { en: "en-IN", hi: "hi-IN", bn: "bn-IN", mr: "mr-IN", ta: "ta-IN" };
