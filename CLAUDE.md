# CLAUDE.md — Yojana Setu (योजना सेतु)

Yojana Setu helps people in rural India with low literacy or limited internet find the government
schemes they may be eligible for. A user fills a short two-step form (English or Hindi). Yojana Setu
then shows the **top 10 schemes**, each with plain-language reasons, a document checklist and the
**official** link to apply.

This is a college project that will be demoed to mentors. Priorities, in order: **the live site works reliably**,
it looks clean on a phone, and the matching is explainable. Don't add tests or evals unless asked.
Everything must use **free** tech and APIs. Don't use Streamlit.

The plan and what's done are in [docs/ROADMAP.md](docs/ROADMAP.md).

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npm run build && npm start
npm run typecheck
npm run validate:data  # run after ANY edit to data/schemes.json
```

## Stack (all free)

- **Next.js 16 (App Router) + React 19 + TypeScript**: a single app with no database, installable as a PWA (`public/manifest.webmanifest`, `public/sw.js`).
- **Matching runs in the browser** from `data/schemes.json`, so it works offline and without any API key.
- **Optional AI**: Google Gemini free tier (`GEMINI_API_KEY` in `.env`), or Groq as an alternative. The model chain is
  `GEMINI_MODEL` → `gemini-flash-lite-latest` → `gemini-flash-latest`. Use the `-latest` aliases because specific Gemini versions get retired.
- **Voice**: the browser's Web Speech API (free, no key). "Listen" reads results and schemes aloud, and "Dictate" fills the free-text need box.
- Plain CSS in `src/app/globals.css` (no Tailwind, no UI kit) and `lucide-react` for icons. A few **ReactBits** components
  (TS + CSS variants, in `src/components/reactbits/`) add motion: SpotlightCard, CountUp, GradientText, ShinyText.
  Theme them with the app's CSS variables (ShinyText computes colors in JS, so pass resolved values via `useCssVar`).
- **OCR**: Tesseract.js (eng + hin) in the browser, loaded only when the user taps "Scan a document". `src/lib/core/ocr-extract.ts`
  turns the text into profile answers; Aadhaar-shaped and other long numbers are stripped first, and the user confirms each field.
- **WhatsApp bot**: Meta WhatsApp Cloud API webhook at `/api/whatsapp`. The bot (`src/lib/whatsapp/bot.ts`) is pure and stateless:
  the answers so far ride in each reply id, so there is no database. `?dry=1` simulates it in development.

## Layout

```
data/schemes.json            # THE scheme database (56 schemes, bilingual, official links)
src/lib/core/                # pure logic, no I/O
  types.ts                   # Scheme, Rule, Profile, FieldKey, Category…
  fields.ts                  # profile questions (labels, options, icons, voice synonyms, showIf)
  rules.ts                   # tri-state rule engine: pass / fail / unknown
  match.ts                   # filter + scoring → ranked matches
  describe.ts                # rule → plain Hindi/English sentence
  labels.ts                  # categories, apply channels, documents (hi/en)
  needs.ts                   # offline keyword need detection
  schema.ts                  # zod schema used by validate-data
