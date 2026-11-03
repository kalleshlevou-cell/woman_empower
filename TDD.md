# EmpowerHer — Technical Design Document

**GitHub URL**: `https://github.com/kalleshlevou-cell/woman_empower`
**Live App URL**: _(add if deployed)_

---

## 1. Overview

EmpowerHer is a bilingual (Hindi/English) web portal for an NGO focused on women's welfare in Madhya Pradesh. It serves two core purposes:

1. **Scheme Finder** — Helps rural women discover and check eligibility for government welfare schemes through a questionnaire-driven, criteria-matching engine.
2. **Donation Platform** — Enables donors to contribute to NGO campaigns via Razorpay, with automated 80G-compliant tax receipt generation (PDF) and Form 10BD export for IT compliance.

The platform provides a full admin CMS for managing schemes (with AI-draft content review), campaigns, donation reports, and audit logs.

---

## 2. Architecture

### 2.1 Why MERN Stack

| Concern | Choice | Rationale |
|---------|--------|-----------|
| **Frontend** | React 19 + Vite 8 | Fast HMR for development; component-based architecture suits the bilingual UI with many shared components |
| **Styling** | Tailwind CSS 3 + Noto Sans Devanagari | Utility-first CSS for rapid UI; Google Fonts Devanagari support for native Hindi rendering |
| **Backend** | Express 4 on Node.js | Lightweight REST API server; rich npm ecosystem for Razorpay, PDFKit, Nodemailer integrations |
| **Database** | MongoDB Atlas (Mongoose 8) | Schema-flexible documents suit the variable `eligibilityCriteria` arrays; free-tier Atlas for easy deployment |
| **Payments** | Razorpay SDK | Industry-standard Indian payment gateway with test mode; HMAC signature verification for security |

### 2.2 High-Level Architecture

```
┌──────────────────┐         ┌───────────────────┐         ┌──────────────┐
│   React SPA      │  HTTP   │   Express API     │  TCP    │  MongoDB     │
│   (Vite, :5173)  │ ──────► │   (Node, :5000)   │ ──────► │  Atlas       │
│                  │  REST   │                   │         │  (empowerher)│
│  - Hindi/English │ ◄────── │  - Auth (JWT)     │ ◄────── │              │
│  - Razorpay SDK  │  JSON   │  - Eligibility    │         └──────────────┘
│  - PDF download  │         │  - Razorpay verify │
└──────────────────┘         │  - PDF generation  │
                             │  - Email (SMTP)    │
                             │  - Cloudinary      │
                             └───────────────────┘
```

**Assumption**: Razorpay test mode is used throughout. No real money is processed. 80G receipts are for demonstration only.

### 2.3 Monorepo Structure

The project is a monorepo with a root `package.json` that uses `concurrently` to run both apps. The server and client are independent npm projects sharing no code.

```
empowerher/
├── package.json          # Root: concurrently runs server + client
├── server/               # Express API
│   └── src/
│       ├── config/       # DB connection (with DNS fallback)
│       ├── models/       # 7 Mongoose models
│       ├── controllers/  # Business logic (auth, schemes, donations, admin)
│       ├── routes/       # Express routers
│       ├── middleware/   # JWT auth, rate limiter, error handler, multer
│       └── utils/        # PDF generator, email service, eligibility engine, receipt counter
├── client/               # React SPA
│   └── src/
│       ├── api/          # Axios instance + endpoint wrappers
│       ├── components/   # Navbar, Footer, SchemeCard, CampaignCard, etc.
│       ├── context/      # AuthContext, LanguageContext
│       ├── hooks/        # useAuth, useSchemes
│       ├── pages/        # 13 page components
│       └── utils/        # Validators, formatters, constants
└── deployment.md
```

---

## 3. Data Model

### 3.1 Entity-Relationship Overview

```
User (1) ──── (N) Donation ──── (1) Campaign
  │                  │
  │                  └── receiptNumber (via Counter)
  │
  ├── (N) Bookmark ──── (1) Scheme
  │
  └── (N) AdminLog   (admin audit trail)

Scheme ──── eligibilityCriteria[] (embedded sub-documents)
Enquiry ──── optional User, optional Scheme
```

### 3.2 Model Details

