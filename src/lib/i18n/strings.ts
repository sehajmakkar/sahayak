import type { Lang } from "../core/types";
import bn from "./strings.bn";
import mr from "./strings.mr";
import ta from "./strings.ta";

const S = {
  appName: { hi: "योजना सेतु", en: "Yojana Setu" },
  appTag: { hi: "सरकारी योजना खोज", en: "Scheme Finder" },

  // Home
  heroEyebrow: { hi: "केंद्र और राज्य सरकार की योजनाएँ", en: "Central and state government schemes" },
  heroTitle: { hi: "जानिए आप किन सरकारी योजनाओं के पात्र हो सकते हैं", en: "Find the government schemes you may be eligible for" },
  heroTitleA: { hi: "जानिए आप किन सरकारी योजनाओं के", en: "Find the government schemes" },
  heroTitleB: { hi: "पात्र हो सकते हैं", en: "you may be eligible for" },
  heroSub: {
    hi: "दो छोटे चरणों में अपनी जानकारी भरें। योजना सेतु सैकड़ों पात्रता नियमों की जाँच करके आपके लिए सबसे उपयुक्त 10 योजनाएँ, ज़रूरी दस्तावेज़ और आधिकारिक आवेदन लिंक दिखाता है।",
    en: "Fill in a short two-step form. Yojana Setu checks hundreds of eligibility rules and shows the 10 best-suited schemes, the documents you need, and the official link to apply.",
  },
  start: { hi: "पात्रता जाँचें", en: "Check eligibility" },
  continue: { hi: "फ़ॉर्म जारी रखें", en: "Continue form" },
  seeResults: { hi: "मेरे परिणाम देखें", en: "View my results" },
  browseAll: { hi: "सभी योजनाएँ देखें", en: "Browse all schemes" },
  statSchemes: { hi: "योजनाएँ", en: "Schemes" },
  statCategories: { hi: "श्रेणियाँ", en: "Categories" },
  statTime: { hi: "मिनट में पूरा", en: "Minutes to complete" },
  statCost: { hi: "पूरी तरह मुफ़्त", en: "Completely free" },
  howItWorks: { hi: "यह कैसे काम करता है", en: "How it works" },
  step1Title: { hi: "अपनी जानकारी दें", en: "Share basic details" },
  step1: { hi: "राज्य, उम्र, आय, काम जैसी बुनियादी जानकारी — कोई दस्तावेज़ नंबर नहीं।", en: "State, age, income, occupation and a few household details. No document numbers." },
  step2Title: { hi: "पात्रता की जाँच", en: "Eligibility check" },
  step2: { hi: "हर योजना के आधिकारिक नियमों से आपकी जानकारी मिलाई जाती है और कारण बताए जाते हैं।", en: "Your details are matched against each scheme's official rules, with clear reasons for every result." },
  step3Title: { hi: "आधिकारिक आवेदन", en: "Apply officially" },
  step3: { hi: "दस्तावेज़ सूची देखें और सीधे सरकारी पोर्टल या नज़दीकी CSC पर आवेदन करें।", en: "Review the document checklist and apply directly on the government portal or at your nearest CSC." },
  examplesTitle: { hi: "उदाहरण प्रोफ़ाइल", en: "Sample profiles" },
  examplesSub: { hi: "फ़ॉर्म भरे बिना देखें कि परिणाम कैसे दिखते हैं।", en: "See how results look without filling the form." },
  viewResults: { hi: "परिणाम देखें", en: "View results" },
  categoriesTitle: { hi: "श्रेणी के अनुसार योजनाएँ", en: "Schemes by category" },
  waTitle: { hi: "व्हाट्सऐप पर भी", en: "Also on WhatsApp" },
  waSub: {
    hi: "वही सवाल, चैट में। “Hi” भेजें, टैप करके जवाब दें और अपनी योजनाएँ, दस्तावेज़ सूची और आवेदन लिंक पाएँ।",
    en: "The same questions, as a chat. Send “Hi”, answer by tapping, and get your schemes, document checklist and apply links.",
  },
  waCta: { hi: "व्हाट्सऐप पर चैट करें", en: "Chat on WhatsApp" },
  trustTitle: { hi: "भरोसेमंद और सुरक्षित", en: "Private and trustworthy" },
  trust1: { hi: "आपकी जानकारी सिर्फ़ आपके डिवाइस पर रहती है।", en: "Your details stay on your device only." },
  trust2: { hi: "हम आधार, बैंक खाता नंबर या OTP कभी नहीं माँगते।", en: "We never ask for Aadhaar, bank account numbers or OTPs." },
  trust3: { hi: "हर आवेदन लिंक आधिकारिक सरकारी वेबसाइट पर जाता है।", en: "Every apply link goes to an official government website." },
  trust4: { hi: "योजना सेतु मुफ़्त है — आवेदन के लिए किसी को पैसे न दें।", en: "Yojana Setu is free. Never pay anyone to apply." },
  helperNote: {
    hi: "CSC संचालक, आशा या आंगनवाड़ी कार्यकर्ता किसी और की ओर से फ़ॉर्म भर सकते हैं और “नई प्रोफ़ाइल” से अगले व्यक्ति के लिए शुरू कर सकते हैं।",
    en: "CSC operators, ASHA and Anganwadi workers can fill the form on someone's behalf and use “New profile” for the next person.",
  },

  // Form
  formTitle: { hi: "पात्रता फ़ॉर्म", en: "Eligibility form" },
  formSub: { hi: "जो पता न हो उसे खाली छोड़ दें — हम फिर भी योजनाएँ दिखाएँगे।", en: "Leave anything you don't know blank — we will still show relevant schemes." },
  stepLabel: { hi: "चरण", en: "Step" },
  step1Name: { hi: "बुनियादी जानकारी", en: "Basic details" },
  step2Name: { hi: "परिवार और ज़रूरतें", en: "Household & needs" },
  householdQs: { hi: "परिवार की स्थिति", en: "Household situation" },
  needsTitle: { hi: "आपको किस चीज़ में मदद चाहिए?", en: "What do you need help with?" },
  needsHelp: { hi: "वैकल्पिक — चुनी गई श्रेणियों की योजनाएँ ऊपर दिखेंगी।", en: "Optional — schemes in these categories are ranked higher." },
  needPlaceholder: { hi: "अपने शब्दों में लिखें, जैसे: बेटी की पढ़ाई के लिए मदद चाहिए", en: "Describe in your own words, e.g. I need help with my daughter's education" },
  speak: { hi: "बोलकर लिखें", en: "Dictate" },
  listening: { hi: "सुन रहे हैं…", en: "Listening…" },
  didntCatch: { hi: "आवाज़ समझ नहीं आई, फिर से कोशिश करें।", en: "Couldn't hear that. Please try again." },
  select: { hi: "चुनें", en: "Select" },
  notSure: { hi: "पता नहीं", en: "Not sure" },
  yes: { hi: "हाँ", en: "Yes" },
  no: { hi: "नहीं", en: "No" },
  agePlaceholder: { hi: "साल में", en: "In years" },
  back: { hi: "पीछे", en: "Back" },
  next: { hi: "आगे बढ़ें", en: "Continue" },
  showSchemes: { hi: "योजनाएँ दिखाएँ", en: "Show my schemes" },
  scanTitle: { hi: "दस्तावेज़ से जल्दी भरें", en: "Fill faster from a document" },
  scanSub: {
    hi: "वैकल्पिक। राशन कार्ड या आय, जाति या दिव्यांगता प्रमाण पत्र की फ़ोटो लें। इसे इसी फ़ोन पर पढ़ा जाता है, कहीं अपलोड नहीं होता। आधार या बैंक दस्तावेज़ स्कैन न करें।",
    en: "Optional. Photograph a ration card, or an income, caste or disability certificate. It is read on this phone and never uploaded. Don't scan Aadhaar or bank documents.",
  },
  scanButton: { hi: "दस्तावेज़ स्कैन करें", en: "Scan a document" },
  scanReading: { hi: "दस्तावेज़ पढ़ा जा रहा है… पहली बार में थोड़ा समय लगता है।", en: "Reading the document… the first scan takes a little longer." },
  scanFound: { hi: "हमें ये जानकारी मिली। जो गलत हो उसका निशान हटा दें।", en: "We found these details. Untick anything that's wrong." },
  scanApply: { hi: "ये जानकारी भरें", en: "Fill these in" },
  scanDiscard: { hi: "रद्द करें", en: "Discard" },
  scanApplied: { hi: "जानकारी भर दी गई है। कृपया नीचे जाँच लें।", en: "Details filled in. Please check them below." },
  scanNothing: { hi: "कोई जानकारी पढ़ी नहीं जा सकी। अच्छी रोशनी में साफ़ फ़ोटो लें, या फ़ॉर्म खुद भरें।", en: "Couldn't read any details. Try a clearer photo in good light, or fill the form yourself." },
  scanFailed: { hi: "पहली बार स्कैन करने के लिए इंटरनेट चाहिए। कृपया फ़ॉर्म खुद भरें।", en: "The first scan needs an internet connection. Please fill the form yourself." },
  privacyLine: { hi: "आपकी जानकारी सिर्फ़ इस डिवाइस पर सेव होती है। हम आधार, बैंक या OTP नहीं माँगते।", en: "Your answers are saved only on this device. We never ask for Aadhaar, bank or OTP details." },

  // Results
  resultsTitle: { hi: "आपके लिए सुझाई गई योजनाएँ", en: "Recommended schemes" },
  resultsSub: { hi: "आपकी जानकारी के आधार पर। अंतिम पात्रता संबंधित सरकारी विभाग तय करता है।", en: "Based on your details. Final eligibility is decided by the government department." },
  found: { hi: "योजनाएँ मेल खाती हैं", en: "matching schemes" },
  likely: { hi: "पात्र हो सकते हैं", en: "Likely eligible" },
  maybe: { hi: "पुष्टि आवश्यक", en: "Needs confirmation" },
  whyFits: { hi: "आप क्यों पात्र हो सकते हैं", en: "Why you may qualify" },
  pleaseConfirm: { hi: "पुष्टि करें", en: "To confirm" },
  alsoNeeded: { hi: "अन्य शर्तें", en: "Other conditions" },
  documents: { hi: "ज़रूरी दस्तावेज़", en: "Documents required" },
  howToApply: { hi: "आवेदन कहाँ करें", en: "Where to apply" },
  apply: { hi: "आधिकारिक साइट पर आवेदन करें", en: "Apply on official site" },
  details: { hi: "विवरण", en: "Details" },
  share: { hi: "शेयर करें", en: "Share" },
  helpline: { hi: "हेल्पलाइन", en: "Helpline" },
  official: { hi: "आधिकारिक स्रोत", en: "Official source" },
  reviewed: { hi: "अंतिम समीक्षा", en: "Last reviewed" },
  verifyNote: { hi: "राशि और नियम बदल सकते हैं। आवेदन से पहले आधिकारिक वेबसाइट पर पुष्टि करें।", en: "Amounts and rules can change. Please confirm on the official website before applying." },
  showMore: { hi: "और योजनाएँ दिखाएँ", en: "Show more schemes" },
  editAnswers: { hi: "जानकारी बदलें", en: "Edit details" },
  newProfile: { hi: "नई प्रोफ़ाइल", en: "New profile" },
  deleteData: { hi: "मेरी जानकारी मिटाएँ", en: "Delete my data" },
  deleted: { hi: "आपकी जानकारी मिटा दी गई है।", en: "Your data has been deleted." },
  noProfile: { hi: "परिणाम देखने के लिए पहले पात्रता फ़ॉर्म भरें।", en: "Please complete the eligibility form to see results." },
  noResults: { hi: "कोई योजना मेल नहीं खाई। कुछ जवाब खाली छोड़कर फिर कोशिश करें।", en: "No schemes matched. Try leaving uncertain answers blank." },
  aiBadge: { hi: "AI सारांश", en: "AI summary" },
  aiWorking: { hi: "AI सारांश तैयार हो रहे हैं…", en: "Preparing AI summaries…" },
  yourDetails: { hi: "आपकी जानकारी", en: "Your details" },
  focusAreas: { hi: "प्राथमिकता", en: "Focus areas" },
  example: { hi: "उदाहरण प्रोफ़ाइल", en: "Sample profile" },
  listen: { hi: "सुनें", en: "Listen" },
  stop: { hi: "रोकें", en: "Stop" },

  // Share, print, nearest
  shareResults: { hi: "परिणाम का लिंक शेयर करें", en: "Share results link" },
  linkCopied: { hi: "लिंक कॉपी हो गया। जिसके पास यह लिंक होगा वह ये जवाब देख सकता है।", en: "Link copied. Anyone with the link can see these answers." },
  sharedBanner: { hi: "आप शेयर किए गए परिणाम देख रहे हैं। इस डिवाइस पर कुछ सेव नहीं हुआ है।", en: "You're viewing shared results. Nothing has been saved on this device." },
  useShared: { hi: "ये जवाब अपनाएँ", en: "Use these answers" },
  printSummary: { hi: "सारांश प्रिंट करें", en: "Print summary" },
  findCsc: { hi: "नज़दीकी CSC खोजें", en: "Find nearest CSC" },
  findNearest: { hi: "नज़दीकी खोजें", en: "Find nearest" },

  // Document checklist
  myDocs: { hi: "मेरे दस्तावेज़", en: "My documents" },
  myDocsSub: { hi: "जो दस्तावेज़ आपके पास हैं उन पर निशान लगाएँ। यह इसी डिवाइस पर सेव रहता है।", en: "Tick the documents you already have. Saved on this device only." },
  docsReady: { hi: "सभी दस्तावेज़ तैयार", en: "All documents ready" },
  docsMissing: { hi: "बाकी दस्तावेज़", en: "Missing documents" },
  readyCount: { hi: "योजनाओं के सभी दस्तावेज़ तैयार", en: "schemes have every document ready" },

  // Near misses
  missedTitle: { hi: "जो योजनाएँ थोड़े से रह गईं", en: "Schemes you just missed" },
  missedSub: {
    hi: "हर योजना सिर्फ़ एक जवाब की वजह से नहीं मिली। अगर वह जवाब गलत है, तो अपनी जानकारी बदलें।",
    en: "Each of these failed on just one answer. If that answer is wrong, edit your details.",
  },
  missedNeeds: { hi: "शर्त", en: "Needs" },
  yourAnswer: { hi: "आपका जवाब", en: "Your answer" },

  // Compare
  compare: { hi: "तुलना", en: "Compare" },
  compareHint: { hi: "3 योजनाओं तक चुनकर तुलना करें", en: "Pick up to 3 schemes to compare" },
  compareTitle: { hi: "योजनाओं की तुलना", en: "Compare schemes" },
  compareSelected: { hi: "चुनी गईं", en: "selected" },
  compareEmpty: { hi: "तुलना के लिए परिणाम पेज पर कम से कम 2 योजनाएँ चुनें।", en: "Pick at least two schemes on the results page to compare them." },
  clear: { hi: "हटाएँ", en: "Clear" },
  schemeType: { hi: "प्रकार", en: "Type" },
  whoCanApply: { hi: "कौन आवेदन कर सकता है", en: "Who can apply" },
  forYou: { hi: "आपके लिए", en: "For you" },

  // Print
  printTitle: { hi: "योजना सारांश", en: "Scheme summary" },
  printDate: { hi: "तारीख", en: "Date" },
  printScanResults: { hi: "ये परिणाम फ़ोन पर खोलने के लिए स्कैन करें", en: "Scan to open these results on a phone" },
  printScanApply: { hi: "आवेदन के लिए स्कैन करें", en: "Scan to apply" },
  printNow: { hi: "प्रिंट करें", en: "Print" },
  printHave: { hi: "पास है", en: "Have it" },

  // Voice answering
  voiceMode: { hi: "बोलकर जवाब दें", en: "Answer by voice" },
  voiceIntro: { hi: "हर सवाल पढ़कर सुनाया जाएगा। अपना जवाब बोलें, या विकल्प पर टैप करें।", en: "Each question is read aloud. Speak your answer, or tap an option." },
  voiceSpeak: { hi: "बोलें", en: "Speak" },
  voiceRepeat: { hi: "दोबारा सुनें", en: "Repeat" },
  voiceSkip: { hi: "छोड़ें", en: "Skip" },
  voiceHeard: { hi: "सुना", en: "Heard" },
  voiceNoMatch: { hi: "जवाब समझ नहीं आया। फिर से बोलें या विकल्प पर टैप करें।", en: "Didn't catch that. Try again or tap an option." },
  voiceDone: { hi: "सारे सवाल हो गए। नीचे फ़ॉर्म जाँच लें।", en: "All questions done. Check the form below." },
  voiceClose: { hi: "बंद करें", en: "Close" },
  voiceQuestion: { hi: "सवाल", en: "Question" },
  voiceYouCanSay: { hi: "आप बोल सकते हैं", en: "You can say" },
  voiceAgeHint: { hi: "अपनी उम्र बोलें, जैसे “पैंतीस” या “35”", en: "Say your age, like “thirty five” or “35”" },
  language: { hi: "भाषा", en: "Language" },

  // Browse / detail
  allSchemes: { hi: "सभी योजनाएँ", en: "All schemes" },
  allSchemesSub: { hi: "केंद्र और राज्य सरकार की योजनाएँ, श्रेणी के अनुसार।", en: "Central and state government schemes by category." },
  all: { hi: "सभी", en: "All" },
  search: { hi: "योजना का नाम या लाभ खोजें", en: "Search by scheme name or benefit" },
  central: { hi: "केंद्र सरकार", en: "Central" },
  stateScheme: { hi: "राज्य सरकार", en: "State" },
  eligibility: { hi: "पात्रता", en: "Eligibility" },
  benefit: { hi: "लाभ", en: "Benefit" },
  backToResults: { hi: "परिणामों पर वापस", en: "Back to results" },
  noMatches: { hi: "कोई योजना नहीं मिली।", en: "No schemes found." },

  // Chrome
  home: { hi: "होम", en: "Home" },
  privacy: { hi: "गोपनीयता", en: "Privacy" },
  footer: {
    hi: "योजना सेतु एक स्वतंत्र, निःशुल्क सेवा है और कोई सरकारी वेबसाइट नहीं है। सभी आवेदन आधिकारिक सरकारी पोर्टलों पर होते हैं।",
    en: "Yojana Setu is an independent, free service and not a government website. All applications are made on official government portals.",
  },
} satisfies Record<string, { hi: string; en: string }>;

export type StringKey = keyof typeof S;
export const STRINGS = S;
/** Bengali, Marathi and Tamil live in their own files (complete: TypeScript checks every key). */
const EXTRA: Record<Exclude<Lang, "en" | "hi">, Record<StringKey, string>> = { bn, mr, ta };

export const translate = (key: StringKey, lang: Lang): string => (lang === "en" || lang === "hi" ? S[key][lang] : EXTRA[lang][key]);