src/lib/llm/provider.ts      # Gemini/Groq via fetch; returns null on any failure
src/lib/schemes.ts           # loads JSON + isOfficialUrl() allowlist
src/lib/storage.ts           # localStorage (profile, language); the only place user data lives
src/lib/speech.ts            # read-aloud (TTS) + dictation (speech recognition)
src/lib/demo.ts              # sample personas for "Try an example" (?demo=farmer|widow|student|mother)
src/lib/i18n/strings.ts      # every UI string, hi + en
src/app/                     # pages: / , /profile (two-step form), /results, /scheme/[id], /schemes, /privacy
src/components/              # Header/Footer, SchemeCard, Voice, DocScan (OCR), icons (+ BrandMark logo)
src/components/reactbits/    # ReactBits components (SpotlightCard, CountUp, GradientText, ShinyText)
src/lib/core/ocr-extract.ts  # OCR text → profile answers (pure)
src/lib/core/voice-answer.ts # spoken transcript → form answer (pure)
src/lib/share.ts             # shareable results link (?p=), validated decode
src/lib/useDocs.ts           # "documents I have" (localStorage) + readiness
src/lib/i18n/                # strings.*.ts, content.*.ts, words.ts (grammar per language), apply.ts
src/app/compare, src/app/print # side-by-side compare; printable summary with QR codes
src/lib/whatsapp/            # bot.ts (stateless chat flow, pure) + cloud.ts (Cloud API transport)
src/app/api/whatsapp         # WhatsApp webhook (GET verify, POST messages)
src/app/api/enhance          # AI re-rank + simple "why" (shortlist IDs only)
src/app/api/need             # AI free-text need → categories
scripts/validate-data.ts
```

## Product rules (don't break these)

1. **No invented schemes or links.** Everything shown comes from `data/schemes.json`. The AI may only re-order
   and re-word the shortlist. `/api/enhance` drops any ID that isn't in the shortlist.
2. **Official links only.** `isOfficialUrl()` must pass (`*.gov.in`, `*.nic.in`, plus a small allowlist) or the
   Apply button is hidden. If you add a domain to the allowlist, it must be a real government portal.
3. **Say "may be eligible", never "you are eligible".** Show the reasons; final eligibility is decided by the department.
4. **Never ask for Aadhaar, bank or OTP numbers, names or phone numbers.** User data stays in localStorage only.
   AI requests carry only eligibility fields (no PII).
5. **"Don't know" is always allowed.** An unanswered question makes a rule `unknown`, which never hides a scheme.
6. **The site must work with no API key and offline.** The AI only adds to the results, so every AI path needs a silent fallback.

## How to change things

- **Add a scheme:** add an entry to `data/schemes.json` with both `hi` and `en` text, documents from `DOCUMENTS`,
  channels from `CHANNELS`, and an official `applyUrl`. Then run `npm run validate:data`.
- **Add a profile question:** add the key to `FIELD_KEYS` in `types.ts`, a definition in `fields.ts` (with hi/en,
  and `step`), and use it in at least one scheme rule. The validator fails if a field is unused.
- **Rule format:** `{ "field": "age", "op": "between", "value": [18, 40] }`, nested with `{ "all": [...] }` and `{ "any": [...] }`.
  Ops: `eq, in, notIn, gte, lte, between`. Range fields (income, land, disability) compare by their option ranges.
- **New UI text** goes in `strings.ts` (en + hi) **and** in `strings.bn.ts`, `strings.mr.ts`, `strings.ta.ts` (TypeScript fails if a key is missing). Never hard-code visible text.
- **Languages**: `en, hi` are complete everywhere. `bn, mr, ta` cover the UI, form, labels and scheme names + benefits
  (`src/lib/i18n/content.*.ts`, `data/i18n/schemes.*.json`, merged at startup by `src/lib/i18n/apply.ts`). Scheme descriptions and
  conditions fall back via `pick()` (Marathi → Hindi, Bengali/Tamil → English). Always render `Text` with `tx()` / `pick()`, never `x[lang]`.
  Keep amounts as digits in translations; the numbers must match the English text exactly. The WhatsApp bot stays English/Hindi.
- **Design rules (from the user):** professional look, **no emojis anywhere** (use `lucide-react` icons), and keep the form
  to **two steps** (`step: 1 | 2` on each field in `fields.ts`) with compact controls: selects, segmented buttons, Yes/No toggles.
  Every field is optional; blank means "unknown". The default language is English, with a Hindi toggle in the header.
- Styling: CSS variables in `globals.css` (light and dark), Inter + Noto Sans Devanagari via `next/font`, responsive from 390px
  phones to desktop (results and detail pages get a sidebar at ≥900px).
- Before saying something is done, run `npm run typecheck`, `npm run validate:data` and `npm run build`.