| Model | Key Fields | Notes |
|-------|-----------|-------|
| **User** | name, email (unique, lowercase), passwordHash, role (donor/admin), pan, phone, address | Password hashed via bcrypt (12 rounds) in pre-save hook. PAN validated with regex `^[A-Z]{5}[0-9]{4}[A-Z]$`. DPDP: PAN/email/phone retained per 80G (7 years). |
| **Scheme** | title_hi, title_en, description_hi/en, aiDraft_hi, aiDraftApproved, need (enum), state, districts[], eligibilityCriteria[], benefits, documents[], applicationProcess, officialUrl, lastCheckedAt, helpCentre, status (draft/published) | Indexed on `{need, state, status}`. eligibilityCriteria uses `{field, operator, value}` sub-documents with operators: eq, gte, lte, includes, bool. |
| **Campaign** | title, description, targetAmount (paise), raisedAmount (paise), image (Cloudinary URL), status (active/closed), startDate, endDate | All monetary values stored as integer paise. |
| **Donation** | donorId (nullable for guests), campaignId, amount (paise), paymentStatus (pending/success/failed), razorpayOrderId/PaymentId/Signature, pan, donorName/Email/Phone/Address, receiptNumber (unique sparse), isMonthly | Razorpay fields stored for audit. Receipt number generated atomically via Counter model. |
| **Counter** | _id (string key), seq (auto-increment) | Single-row pattern. Only `getNextReceiptNumber()` in `receiptCounter.js` may generate receipt numbers — format: `RCP-{year}-{seq padded to 6}`. |
| **Bookmark** | userId, schemeId | Compound unique index prevents duplicates. |
| **Enquiry** | userId (nullable), schemeId (nullable), message, status (open/closed) | For helpline callback requests. |
| **AdminLog** | adminId, action, entityType, entityId, details (Mixed), timestamp | Every admin mutation logs an entry. |

**Assumption**: Money is always stored as integer paise (₹1 = 100 paise) to avoid floating-point rounding errors. Conversion to rupees happens only at display/export time.

---

## 4. Main Flows

### 4.1 Scheme Discovery + Eligibility Check

```
User opens /schemes
    │
    ├── Filter by keyword, need, district, type
    │   └── GET /api/schemes?q=...&need=pension&district=Bhopal
    │       └── Server filters {status: 'published'}, paginated response
    │
    └── Fill eligibility questionnaire (maritalStatus, age, bplCard, pregnant, shmMember)
        └── POST /api/schemes/eligibility {answers}
            └── Server loads all published schemes
            └── Calls eligibilityEngine.matchSchemes(answers, schemes)
                └── Pure function: AND logic on each scheme's eligibilityCriteria[]
                └── Returns matching schemes with matchLabel: 'संभावित मिलान'
```

**Assumption**: The eligibility engine uses AND logic — ALL criteria must match. A scheme with no criteria never matches. This is a deterministic rule-based engine, not ML.

### 4.2 Donation + Payment Flow

```
Step 1: Select Campaign + Amount
    │
Step 2: Enter Donor Details (name, email, phone, PAN, address, privacy consent)
    │   └── POST /api/donations/create-order
    │       └── Joi validation (amount ≥ ₹500 = 50000 paise, PAN regex, privacy=true)
    │       └── razorpay.orders.create({amount, currency: 'INR'})
    │       └── Save Donation with paymentStatus: 'pending'
    │       └── Return {orderId, amount, razorpayKeyId}
    │
Step 3: Razorpay Checkout (client-side SDK)
    │   └── On success callback:
    │       └── POST /api/donations/verify {razorpayOrderId, razorpayPaymentId, razorpaySignature}
    │           └── HMAC-SHA256 signature verification (server-side only, using crypto.createHmac)
    │           └── Foreign card check (razorpay.payments.fetch → international flag)
    │           └── Generate receipt number via Counter (atomic findOneAndUpdate $inc)
    │           └── Generate 80G PDF via PDFKit (Trust PAN, donor PAN, amount in words)
    │           └── Update Donation: paymentStatus='success', receiptNumber
    │           └── Atomically increment Campaign.raisedAmount
    │           └── Send email with PDF attachment (Ethereal in dev)
    │           └── Return {receiptNumber, donationId}
    │
    └── Client shows success screen + Download Receipt button
```

**Key security decision**: The Razorpay signature is verified exclusively on the server using `crypto.createHmac`. The frontend never trusts its own payment success — it always waits for the server's verification response.

### 4.3 Admin CMS — Scheme Management with AI Draft

