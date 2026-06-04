# DESIGN BRIEF — match the "Elite Preparation" mockup

The file `design-reference.html` (the uploaded mockup) is the **visual target**. Adopt its exact
look — colors, fonts, spacing, shadows, card styles, hero, sections — and apply it across the REAL
Next.js app. Keep ALL existing functionality, routing, auth, data, and server logic unchanged. This
is a **restyle only**: no fake data wired into real flows, no SPA rewrite (keep Next.js routes).

## Design tokens (extract exactly from design-reference.html)
- **Fonts:** body `Sora` (300–800), display/headings `Playfair Display` (700/900, italic for highlights). Load via `next/font/google`.
- **Colors:**
  - blue `#1a56db`, blue2 `#1345b5`, blue3 `#0e3490`
  - sky `#e8f0fe`, sky2 `#dbeafe`
  - dark `#0a1628`, dark2 `#152045`, footer `#060e1e`
  - text mid `#3a5070`, muted `#6b7fa3`
  - gold accent `#f5b800`
  - off-white bg `#f7f9ff`, white `#ffffff`
  - border `rgba(26,86,219,0.12)`
  - subject accents: Biology cyan `#06b6d4`, Chemistry indigo `#6366f1`, Physics orange `#f97316`, English green `#22c55e`, Logical Reasoning pink `#ec4899`
- **Radii:** cards `14px`, large `20–24px`, pills `99px`.
- **Buttons:** `.btn-blue` solid blue with shadow + hover lift; `.btn-ghost` bordered; large/xl variants. Match exactly.
- **Shadows/hover:** subtle blue-tinted shadows; cards lift `translateY(-3 to -5px)` on hover.
- Set these as Tailwind theme values + CSS variables so every page is consistent. Icons: Font Awesome (as in mockup) or lucide-react — pick one and stay consistent.

## Map mockup sections → REAL pages
- **Topbar + sticky glass nav + footer**: turn into shared layout components used on every page. Logo "Elite Preparation" style (gradient logo box + Playfair wordmark) — but keep the brand name; if the brand is "MDCAT Prep" use that wording, else "Elite Preparation". Nav links route to real pages (Home, Subjects, Mock Tests, Pricing, Contact, Dashboard, Login/Sign out). Mobile hamburger menu must work.
- **Landing `/`** (rebuild to match the mockup's home page, with REAL data where it exists):
  - Hero (dark gradient + grid + glow): headline with gold italic highlight, subtext, two CTAs ("Start Free Practice" → /subjects, "View Pricing" → /pricing). Right-side dashboard card with the 5 subjects + progress bars (static/sample visuals are fine here — it's decoration).
  - Subjects section: the 5 real subjects from DB as the colored cards (bio/chem/phys/eng/lr accents), linking to `/subjects/[slug]`.
  - Features section (dark): "Why choose us" cards.
  - Mock tests teaser: pull published tests if any, else show a tasteful "coming soon"/sample.
  - Stats section (blue) + Testimonials + FAQ accordion + final CTA — these can use placeholder marketing content (clearly generic, no invented hard numbers presented as fact). 
  - **Pricing teaser** pulls the REAL `plans` table.
- **`/subjects`, `/subjects/[slug]`**: style with the subject cards + colored accents; keep the real free/premium MCQ data and Practice buttons.
- **`/practice/[topicId]`**: clean focused MCQ card in this design language; green/red answer feedback; progress + score.
- **`/pricing`**: the pricing-card layout from the mockup (featured/popular card = dark), driven by the real `plans` table (PKR "Rs 1,500").
- **`/subscribe/[planId]`**: payment form styled to match; JazzCash details (03248905884, "MDCAT Prep") in a highlighted box. **Only JazzCash** — do NOT show EasyPaisa/cards/bank from the mockup (we don't support them yet).
- **`/dashboard`**: styled dashboard using the card/progress visual language; real subscription status + (later) attempts.
- **`/admin` + `/admin/payments`**: apply the same tokens for a clean, consistent admin look (lighter than the marketing pages — readable tables, blue primary / red reject).
- **Contact page**: optional — can add `/contact` with the mockup's contact layout (form can be non-functional or email link for now).

## Rules
- Do NOT invent claims we can't back: no specific student counts as fact, no refund policy, no payment methods we don't have (JazzCash only). Generic marketing copy is fine; specific false facts are not.
- Do NOT convert the app to the mockup's `showPage()` SPA routing — keep Next.js file-based routes.
- Fully responsive (mobile-first), accessible (focus states, labels, alt text).
- Commit when the restyle is done.
