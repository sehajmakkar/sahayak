# Yojana Setu · योजना सेतु

**Find the government schemes you may be eligible for, in English, Hindi, Bengali, Marathi or Tamil, with voice.**

Many people in rural India never hear about the schemes meant for them, or can't search dozens of
government websites. With Yojana Setu, a person (or a CSC / ASHA / Anganwadi worker helping them) answers
a few simple questions. Yojana Setu then shows the **top 10 schemes** for them, explains *why* each one fits,
lists the documents needed, and links to the **official** website to apply.

## Features

- **Two-step form**: basic details, then household and needs. Every field is optional.
- **Explainable matching**: a rule engine checks 56 central and state schemes and shows reasons and items to confirm.
- **Free AI (optional)**: Google Gemini re-orders the shortlist and writes a plain-language summary per scheme. It can't invent schemes or links.
- **Five languages**: English, Hindi, Bengali, Marathi and Tamil, with read-aloud for results and dictation for the needs box.
- **Answer by voice**: every question is read aloud and answered by speaking (numbers, amounts like "50 हज़ार", yes/no, option names), with tap targets as a fallback.
- **Document checklist**: tick the documents you have; every result shows "All documents ready" or what's missing. Scanned documents tick themselves.
- **Why not eligible?**: schemes missed on a single, fixable answer (income bracket, ration card, bank account, age near a limit).
- **Compare** up to 3 schemes side by side, **print** a one-page summary with QR codes for helpers to hand over, and **share** results as a link (answers ride in the link; no server storage).
- **Find nearest**: CSC, bank, post office and other places to apply open in maps ("near me"); the app never reads your location.
- **Private**: no login and no database. Answers stay on the device, and we never ask for Aadhaar, bank or OTP numbers.
- **Official links only**: Apply buttons go only to `gov.in` / `nic.in` portals.
- **Works on weak internet**: an installable PWA. Matching runs on the device and works offline.
- **Scan a document (OCR)**: photograph a ration card or an income, caste or disability certificate to pre-fill the form. OCR runs on the phone (Tesseract.js); the photo is never uploaded and the user confirms every detected field.
- **WhatsApp bot**: the same questions as a tap-to-answer chat in Hindi or English, with results, document checklists and official apply links. Stateless, with no database.
- **Sample profiles** for demos, and a WhatsApp share button for every scheme.

## Run it

```bash
npm install
cp .env.example .env        # optional: add a free GEMINI_API_KEY from https://aistudio.google.com/apikey
npm run dev                 # open http://localhost:3000
```

The site works fully without any API key. The key only adds AI explanations.

**Production:** `npm run build && npm start`

**Deploy for free:** push to GitHub, then import the repo on [vercel.com](https://vercel.com). Add `GEMINI_API_KEY`
under *Settings → Environment Variables*. Voice input needs HTTPS, which Vercel provides.

## WhatsApp bot setup (free)

1. On [developers.facebook.com](https://developers.facebook.com), create an app, add the **WhatsApp** product, and note the
   test phone number's **Phone number ID** and a **temporary access token**.
2. Fill in `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` (any random string) and `WHATSAPP_APP_SECRET`
   in `.env` (or in Vercel's environment variables).
3. Under *WhatsApp → Configuration*, set the webhook URL to `https://<your-site>/api/whatsapp` with the same verify token,
   and subscribe to **messages**. Webhooks need a public HTTPS URL, so deploy first (or use a tunnel when testing locally).
4. Add your own number as a test recipient and send "Hi".

**Try it without Meta:** with `npm run dev` running, simulate the chat locally:

```bash
curl -s -X POST 'http://localhost:3000/api/whatsapp?dry=1' -d '{"text":"hi"}'
```

Then send the `id` of any button or row back as `{"id":"..."}`. The simulator is disabled in production builds.

## Demo script (2 minutes)

1. Home page: switch **EN / हिं** in the header to show both languages.
2. **Sample profiles → "Widow, farm labourer, UP"**: widow pension, rural employment, free LPG, housing and toilet support, each with reasons and an AI summary.
3. Open a scheme: eligibility checked against the profile, document checklist, where to apply, the **official Apply** button, and the helpline.
4. **Check eligibility**: fill step 1 (about 7 fields) and step 2 (household and needs), then show that blank fields still work.
5. Privacy page: everything stays on the device, with a delete button.

## How it works

```
Questions ──► Profile (on phone) ──► Rule engine (pass / fail / unknown per rule)
                                          │
                       data/schemes.json ─┘──► score & rank ──► Top 10 + reasons
                                                                    │
                                     optional Gemini: re-order + simple "why" (IDs from shortlist only)
```

Tech: Next.js 16, React 19, TypeScript, zod, Web Speech API, Tesseract.js (on-device OCR), ReactBits UI components, WhatsApp Cloud API, Gemini free tier. No paid services.

## Adding schemes

Edit `data/schemes.json` (see `CLAUDE.md` for the format), then run `npm run validate:data`.

> Yojana Setu is an independent student project, not a government website. Scheme details can change, so always
> confirm on the official portal before applying.