```
Admin creates scheme (POST /api/admin/schemes)
    └── Server auto-generates aiDraft_hi (mock: hardcoded Hindi string)
    └── aiDraftApproved = false
    └── Admin sees yellow "AI Draft - समीक्षा करें" badge

Admin reviews and clicks "Approve AI Draft"
    └── POST /api/admin/schemes/:id/approve-draft
    └── aiDraftApproved = true
    └── Badge turns green "Approved"

Admin publishes scheme (PUT /api/admin/schemes/:id {status: 'published'})
    └── Scheme appears on public /schemes page
    └── If aiDraftApproved is still false, SchemeDetail shows warning banner
```

**Assumption**: The AI draft is currently mocked with a hardcoded Hindi paragraph (`"यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।"`). In production, this would be replaced with a Gemini/OpenAI API call to generate a Hindi summary from the English description. The admin approval workflow is fully functional regardless.

---

## 5. How the AI Part Works

### Current Implementation (Mock)

When an admin creates a new scheme via `POST /api/admin/schemes`, the server auto-populates the `aiDraft_hi` field with a hardcoded Hindi string simulating AI-generated content. The `aiDraftApproved` flag is set to `false`.

This creates a **human-in-the-loop review workflow**:
1. AI generates a Hindi draft (mocked)
2. Admin reviews the draft in the CMS (shown in a read-only text area with a yellow "AI Draft" badge)
3. Admin either approves (badge turns green) or edits before publishing
4. Public users see a warning banner on unapproved drafts

### Production Path

To integrate real AI, replace the hardcoded string in `adminController.js` line 102 with:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent(
  `Summarize this government scheme in simple Hindi for rural women: ${req.body.description_en}`
);
scheme.aiDraft_hi = result.response.text();
```

The approval workflow, badge UI, and admin review process remain unchanged — only the content source changes.

**Assumption**: The AI draft is labelled as mock/simulated in all cases. The approval workflow (the real value) is fully implemented.

---

## 6. UI and Design Decisions

### 6.1 Design Language

| Decision | Choice | Why |
|----------|--------|-----|
| **Primary colour** | Saffron `#F5A623` | Indian cultural association; used for backgrounds/accents, never for body text (fails WCAG contrast on white) |
| **Secondary colour** | Green `#2D7D46` | Trustworthy, action-oriented; used for all CTA buttons; passes WCAG AA on white |
| **Typography** | Noto Sans Devanagari (Google Fonts) | Native Hindi rendering; 400–700 weights for hierarchy |
| **Layout** | Mobile-first responsive (Tailwind breakpoints) | Target users are rural women likely on mobile |

### 6.2 Key Screens

**Home Page** — Hero strip (120px, saffron gradient) → Quick scheme finder (need cards + district dropdown, above the fold) → Featured schemes (3 cards) → Campaigns → Impact stats (animated counters) → Testimonials → Footer. The scheme finder is intentionally placed above the fold because it's the primary user action.

**Scheme Finder** — Two-panel layout: left sidebar with filters + collapsible eligibility questionnaire (6 questions in Hindi), right panel with paginated scheme cards. Matched schemes get a "संभावित मिलान" (possible match) badge. This design lets users filter and check eligibility simultaneously.

**Donation Flow** — 3-step wizard (Campaign → Details → Payment) with step indicator. Step 2 includes DPDP privacy notice and mandatory consent checkbox. Step 3 shows a permanent red "🔴 TEST MODE" banner. This was chosen over a single-page form to reduce cognitive load for Hindi-speaking users.

**Admin Dashboard** — Stat cards (total donations, amount raised, active campaigns, published schemes) + campaign-wise bar chart + quick navigation links. Admin CMS pages for schemes, campaigns, donations, and logs.

### 6.3 Accessibility (WCAG 2.1 AA)

- All navigation has `role="navigation"`, `aria-label`
- Form fields have explicit `<label>` with `htmlFor`; errors linked via `aria-describedby`
- Focus rings visible (`focus:ring-2`)
- Progress bars have `aria-valuenow`/`aria-valuemin`/`aria-valuemax`
- Language toggle announces change via context
- Colour contrast: saffron used only for decorative backgrounds; green `#2D7D46` used for actionable text/buttons

**Assumption**: Full WCAG certification requires assistive technology testing. The implementation covers keyboard navigation, focus management, semantic HTML, and ARIA attributes.

