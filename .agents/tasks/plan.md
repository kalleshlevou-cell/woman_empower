# EmpowerHer — Implementation Plan

Full-stack MERN application. Project root: `c:\Users\giris\Desktop\New folder (11)\empowerher\`

Work is grouped into six layers. Each layer depends on the one before it. Within a layer, items are ordered by dependency. Every item leaves the codebase in a buildable state.

---

## Layer 0 — Project Scaffolding

- [ ] 1. **Root workspace setup**
  Create the monorepo root with `package.json` that has a `dev` script using `concurrently` to run both apps.
  Files:
  - `package.json` — scripts: `{ "dev": "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"", "install:all": "npm i && npm i --prefix client && npm i --prefix server" }`
  - `README.md` — setup instructions, test credentials, known limitations (see Layer 6 for full README content)
  - `.gitignore` — node_modules, dist, .env, *.pdf
  Verify: `cat package.json` shows the concurrently dev script.

- [ ] 2. **Server scaffold — Express app skeleton**
  Run `npm init -y` in `server/`, install all server dependencies, create the entry point and folder structure.
  ```
  server/
    src/
      config/        db.js, constants.js
      models/        (populated in Layer 1)
      routes/        (populated in Layer 2)
      middleware/    auth.js, errorHandler.js, rateLimiter.js
      controllers/   (populated in Layer 2)
      utils/         pdfGenerator.js, emailService.js, receiptCounter.js, eligibilityEngine.js
    server.js
    .env.example
  ```
  Dependencies (exact versions):
  ```
  express@4.18.3 mongoose@8.4.0 bcryptjs@2.4.3 jsonwebtoken@9.0.2
  joi@17.13.1 razorpay@2.9.2 pdfkit@0.15.0 nodemailer@6.9.13
  multer@1.4.5-lts.1 cloudinary@2.2.0 express-rate-limit@7.3.1
  cors@2.8.5 dotenv@16.4.5 concurrently@8.2.2 crypto (built-in)
  ```
  Dev: `nodemon@3.1.3`
  `server/package.json` scripts: `{ "dev": "nodemon src/server.js", "start": "node src/server.js", "seed": "node src/seed.js" }`
  Files: `server/package.json`, `server/src/server.js`, `server/.env.example`
  Verify: `cd server && node src/server.js` starts without errors (MongoDB not required yet; app should fail gracefully on DB connect, not on import).

- [ ] 3. **Client scaffold — Vite + React + Tailwind**
  Run `npm create vite@latest client -- --template react` in the project root, then install client dependencies.
  Dependencies (exact versions):
  ```
  react-router-dom@6.23.1 axios@1.7.2 react-hook-form@7.51.5 zod@3.23.8
  @hookform/resolvers@3.4.2 jspdf@2.5.1 @tailwindcss/forms@0.5.7
  ```
  Configure Tailwind:
  - `tailwind.config.js`: extend theme with `colors: { primary: '#F5A623', secondary: '#2D7D46' }`, fontFamily `devanagari: ['Noto Sans Devanagari', 'sans-serif']`
  - `index.css`: `@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap')` then Tailwind directives
  ```
  client/src/
    api/           axiosInstance.js, authApi.js, schemesApi.js, campaignsApi.js, donationsApi.js, adminApi.js
    components/    Navbar.jsx, Footer.jsx, SchemeCard.jsx, CampaignCard.jsx, LoadingSpinner.jsx, ReceiptDownload.jsx
    pages/         Home.jsx, SchemeFinder.jsx, SchemeDetail.jsx, DonationFlow.jsx, DonorAccount.jsx,
                   AdminDashboard.jsx, AdminSchemes.jsx, AdminCampaigns.jsx, AdminDonations.jsx, AdminLogs.jsx,
                   Login.jsx, Register.jsx, NotFound.jsx
    context/       AuthContext.jsx
    hooks/         useAuth.js, useSchemes.js
    utils/         validators.js, formatters.js, constants.js
    App.jsx        (router setup)
    main.jsx
  client/.env.example
  ```
  Files: `client/tailwind.config.js`, `client/postcss.config.js`, `client/index.css`, `client/src/App.jsx`, `client/src/main.jsx`, `client/.env.example`
  Verify: `cd client && npm run dev` opens on port 5173 with default Vite page rendering.

---

## Layer 1 — Database Models (server/src/models/)

Implement all models before any route. Each model file exports a Mongoose model. Money fields are always integers (paise). All Hindi-content fields are plain String with no ASCII-only validator.

- [ ] 4. **User model** — `server/src/models/User.js`
  Fields: `name` (String, required), `email` (String, required, unique, lowercase), `passwordHash` (String, required), `role` (enum: `donor|admin`, default `donor`), `pan` (String, validate regex `/^[A-Z]{5}[0-9]{4}[A-Z]$/`), `phone` (String), `address` (String), `createdAt` (Date, default now).
  Add instance method `comparePassword(plain)` → `bcryptjs.compare`.
  Add pre-save hook: hash password only when `passwordHash` is modified.
  **DPDP comment**: `// DPDP: PAN and address are personal data. Encrypt at rest in production. Retain only as long as required by law (80G = 7 years).`
  Verify: `node -e "require('./src/models/User')"` exits 0.

- [ ] 5. **Counter model** — `server/src/models/Counter.js`
  Fields: `_id` (String), `seq` (Number, default 0).
  Export helper `getNextReceiptNumber()` in `server/src/utils/receiptCounter.js` that calls:
  ```js
  Counter.findOneAndUpdate(
    { _id: 'receipt' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  ```
  Format as `RCP-${year}-${String(seq).padStart(6, '0')}`.
  This is the ONLY place receipt numbers are generated. Never use `count() + 1`.
  Verify: `node -e "require('./src/utils/receiptCounter')"` exits 0.

- [ ] 6. **Scheme model** — `server/src/models/Scheme.js`
  Fields:
  - `title_hi` (String, required), `title_en` (String, required)
  - `description_hi` (String), `description_en` (String)
  - `aiDraft_hi` (String) — mock AI-drafted Hindi summary
  - `aiDraftApproved` (Boolean, default false)
  - `need` (enum: `health|livelihood|pension|maternity`, required)
  - `state` (String, default `'Madhya Pradesh'`)
  - `districts` ([String])
  - `category` (String)
  - `eligibilityCriteria` ([{ field: String, operator: String, value: Mixed }])
  - `benefits` (String)
  - `documents` ([String])
  - `applicationProcess` (String)
  - `officialUrl` (String)
  - `lastCheckedAt` (Date)
  - `helpCentre` (String)
  - `status` (enum: `draft|published`, default `draft`)
  - `createdBy` (ObjectId ref Users)
  - `updatedAt` (Date, default now)
  Add index on `need`, `state`, `status` for search.
  Verify: model imports cleanly.

- [ ] 7. **Campaign model** — `server/src/models/Campaign.js`
  Fields: `title` (String, required), `description` (String), `targetAmount` (Number, integer paise), `raisedAmount` (Number, integer paise, default 0), `image` (String — Cloudinary URL), `status` (enum: `active|closed`, default `active`), `startDate` (Date), `endDate` (Date).
  Verify: model imports cleanly.

- [ ] 8. **Donation model** — `server/src/models/Donation.js`
  Fields: `donorId` (ObjectId ref Users, nullable for guest), `campaignId` (ObjectId ref Campaigns, required), `amount` (Number, integer paise, required), `paymentStatus` (enum: `pending|success|failed`, default `pending`), `paymentReference` (String), `razorpayOrderId` (String), `razorpayPaymentId` (String), `razorpaySignature` (String), `pan` (String), `donorName` (String), `donorEmail` (String), `donorPhone` (String), `donorAddress` (String), `receiptNumber` (String, unique, sparse), `receiptGeneratedAt` (Date), `isMonthly` (Boolean, default false), `createdAt` (Date, default now).
  **DPDP comment**: `// DPDP: PAN, email, phone are personal data — 80G requires 7-year retention.`
  Verify: model imports cleanly.

- [ ] 9. **Bookmark, Enquiry, AdminLog models** — `server/src/models/Bookmark.js`, `Enquiry.js`, `AdminLog.js`
  Bookmark: `userId` (ObjectId ref Users), `schemeId` (ObjectId ref Schemes), `createdAt`.
  Unique compound index on `{ userId, schemeId }`.
  Enquiry: `userId` (ObjectId ref Users, nullable), `schemeId` (ObjectId ref Schemes), `message` (String), `status` (enum: `open|closed`, default `open`), `createdAt`.
  AdminLog: `adminId` (ObjectId ref Users), `action` (String), `entityType` (String), `entityId` (String), `details` (Mixed), `timestamp` (Date, default now).
  Verify: all three import cleanly.

---

## Layer 2 — Backend API (server/src/)

Build routes in this order: auth → schemes → campaigns → donations → admin. Each controller follows the pattern `async (req, res, next) => { try { ... } catch (e) { next(e) } }`. All responses use `{ success: true, data: ... }` or `{ success: false, error: '...' }`.

- [ ] 10. **Server entry point and middleware** — `server/src/server.js`, `server/src/config/db.js`, `server/src/middleware/`
  `server.js`:
  - Load dotenv, connect MongoDB (`config/db.js`), mount CORS (origin from `CLIENT_URL` env), `express.json()`, rate limiters, routes, error handler.
  `config/db.js`:
  - `mongoose.connect(process.env.MONGODB_URI)` with `{ useNewUrlParser: true, useUnifiedTopology: true }`.
  `middleware/auth.js`:
  - `protect`: verify JWT (`Bearer` token), attach `req.user = { id, role }`.
  - `adminOnly`: check `req.user.role === 'admin'`, else 403 `{ success: false, error: 'Forbidden' }`.
  `middleware/rateLimiter.js`:
  - `authLimiter`: 10 requests / 15 min window on login route.
  - `schemesLimiter`: 100 requests / 1 min window on schemes search.
  `middleware/errorHandler.js`:
  - Express 4-arg error handler: log error, respond `{ success: false, error: err.message }` with status `err.status || 500`.
  Verify: `npm run dev` in server starts, connects to MongoDB Atlas or local Mongo, and `GET /` returns 404 JSON (not HTML).

- [ ] 11. **Auth routes + controller** — `server/src/routes/authRoutes.js`, `server/src/controllers/authController.js`
  `POST /api/auth/register`:
  - Joi validation: `name` required, `email` valid email, `password` min 8 chars with uppercase+number+special, `pan` optional (regex).
  - Hash password with `bcryptjs.hash(password, 12)`.
  - Save User. Return `{ token, user: { id, name, email, role } }`.
  `POST /api/auth/login`:
  - Apply `authLimiter`.
  - Find user by email, `comparePassword`, sign JWT (expires 7d).
  - Return same shape as register.
  `GET /api/auth/me`:
  - `protect` middleware, return `req.user` populated from DB.
  Verify: `curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.com","password":"Test@1234"}'` returns token.

- [ ] 12. **Eligibility engine** — `server/src/utils/eligibilityEngine.js`
  Export function `matchSchemes(answers, schemes)`:
  - `answers`: object with keys `maritalStatus` (`single|married|widowed|divorced`), `age` (number), `bplCard` (bool), `pregnant` (bool), `shmMember` (bool), `district` (string).
  - For each published scheme, evaluate `eligibilityCriteria` array. Each criterion: `{ field, operator, value }` where `operator` is one of `eq|gte|lte|includes|bool`.
  - A scheme matches if ALL criteria pass (AND logic).
  - Return array of matching scheme objects with added field `matchLabel: 'संभावित मिलान'`.
  - This is a pure function — no DB calls inside it.
  Verify: unit test with hardcoded answers and two scheme objects — one matching, one not.

- [ ] 13. **Schemes routes + controller** — `server/src/routes/schemeRoutes.js`, `server/src/controllers/schemeController.js`
  `GET /api/schemes`:
  - Apply `schemesLimiter`.
  - Query params: `q` (text search on title_hi, title_en, description_en), `need`, `district`, `state`, `category`, `type` (`central|state`).
  - Return only `status: 'published'` schemes.
  - Pagination: `page` (default 1), `limit` (default 12).
  `GET /api/schemes/:id`:
  - Return full scheme document (published only for public, any status for admin).
  `POST /api/schemes/:id/eligibility`:
  - Accept `{ answers }` in body.
  - Load all published schemes (or just schemes matching `need` filter if provided).
  - Call `matchSchemes(answers, schemes)`.
  - Return matching schemes array.
  `POST /api/schemes/:id/bookmark` (protect):
  - Upsert Bookmark `{ userId: req.user.id, schemeId: req.params.id }`.
  `GET /api/schemes/bookmarks` (protect):
  - Find all Bookmarks for `req.user.id`, populate schemeId.
  Note: mount `/api/schemes/bookmarks` BEFORE `/api/schemes/:id` to avoid route shadowing.
  Verify: `GET /api/schemes` returns array; `POST /api/schemes/any-id/eligibility` with empty answers returns empty array (no crash).

- [ ] 14. **Campaigns routes + controller** — `server/src/routes/campaignRoutes.js`, `server/src/controllers/campaignController.js`
  `GET /api/campaigns`: return all `status: 'active'` campaigns.
  `GET /api/campaigns/:id`: return single campaign.
  Verify: returns empty array without crashing when no campaigns exist.

- [ ] 15. **PDF generator** — `server/src/utils/pdfGenerator.js`
  Use `pdfkit`. Export `generateReceiptPDF(donation, campaign)` → returns a `Buffer`.
  Required fields (fail with Error if any missing): `TRUST_NAME`, `TRUST_PAN`, `TRUST_80G_REG` from env, `donation.donorName`, `donation.pan`, `donation.amount` (paise → `₹${(amount/100).toFixed(2)}`), `donation.createdAt`, `donation.receiptNumber`, `campaign.title`.
  PDF layout:
  1. Header: Trust name, address, PAN, 80G registration number.
  2. Receipt number + date.
  3. Donor name + PAN.
  4. Amount in numerals and words (use a helper `amountToWords(paise)` that converts to rupees then to Hindi-aware English words).
  5. Campaign name.
  6. Footer: "This is a TEST/SANDBOX transaction. Not valid for actual tax purposes until verified."
  Note the `amountToWords` helper is English-only; full Hindi numeral conversion is out of scope.
  Verify: `node -e "const g = require('./src/utils/pdfGenerator'); g({ donorName:'A', pan:'ABCDE1234F', amount:50000, createdAt:new Date(), receiptNumber:'RCP-2026-000001' }, { title:'Test' }).then(b => console.log(b.length > 0))"` prints `true`.

- [ ] 16. **Donations routes + controller** — `server/src/routes/donationRoutes.js`, `server/src/controllers/donationController.js`
  `POST /api/donations/create-order`:
  - Validate body: `campaignId` (ObjectId), `amount` (integer paise, min 50000 = ₹500), `donorName`, `donorEmail`, `donorPhone`, `pan` (validate regex), `isMonthly` (bool), `address`.
  - DPDP privacy notice: include `acceptedPrivacyPolicy: true` in body — reject 400 if missing.
  - Create Razorpay order: `razorpay.orders.create({ amount, currency: 'INR', receipt: campaignId })`.
  - Save Donation with `paymentStatus: 'pending'`, `razorpayOrderId`.
  - Return `{ orderId, amount, currency, razorpayKeyId: process.env.RAZORPAY_KEY_ID }`.
  `POST /api/donations/verify`:
  - Receive `{ razorpayOrderId, razorpayPaymentId, razorpaySignature, donationId }`.
  - **Signature verification (backend only)**:
    ```js
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');
    if (expectedSig !== razorpaySignature) throw { status: 400, message: 'Invalid signature' };
    ```
  - On valid: generate receipt number via `getNextReceiptNumber()`, generate PDF via `generateReceiptPDF()`.
  - Update Donation: `paymentStatus: 'success'`, `razorpayPaymentId`, `razorpaySignature`, `paymentReference`, `receiptNumber`, `receiptGeneratedAt: new Date()`.
  - Update Campaign: `$inc: { raisedAmount: donation.amount }`.
  - Send mock email (nodemailer using ethereal.email in dev — log preview URL to console).
  - **Foreign card detection**: If Razorpay payment fetch returns `international: true`, reject with 400 and message `{ message_hi: 'विदेशी कार्ड स्वीकार नहीं किए जाते।', message_en: 'Foreign cards are not accepted.' }`.
  - Return `{ success: true, receiptNumber, donationId }`.
  `GET /api/donations/my` (protect):
  - Return donations where `donorId === req.user.id`, sorted newest first.
  `GET /api/donations/:id/receipt` (protect):
  - Confirm `donorId === req.user.id` OR `req.user.role === 'admin'`.
  - Re-generate PDF and stream as `application/pdf` with header `Content-Disposition: attachment; filename="receipt-${receiptNumber}.pdf"`.
  Verify: full flow testable with Razorpay test keys after seed data loaded.

- [ ] 17. **Admin routes + controller** — `server/src/routes/adminRoutes.js`, `server/src/controllers/adminController.js`
  All routes: `protect` + `adminOnly` middleware.
  Helper: export `logAdminAction(adminId, action, entityType, entityId, details)` that saves an AdminLog document. Call it inside every mutating admin action.
  `GET /api/admin/dashboard`:
  - Aggregate: total donations count, total successful amount (sum paise → convert to ₹ in response), count by campaign, unique donor count, scheme count by status.
  `GET /api/admin/schemes` — list all (any status), paginated.
  `POST /api/admin/schemes` — create scheme; mock AI draft: set `aiDraft_hi` to hardcoded string `"यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।"`, `aiDraftApproved: false`.
  `PUT /api/admin/schemes/:id` — update; log action.
  `DELETE /api/admin/schemes/:id` — soft-delete by setting `status: 'draft'`; log action.
  `POST /api/admin/schemes/:id/approve-draft` — set `aiDraftApproved: true`; log action.
  `GET /api/admin/campaigns` — list all campaigns.
  `POST /api/admin/campaigns` — create; multer + cloudinary for image upload (field name `image`).
  `PUT /api/admin/campaigns/:id` — update.
  `GET /api/admin/donations` — list all donations, supports filters: `?campaignId=`, `?status=`, `?from=` (date), `?to=` (date). Paginated.
  `GET /api/admin/donations/export-csv`:
  - Stream CSV with headers: `Receipt No,Date,Donor Name,Email,Phone,PAN,Campaign,Amount (INR),Status,Monthly`.
  - Use `res.setHeader('Content-Type', 'text/csv')`, `Content-Disposition: attachment; filename="donations.csv"`.
  - Never load all records into memory — use Mongoose cursor: `.cursor()` and pipe rows.
  `GET /api/admin/donations/form10bd`:
  - Stream CSV with EXACT headers: `Sl. No.,Name of Donor,Address,PAN/Aadhaar,Amount,Mode of Receipt,Nature of Receipt,Date`.
  - Values: Mode = `Online`, Nature = `Others`, Amount in rupees (paise / 100).
  `GET /api/admin/logs` — paginated AdminLog, newest first.
  Verify: `GET /api/admin/dashboard` with admin JWT returns stats object; `GET /api/admin/dashboard` with donor JWT returns 403.

- [ ] 18. **Multer + Cloudinary upload middleware** — `server/src/middleware/upload.js`
  Configure multer with `memoryStorage()`.
  Export `uploadToCloudinary(buffer, folder)` that calls `cloudinary.uploader.upload_stream(...)` and returns the secure URL.
  Used by admin campaign creation.
  Verify: imports cleanly; cloudinary config reads from env.

- [ ] 19. **Email service (mock)** — `server/src/utils/emailService.js`
  Export `sendDonationConfirmation({ to, donorName, receiptNumber, amount, campaignName, pdfBuffer })`.
  In development: create Ethereal test account via `nodemailer.createTestAccount()`, send mail, log `nodemailer.getTestMessageUrl(info)` to console.
  In production: swap transport to real SMTP via env vars `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`.
  Never throw — wrap in try/catch and log errors; do not fail the donation flow if email fails.
  Verify: importing the module does not crash; dev mode logs ethereal URL on invocation.

---

## Layer 3 — Frontend Pages and Components

Build in this order: shared infrastructure → auth → public pages → donor account → admin.

- [ ] 20. **Axios instance + API helpers** — `client/src/api/`
  `axiosInstance.js`: `axios.create({ baseURL: import.meta.env.VITE_API_URL })`.
  Add request interceptor: attach `Authorization: Bearer <token>` from localStorage.
  Add response interceptor: on 401, clear token and redirect to `/login`.
  `authApi.js`: `register(data)`, `login(data)`, `getMe()`.
  `schemesApi.js`: `getSchemes(params)`, `getSchemeById(id)`, `checkEligibility(answers)`, `bookmarkScheme(id)`, `getBookmarks()`.
  `campaignsApi.js`: `getCampaigns()`, `getCampaignById(id)`.
  `donationsApi.js`: `createOrder(data)`, `verifyPayment(data)`, `getMyDonations()`, `getReceipt(id)`.
  `adminApi.js`: all admin endpoint wrappers.
  Verify: `npm run build` in client succeeds.

- [ ] 21. **Auth context + protected routes** — `client/src/context/AuthContext.jsx`, `client/src/App.jsx`
  `AuthContext`: state `{ user, token, loading }`. Methods: `login(token, user)` (save to localStorage), `logout()`, `isAdmin()`.
  `ProtectedRoute` component: redirect to `/login` if not authenticated.
  `AdminRoute` component: redirect to `/` if `role !== 'admin'`.
  `App.jsx` router setup:
  ```
  /                    → Home
  /schemes             → SchemeFinder
  /schemes/:id         → SchemeDetail
  /donate/:campaignId  → DonationFlow
  /account             → DonorAccount (ProtectedRoute)
  /login               → Login
  /register            → Register
  /admin               → AdminDashboard (AdminRoute)
  /admin/schemes       → AdminSchemes (AdminRoute)
  /admin/campaigns     → AdminCampaigns (AdminRoute)
  /admin/donations     → AdminDonations (AdminRoute)
  /admin/logs          → AdminLogs (AdminRoute)
  *                    → NotFound
  ```
  Verify: `npm run build` passes; routes render correct page components.

- [ ] 22. **Navbar and Footer components** — `client/src/components/Navbar.jsx`, `Footer.jsx`
  `Navbar`:
  - NGO logo (SVG inline — a stylised lotus + "EmpowerHer" text in saffron `#F5A623`).
  - Links: योजनाएं (Schemes), दान करें (Donate), अपना खाता (Account) — Hindi with English below in smaller text.
  - Language toggle button `HI | EN` that switches i18n context (use simple React state with a `LanguageContext`; no i18n library).
  - Login/Logout button.
  - WCAG: `role="navigation"`, `aria-label="Main navigation"`, all links keyboard-focusable.
  `Footer`:
  - NGO name, Bhopal address (fictional), helpline number.
  - Links to Privacy Policy (`/privacy`) and Terms (`/terms`) — static placeholder pages.
  - Copyright notice.
  Verify: renders on all pages; no console errors.

- [ ] 23. **Homepage** — `client/src/pages/Home.jsx`
  Sections in order (no long scroll before schemes finder):
  1. **Navbar** (fixed top).
  2. **Hero strip** (max 120px tall) — tagline "महिलाओं के लिए योजनाएं खोजें | Find support. Build your future." Saffron gradient background. SVG illustration (women's silhouette in green). No stock photos.
  3. **Schemes Finder panel** — ABOVE THE FOLD at 768px+ viewport. Contains the quick-filter UI: four need cards (स्वास्थ्य, आजीविका, पेंशन, मातृत्व) with icons + a district dropdown (9 MP districts: Bhopal, Indore, Jabalpur, Gwalior, Ujjain, Sagar, Rewa, Satna, Chhindwara) + "खोजें" (Search) button. Clicking navigates to `/schemes?need=health&district=Bhopal`.
  4. **Featured Schemes** — 3 published scheme cards (`SchemeCard` component), fetched from `GET /api/schemes?limit=3`.
  5. **Donation Campaigns** — active campaign cards (`CampaignCard` component), fetched from `GET /api/campaigns`.
  6. **Impact Statistics** — hardcoded: 50,000 finder uses, ₹6 crore raised, 12,000 women helped, 3 schemes added this month. Animated counter using `useEffect` + `setInterval`.
  7. **Testimonials** — 2 hardcoded testimonial cards (fake names, no real photos — use initial avatars).
  8. **Footer**.
  WCAG: hero `role="banner"`, statistics section `aria-live="polite"`, all images have `alt` text.
  Verify: `npm run dev` in client; homepage loads; schemes finder is visible without scrolling on 768px viewport (check in browser DevTools).

- [ ] 24. **SchemeCard and CampaignCard components** — `client/src/components/SchemeCard.jsx`, `CampaignCard.jsx`
  `SchemeCard`: props `{ scheme, lang }`. Show `title_hi` or `title_en` based on lang. Show `need` badge (colour-coded: health=green, livelihood=blue, pension=orange, maternity=pink). Show `lastCheckedAt` as "Last verified: DD-MM-YYYY". Show "Source: [officialUrl]". "View Details" link to `/schemes/:id`. If `status === 'draft'`, show draft badge (admin view only).
  `CampaignCard`: props `{ campaign }`. Show title, description (truncated 120 chars), progress bar (`raisedAmount / targetAmount`), raised amount in ₹, "Donate Now" button → `/donate/:id`.
  Progress bar: `aria-valuenow`, `aria-valuemin`, `aria-valuemax` for WCAG.
  Verify: renders without prop errors in isolation.

- [ ] 25. **SchemeFinder page** — `client/src/pages/SchemeFinder.jsx`
  Left panel — filter sidebar:
  - Keyword search input (Hindi/English).
  - Need filter (checkboxes: health, livelihood, pension, maternity) with Hindi labels.
  - District dropdown (9 MP districts).
  - Scheme type (Central / State).
  - **Eligibility questionnaire** (collapsible) — 5 questions:
    1. वैवाहिक स्थिति (Marital status): single|married|widowed|divorced
    2. आयु (Age): number input
    3. BPL कार्ड (BPL card): yes|no
    4. गर्भावस्था (Pregnant): yes|no
    5. SHG सदस्यता (SHG member): yes|no
    6. जिला (District): dropdown
  - "पात्रता जाँचें" (Check Eligibility) button → `POST /api/schemes/eligibility` (note: use `/api/schemes` endpoint, not `/:id/eligibility`, for bulk match).
    **Note**: The plan calls for a general eligibility endpoint. Implement it as `POST /api/schemes/eligibility` (no `:id`) that loads all published schemes and calls the eligibility engine.
  Right panel — results grid:
  - `SchemeCard` for each result.
  - "संभावित मिलान" badge on eligibility-matched results.
  - Empty state: "कोई योजना नहीं मिली" with suggestion to adjust filters.
  - Pagination (page numbers).
  - "Helpline Call-back" button (opens modal with phone number form — no actual call integration needed; store as Enquiry via POST /api/enquiries).
  Language toggle carries from Navbar context.
  Verify: `/schemes?need=health` pre-selects health filter and shows results.

- [ ] 26. **SchemeDetail page** — `client/src/pages/SchemeDetail.jsx`
  Fetch `GET /api/schemes/:id`.
  Sections:
  - Title in Hindi + English.
  - If `aiDraftApproved === false` and `aiDraft_hi` exists: yellow banner "AI Draft - समीक्षा करें | AI Draft - Pending Review" above description.
  - Description (Hindi and English tabs).
  - Benefits, Documents required, Application process.
  - Help centre address.
  - Official source link (opens new tab, `rel="noopener noreferrer"`).
  - Last verified date: "Last checked: DD-MM-YYYY".
  - Save / Unsave button (calls bookmark API; shows login prompt if not authenticated).
  - Back to search link.
  WCAG: `<main>` landmark, all sections have headings.
  Verify: navigating to `/schemes/:validId` shows all fields.

- [ ] 27. **DonationFlow page** — `client/src/pages/DonationFlow.jsx`
  Three-step wizard; step indicator at top showing Step 1 / 2 / 3.
  **Step 1 — Select Campaign + Amount**:
  - If arriving from `/donate/:campaignId`, pre-select that campaign. Otherwise show dropdown.
  - Amount selector: ₹500, ₹1,000, ₹2,000, ₹5,000 buttons + custom input (min ₹500).
  - One-time vs Monthly toggle.
  - Continue button.
  **Step 2 — Donor Details** (React Hook Form + Zod):
  - Fields: Full Name (required), Email (valid email), Phone (10-digit), PAN (regex `^[A-Z]{5}[0-9]{4}[A-Z]$` — show format hint "AAAAA0000A"), Address (required).
  - Privacy notice: "आपका PAN और व्यक्तिगत डेटा केवल 80G रसीद के लिए उपयोग किया जाएगा। DPDP Act 2023 के अनुसार।" (English below).
  - Checkbox: "I have read the privacy notice" (required).
  - If user is logged in, pre-fill from user profile.
  - Continue button → calls `POST /api/donations/create-order`.
  **Step 3 — Payment**:
  - Show "🔴 TEST MODE — परीक्षण लेनदेन" banner.
  - Load Razorpay checkout script dynamically: `https://checkout.razorpay.com/v1/checkout.js`.
  - Open Razorpay modal with: `key`, `amount`, `order_id`, `name: 'EmpowerHer'`, `description`, `prefill: { name, email, contact }`, `theme: { color: '#F5A623' }`.
  - On payment success: call `POST /api/donations/verify`, show success screen with receipt number + Download Receipt button.
  - On payment failure/dismiss: show error state with retry option.
  - Foreign card block: if server returns foreign card error, show modal in Hindi: "विदेशी कार्ड स्वीकार नहीं किए जाते। कृपया भारतीय कार्ड या UPI का उपयोग करें।"
  - `ReceiptDownload` component: calls `GET /api/donations/:id/receipt` and triggers browser download.
  WCAG: form fields have explicit `<label>` elements, error messages linked via `aria-describedby`.
  Verify: full 3-step flow completes in browser; receipt download works.

- [ ] 28. **DonorAccount page** — `client/src/pages/DonorAccount.jsx`
  Protected route. Sections:
  - **Profile** — name, email, phone, PAN (masked: first 5 + last 1 visible, middle masked `AAAAA****A`).
  - **My Donations** — table: Date, Campaign, Amount, Status, Receipt. Download button calls receipt API.
  - **Saved Schemes** — grid of bookmarked SchemeCards.
  Tabs using accessible tab panel (`role="tablist"`, `role="tab"`, `aria-selected`).
  Verify: `/account` shows correct user data after login.

- [ ] 29. **Admin Dashboard** — `client/src/pages/AdminDashboard.jsx`
  Protected (admin). Fetch `GET /api/admin/dashboard`.
  Stat cards: Total Donations, Total Amount Raised (₹), Active Campaigns, Published Schemes.
  Bar chart placeholder (use SVG bar chart — no chart library): campaign-wise raised amount.
  Quick links to `/admin/schemes`, `/admin/campaigns`, `/admin/donations`, `/admin/logs`.
  Verify: loads with correct stats after seed data.

- [ ] 30. **Admin Schemes CMS** — `client/src/pages/AdminSchemes.jsx`
  Features:
  - Paginated table of all schemes (all statuses).
  - Create / Edit modal form with all Scheme fields in Hindi + English (React Hook Form).
  - Hindi text fields: `title_hi`, `description_hi`, `aiDraft_hi` — all use `font-devanagari` class.
  - `lastCheckedAt` date picker.
  - Eligibility criteria builder: add rows of `{ field, operator, value }`.
  - On create: server returns scheme with `aiDraftApproved: false` and `aiDraft_hi` set. Admin sees AI draft in read-only text area with yellow "AI Draft - समीक्षा करें" badge.
  - "Approve AI Draft" button → `POST /api/admin/schemes/:id/approve-draft` → badge changes to green "Approved".
  - Publish/Draft toggle.
  - Delete button (confirms before calling DELETE).
  Verify: create a scheme, see AI draft badge, approve draft, publish.

- [ ] 31. **Admin Campaigns** — `client/src/pages/AdminCampaigns.jsx`
  Create/Edit campaigns. Image upload field (sends multipart/form-data). Target amount in rupees (UI converts to paise before sending). Preview uploaded image. Active / Closed toggle.
  Verify: create a campaign with image, see it on homepage.

- [ ] 32. **Admin Donations Report** — `client/src/pages/AdminDonations.jsx`
  Filterable table: date range picker, campaign dropdown, status dropdown.
  Pagination.
  "Export CSV" button → downloads file from `GET /api/admin/donations/export-csv`.
  "Export Form 10BD" button → downloads file from `GET /api/admin/donations/form10bd`.
  View individual receipt (opens in new tab).
  Verify: CSV download contains correct headers; Form 10BD download contains exact required columns.

- [ ] 33. **Admin Activity Log** — `client/src/pages/AdminLogs.jsx`
  Read-only paginated table: Timestamp, Admin, Action, Entity Type, Entity ID, Details (JSON pretty-printed in a `<pre>`).
  Verify: creating a scheme from AdminSchemes creates a log entry visible here.

---

## Layer 4 — Integration and End-to-End Wiring

- [ ] 34. **Enquiry API route** — `server/src/routes/enquiryRoutes.js`
  `POST /api/enquiries`:
  - Body: `{ schemeId, message, userId? }`.
  - Save Enquiry document.
  - No auth required (anonymous allowed).
  Mount in `server.js`.
  Verify: POST returns saved enquiry ID.

- [ ] 35. **Language toggle wiring** — `client/src/context/LanguageContext.jsx`
  Simple `createContext` with `lang` state (`hi|en`), `toggleLang()`, and default `hi`.
  Wrap `App.jsx` in `<LanguageProvider>`.
  All `SchemeCard`, `SchemeFinder`, `SchemeDetail` already receive `lang` prop from context — confirm all pages pass it down.
  Verify: clicking HI|EN toggle on Navbar switches scheme titles between Hindi and English everywhere.

- [ ] 36. **Noto Sans Devanagari + WCAG audit** — `client/src/index.css`, all page components
  Confirm font loads from Google Fonts in `index.css`.
  Add `font-family: 'Noto Sans Devanagari', sans-serif` to `body` in CSS.
  Set `body { font-size: 16px; }`, Hindi headings `font-size: 20px+`.
  Audit all interactive elements for:
  - Color contrast ≥ 4.5:1 (saffron `#F5A623` on white fails; use `#C47F00` for text on white backgrounds — saffron only for decorative backgrounds).
  - `aria-label` on icon-only buttons.
  - Focus ring visible (Tailwind `focus:ring-2 focus:ring-secondary`).
  - All form inputs have `<label>` with `htmlFor`.
  Verify: run `npm run build` — no warnings about missing alt text; manually confirm focus rings visible in browser.

- [ ] 37. **Mobile responsiveness** — all page components
  Ensure all pages work at 320px width:
  - Navbar collapses to hamburger menu (SVG icon) on < 640px.
  - Homepage scheme finder panel stacks vertically.
  - Admin table wraps into cards on mobile (add `overflow-x-auto` wrapper on all tables).
  - DonationFlow wizard is single-column on mobile.
  Use Tailwind responsive prefixes (`sm:`, `md:`) throughout.
  Verify: Chrome DevTools 320px viewport — all pages render without horizontal scroll.

---

## Layer 5 — Seed Data

- [ ] 38. **Seed script** — `server/src/seed.js`
  Run `node src/seed.js` to populate the database. Script is idempotent (uses `findOneAndUpdate` with `upsert: true` keyed on email/title).
  Seed the following:
  
  **Users**:
  - Admin: `{ name: 'Admin User', email: 'admin@empowerher.org', password: 'Admin@123', role: 'admin' }` — hash password before save.
  - Donor: `{ name: 'Test Donor', email: 'donor@test.com', password: 'Donor@123', role: 'donor' }`.
  
  **Schemes**:
  - SCH-014 Widow Pension:
    ```
    title_hi: 'विधवा पेंशन योजना',
    title_en: 'Widow Pension Scheme',
    description_hi: 'मध्यप्रदेश सरकार की विधवा पेंशन योजना के अंतर्गत पात्र महिलाओं को ₹600 प्रति माह की आर्थिक सहायता दी जाती है।',
    description_en: 'Financial assistance of ₹600/month for eligible widows under MP state scheme.',
    aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।',
    aiDraftApproved: false,
    need: 'pension',
    state: 'Madhya Pradesh',
    districts: ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa','Satna','Chhindwara'],
    eligibilityCriteria: [
      { field: 'maritalStatus', operator: 'eq', value: 'widowed' },
      { field: 'age', operator: 'gte', value: 18 },
      { field: 'age', operator: 'lte', value: 79 },
      { field: 'bplCard', operator: 'bool', value: true }
    ],
    benefits: '₹600 per month direct bank transfer',
    documents: ['Widow certificate', 'BPL card', 'Aadhaar card', 'Bank passbook'],
    applicationProcess: 'Apply at Janpad Panchayat office or online at mpedistrict.gov.in',
    officialUrl: 'https://mpedistrict.gov.in',
    lastCheckedAt: new Date('2026-09-12'),
    helpCentre: 'Janpad Panchayat Office, District Headquarters',
    status: 'published'
    ```
  - SCH-022 SHG Loan Support:
    ```
    title_hi: 'SHG ऋण सहायता योजना',
    title_en: 'SHG Loan Support Scheme',
    description_hi: 'स्व-सहायता समूह की सदस्य महिलाओं को ₹3 लाख तक का सब्सिडी ऋण।',
    description_en: 'Subsidised loan up to ₹3 lakh for SHG member women.',
    aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।',
    aiDraftApproved: false,
    need: 'livelihood',
    districts: ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa','Satna','Chhindwara'],
    eligibilityCriteria: [
      { field: 'shmMember', operator: 'bool', value: true }
    ],
    benefits: 'Subsidised loan up to ₹3,00,000',
    documents: ['SHG membership certificate', 'Aadhaar card', 'Bank passbook'],
    applicationProcess: 'Apply through SHG group leader to Block Development Officer',
    officialUrl: 'https://mpshg.mp.gov.in',
    lastCheckedAt: new Date('2026-08-30'),
    helpCentre: 'Block Development Office',
    status: 'published'
    ```
  - SCH-031 Maternity Cash Benefit:
    ```
    title_hi: 'मातृत्व नकद लाभ योजना',
    title_en: 'Maternity Cash Benefit Scheme',
    description_hi: 'पहले जीवित बच्चे के जन्म पर गर्भवती महिलाओं को ₹5,000 की एकमुश्त सहायता।',
    description_en: '₹5,000 one-time cash benefit for pregnant women on first live birth.',
    aiDraft_hi: 'यह एक AI-निर्मित मसौदा है। कृपया समीक्षा करें और अनुमोदित करें।',
    aiDraftApproved: false,
    need: 'maternity',
    districts: ['Bhopal','Indore','Jabalpur','Gwalior','Ujjain','Sagar','Rewa','Satna','Chhindwara'],
    eligibilityCriteria: [
      { field: 'pregnant', operator: 'bool', value: true }
    ],
    benefits: '₹5,000 one-time payment to bank account',
    documents: ['Pregnancy registration card', 'Aadhaar card', 'Bank passbook'],
    applicationProcess: 'Register at nearest Anganwadi centre or Health Sub-Centre',
    officialUrl: 'https://pmmvy.nic.in',
    lastCheckedAt: new Date('2026-10-05'),
    helpCentre: 'Anganwadi Centre / Health Sub-Centre',
    status: 'published'
    ```
  
  **Campaigns**:
  - `{ title: 'वार्षिक स्वास्थ्य शिविर 2026', description: 'Annual health camp for women in rural MP', targetAmount: 50000000, raisedAmount: 18500000, status: 'active' }`
  - `{ title: 'बालिका शिक्षा अभियान', description: 'Education support for girls in 9 districts', targetAmount: 30000000, raisedAmount: 9200000, status: 'active' }`
  
  Log "Seed complete" on success.
  Verify: `node src/seed.js` then `node -e "const mongoose = require('mongoose'); const User = require('./src/models/User'); mongoose.connect(process.env.MONGODB_URI).then(async () => { console.log(await User.countDocuments()); process.exit(); })"` prints 2.

---

## Layer 6 — Documentation and Final Wiring

- [ ] 39. **Environment variable files** — `server/.env.example`, `client/.env.example`
  `server/.env.example`:
  ```
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/empowerher
  JWT_SECRET=your-jwt-secret-here
  RAZORPAY_KEY_ID=rzp_test_xxxx
  RAZORPAY_KEY_SECRET=your-razorpay-test-secret
  TRUST_PAN=AABCT1234M
  TRUST_80G_REG=AABCT1234MF20201
  TRUST_NAME=EmpowerHer Charitable Trust, Bhopal
  CLIENT_URL=http://localhost:5173
  CLOUDINARY_CLOUD_NAME=your-cloud-name
  CLOUDINARY_API_KEY=your-api-key
  CLOUDINARY_API_SECRET=your-api-secret
  EMAIL_HOST=smtp.ethereal.email
  EMAIL_USER=
  EMAIL_PASS=
  ```
  `client/.env.example`:
  ```
  VITE_API_URL=http://localhost:5000
  VITE_RAZORPAY_KEY_ID=rzp_test_xxxx
  ```
  Verify: both files committed; actual `.env` files are in `.gitignore`.

- [ ] 40. **README.md** — project root
  Sections:
  1. Project overview (2 sentences).
  2. Tech stack.
  3. Setup instructions:
     - Prerequisites: Node 20+, MongoDB running locally or Atlas URI.
     - Clone + `npm run install:all`.
     - Copy `.env.example` to `.env` in both `server/` and `client/`.
     - Fill in Razorpay test keys, MongoDB URI, JWT secret.
     - `npm run dev` from project root.
  4. Test credentials:
     - Admin: `admin@empowerher.org` / `Admin@123`
     - Donor: `donor@test.com` / `Donor@123`
  5. Razorpay test cards:
     - Success: Card 4111 1111 1111 1111, any future expiry, CVV 123.
     - Failure: Card 4000 0000 0000 0002.
  6. Seeding: `cd server && npm run seed`.
  7. Known limitations:
     - AI Hindi draft is mocked — returns a hardcoded paragraph, not a real OpenAI call.
     - All payments are Razorpay test mode — no real money moves.
     - Email is Ethereal in dev — check console for preview URL.
     - Cloudinary: image upload requires real Cloudinary keys.
     - Foreign card blocking: detection is best-effort based on Razorpay's `international` flag.
     - WCAG 2.1 AA: contrast and keyboard navigation implemented; full certification requires manual testing with assistive technologies.
     - 80G receipts are for demonstration only and are not legally valid.
  Verify: file renders correctly in GitHub/VS Code markdown preview.

- [ ] 41. **Final integration smoke test checklist**
  After all layers are implemented, verify all items in this checklist pass:
  - [ ] `npm run dev` from project root starts both servers without errors.
  - [ ] Homepage renders at `http://localhost:5173` with Hindi text and schemes section visible without scrolling on 768px viewport.
  - [ ] `POST /api/schemes/eligibility` with `{ answers: { maritalStatus: 'widowed', age: 45, bplCard: true, pregnant: false, shmMember: false, district: 'Bhopal' } }` returns SCH-014.
  - [ ] `/schemes/SCH-014-id` shows all fields including official source link and last-checked date "12-09-2026".
  - [ ] Full donation flow: select campaign → enter donor details with valid PAN → Razorpay test payment → success screen → Download Receipt PDF (verify PDF contains receipt number, trust PAN, donor PAN).
  - [ ] Receipt numbers are sequential (no gaps, no collisions on rapid concurrent requests).
  - [ ] Admin login → create scheme → see AI draft badge → approve draft → publish.
  - [ ] Admin donation report → Export CSV → verify headers: `Receipt No,Date,Donor Name,Email,Phone,PAN,Campaign,Amount (INR),Status,Monthly`.
  - [ ] Admin donation report → Export Form 10BD → verify headers: `Sl. No.,Name of Donor,Address,PAN/Aadhaar,Amount,Mode of Receipt,Nature of Receipt,Date`.
  - [ ] `GET /api/admin/dashboard` with donor JWT returns HTTP 403.
  - [ ] `cd server && npm run seed` completes without error on a clean database.
  - [ ] Both `.env.example` files exist.
  - [ ] README.md contains setup, test credentials, and known limitations.

---

## Appendix: Cross-Cutting Constraints (apply throughout all layers)

1. **Money**: Always store in integer paise. Convert to ₹ only at display time: `(paise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })`.
2. **Receipt counter**: Only `getNextReceiptNumber()` may generate receipt numbers. No `count() + 1` anywhere.
3. **Razorpay signature**: Verified only in `donationController.js` on the server. The frontend never trusts its own payment success — it must wait for server verification response.
4. **DPDP comments**: Every model and controller that stores PAN, phone, or email has a `// DPDP:` comment explaining the legal basis for retention.
5. **Hindi text fields**: Never add `.trim().toUpperCase()` or ASCII-only validators to `title_hi`, `description_hi`, or any `_hi` field.
6. **AI draft label**: `aiDraftApproved === false` must always show "AI Draft - समीक्षा करें" banner, both in admin CMS and in public scheme detail. Hide the label once approved.
7. **TEST MODE label**: The Razorpay payment step always shows the red "🔴 TEST MODE" banner. The 80G PDF always includes the "TEST/SANDBOX" footer. These are not optional and must not be gated on an env flag.
8. **Error responses**: All API routes return `{ success: false, error: '<message>' }`. Never return `{ message: ... }` — keep the shape consistent so the frontend interceptor works uniformly.
9. **Route ordering in Express**: Mount `/api/schemes/bookmarks` and `/api/schemes/eligibility` BEFORE `/api/schemes/:id` in `schemeRoutes.js` to avoid Express matching `bookmarks` or `eligibility` as an `:id` parameter.
10. **Cloudinary optional in dev**: If `CLOUDINARY_*` env vars are absent, campaign image upload should fall back to storing the filename locally (in `server/uploads/`) and serving it via `express.static`. Do not crash if Cloudinary is not configured.
