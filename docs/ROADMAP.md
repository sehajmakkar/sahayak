# Yojana Setu Roadmap

## Built (v1, for the mentor demo)

| Area | What's there |
|---|---|
| Scheme data | 56 schemes (49 central + 7 state: UP, Bihar, Maharashtra, MP, Odisha, Tamil Nadu, Karnataka) with Hindi and English text, structured eligibility rules, documents, where to apply, official links, and helplines |
| Profile | A two-step form (basic details, then household and needs) with selects, segmented buttons and Yes/No toggles. Every field is optional, and fields that don't apply are hidden |
| Matching | A rule engine that marks each rule as pass, fail or unknown, then scores and returns the top 10. Each result shows its reasons and what still needs confirming |
| AI (free) | Gemini free tier re-orders the shortlist and writes simple one-line explanations. It also reads free-text or spoken needs. If the AI is down or no key is set, the site falls back to the rule-based results |
| Voice | Results and scheme pages can be read aloud, and the needs box supports dictation (browser Web Speech API) |
| Trust & privacy | Data is stored on the device only, a privacy notice sits on the form, there's a delete-my-data button and a scam warning, and Apply links must be on a government domain |
| Design | Professional, emoji-free UI with lucide icons; responsive from phone to desktop; light and dark themes |
| Reach | Installable PWA that works offline after the first visit, a WhatsApp share button, helper (CSC/ASHA) use via "New profile", and sample profiles for demos |
| WhatsApp bot | Tap-to-answer chat (Hindi/English) over the free WhatsApp Cloud API: 10 questions, top 5 schemes with reasons, details with documents and the official link. No database: state rides in the reply ids |
| Document scan | On-device OCR (Tesseract.js) reads a ration card or an income, caste or disability certificate and pre-fills the form after the user confirms |
| Helper tools | Document checklist with per-scheme readiness, compare up to 3 schemes, printable one-page summary with QR codes, shareable results link, "find nearest" CSC / bank / post office |
| Explainability | "Why not eligible?" lists schemes missed on one fixable answer |
| Voice & languages | Voice-first answering mode; UI in English, Hindi, Bengali, Marathi and Tamil (scheme descriptions in the last three still fall back) |

## Next phases (if the project continues)

1. **More data**: semi-automate adding schemes from myScheme.gov.in. Fetch a page, have the AI extract it into the `schemes.json` format, then have a person review it before it goes live. Add more states.
2. **More languages**: native-speaker review of Bengali, Marathi and Tamil, translate scheme descriptions, then Telugu, Gujarati, Punjabi. Use Bhashini (free government API) for speech where browser voices are missing.
3. **WhatsApp bot, phase 2**: voice notes (speech-to-text) and free-text needs in the chat, plus reminders for deadlines the user opts into.
4. **Helper mode**: a dashboard for CSC operators and ASHA workers to manage profiles for many people and print summaries.
5. **Freshness**: an automatic link checker plus "last reviewed" alerts, and a way for users to report a wrong scheme.
6. **Feedback loop**: ask users "Did you apply? Did you get it?" and use the answers to improve ranking.

## Known limitations (say these honestly in the demo)

- Scheme amounts and rules were compiled by hand and can go out of date. Every card links to the official site and says to confirm there.
- Some eligibility depends on government lists (e.g. SECC 2011 for PM-JAY or PMAY-G) that we can't check, so they are shown as "also required".
- Speech recognition works best in Chrome on Android. If voice isn't supported, the buttons still work.