---

## 7. What We Cut and What We Would Do Next

### Cut (labelled assumptions)

| Feature | Status | Reason |
|---------|--------|--------|
| Real AI content generation | Mocked with hardcoded Hindi string | API key + cost constraints; approval workflow is fully functional |
| Real payment processing | Razorpay test mode only | Production keys require business verification |
| Real email delivery | Ethereal test account in dev | SMTP credentials needed for production |
| Cloudinary image uploads | Falls back to local `uploads/` folder | Works without Cloudinary keys configured |
| Hindi numeral conversion in PDF | English words only (`amountToWords`) | Full Hindi localization out of scope |
| Multi-language i18n library | Simple React context toggle | `react-i18next` would be used for 3+ languages |
| Automated testing | No unit/integration tests | Time constraint; would add Jest + Supertest + React Testing Library |
| Rate limiting on registration | Only on login (10 req/15 min) | Could be added for abuse prevention |

### What We Would Do Next

1. **Real Gemini AI integration** — Replace mock draft with Gemini API call for Hindi scheme summaries
2. **Automated tests** — Jest + Supertest for API, React Testing Library for components, Playwright for E2E
3. **Deployment** — CI/CD pipeline with GitHub Actions → Render/Railway
4. **Production email** — Replace Ethereal with SendGrid/Mailgun
5. **Encryption at rest** — Encrypt PAN fields in MongoDB using Mongoose field-level encryption (DPDP compliance)
6. **Analytics dashboard** — Real-time donation tracking, district-wise scheme usage heatmap
7. **PWA support** — Offline scheme viewing for areas with poor connectivity
8. **SMS notifications** — Twilio integration for scheme eligibility alerts (critical for rural users without email)

---

## 8. API Endpoints Summary

### Public

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create donor account |
| POST | `/api/auth/login` | Login (rate-limited: 10/15min) |
| GET | `/api/auth/me` | Get current user (protected) |
| GET | `/api/schemes` | List published schemes (paginated, filterable) |
| GET | `/api/schemes/:id` | Get single scheme |
| POST | `/api/schemes/eligibility` | Check eligibility against all schemes |
| POST | `/api/schemes/:id/bookmark` | Bookmark a scheme (protected) |
| GET | `/api/schemes/bookmarks` | Get user's bookmarks (protected) |
| GET | `/api/campaigns` | List active campaigns |
| POST | `/api/donations/create-order` | Create Razorpay order |
| POST | `/api/donations/verify` | Verify payment signature |
| GET | `/api/donations/my` | Get user's donations (protected) |
| GET | `/api/donations/:id/receipt` | Download receipt PDF (protected) |
| POST | `/api/enquiries` | Submit helpline callback request |

### Admin (protected + admin role)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/dashboard` | Aggregated stats |
| GET/POST | `/api/admin/schemes` | List/Create schemes |
| PUT/DELETE | `/api/admin/schemes/:id` | Update/Soft-delete scheme |
| POST | `/api/admin/schemes/:id/approve-draft` | Approve AI draft |
| GET/POST | `/api/admin/campaigns` | List/Create campaigns |
| PUT | `/api/admin/campaigns/:id` | Update campaign |
| GET | `/api/admin/donations` | List donations (filterable) |
| GET | `/api/admin/donations/export-csv` | Stream CSV export |
| GET | `/api/admin/donations/form10bd` | Stream Form 10BD CSV |
| GET | `/api/admin/logs` | View audit logs |

---

## 9. Security Measures

- **Authentication**: JWT (7-day expiry) with bcrypt password hashing (12 rounds)
- **Authorization**: Role-based (donor/admin) with middleware guards
- **Payment verification**: Server-side HMAC-SHA256 signature check — frontend never trusted
- **Rate limiting**: Login endpoint (10 requests / 15 minutes)
- **Input validation**: Joi on server, Zod on client (PAN regex, email, phone, amount)
- **CORS**: Origin restricted to configured CLIENT_URL
- **Foreign card blocking**: Razorpay's `international` flag checked server-side
- **DPDP compliance**: Comments on every model/controller handling personal data; privacy consent required before donation
- **Soft deletes**: Schemes are set to 'draft' status, never hard-deleted
- **Audit trail**: Every admin mutation logged to AdminLog collection
- **CSV streaming**: Uses Mongoose cursor to avoid loading all records into memory
