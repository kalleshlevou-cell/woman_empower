# Implementation Plan — EmpowerHer 8 Enhancements

**Project:** EmpowerHer NGO Platform (MERN)  
**Frontend root:** `client/src/`  
**Backend root:** `server/src/`  
**Build verify command:** `cd client && npm run build` (must exit 0)

---

## Codebase Findings (grounding every decision)

- **App.jsx** wraps everything in `<BrowserRouter><AuthProvider><LanguageProvider>`. `ToastProvider` must go inside `LanguageProvider` or alongside it — wrapping `<App>` in `main.jsx` is the cleanest seam since `App` renders `BrowserRouter`.
- **LanguageContext.jsx** exposes `{ lang, toggleLang }`. The `t(en, hi)` pattern is `const t = (en, hi) => lang === 'hi' ? hi : en` — used consistently in every page. New components must follow this same pattern.
- **No existing Toast** — zero `alert(...)` calls in admin pages (they use inline `setError` state already), but `DonationFlow.jsx` line `onStep2Submit` has `alert(err.response?.data?.error || 'Order creation failed…')`. Login.jsx and Register.jsx use inline `serverError` state divs, not `alert()`. So the only true `alert()` to replace is in `DonationFlow.jsx`. All other "replace alert" targets need toast-based *addition* for success events, not replacement of existing alerts.
- **LoadingSpinner** is a simple SVG spinner. All usages to be skeleton-replaced are in `Home.jsx` (two: `loadingSchemes` and `loadingCampaigns`) and `SchemeFinder.jsx` (one: `loading` in the results panel).
- **AdminDashboard.jsx** uses `grid-cols-2 lg:grid-cols-4` with 4 cards. Expanding to 6 cards needs `grid-cols-2 lg:grid-cols-3`.
- **adminController.js `getDashboard`**: already returns `uniqueDonors: uniqueDonorCount.length` (correct — the `.distinct()` returns an array, `.length` is already applied). It does NOT return `successfulDonationsCount`. Need to add a `countDocuments({ paymentStatus: 'success' })` to the `Promise.all` and expose it.
- **emailService.js**: `sendDonationConfirmation` is `async` but returns nothing (implicit `undefined`). `previewUrl` is computed as `nodemailer.getTestMessageUrl(info)` but never returned. Must change to return `previewUrl || null` from the function.
- **donationController.js `verifyPayment`**: calls `sendDonationConfirmation(...)` without `await` and without capturing the return value (fire-and-forget). Must `await` it and capture the `previewUrl`, then include it in the response.
- **ReceiptDownload.jsx**: single button, fetches PDF blob via `getReceipt(donationId)`, creates object URL, triggers download. Print button needs to do the same fetch but call `window.open(url)` instead of creating an `<a>` element.
- **CampaignCard.jsx**: has no badge logic, no status-closed guard on the Donate button. `campaign.endDate` and `campaign.status` are available (AdminCampaigns modal sets both).
- **NotFound.jsx**: minimal — just a `404` text, one sentence, one link. Full rewrite is safe.
- **Home.jsx hero**: the hero `<header>` contains a tagline and subtitle in a flex row. The hero search bar must be inserted as a new row below the tagline `<div>`. The quick-filter pills below it replicate the NEEDS constant already defined in the same file, so they share that constant directly.
- **SchemeFinder.jsx** already accepts `?q=` (maps to `params.q`) and `?need=` (maps to `params.need`) from `useSearchParams` + `useEffect`. Hero search using `navigate('/schemes?q=...')` will work without any SchemeFinder changes.
- **Build system:** Vite + React 19 + Tailwind 3.4. `npm run build` in `client/` is the verification command. No test runner is configured — verification is build success + visual inspection notes.

---

## Implementation Plan

- [ ] 1. **Create `client/src/components/Toast.jsx` — Toast provider + hook**

  Implement a self-contained context-based toast system. Use `useState` to hold a list of `{ id, type, message }` objects. `ToastProvider` renders a fixed `div` at `top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none` containing all toasts, plus a `ToastContext.Provider`. Each toast is a `div` with `pointer-events-auto`, slide-in via `transition-all translate-x-0 opacity-100` (entering) vs `translate-x-full opacity-0` (exiting) using a 300 ms CSS transition — implement this by setting an `exiting` flag on dismiss and removing after 300 ms with `setTimeout`. Use Tailwind color classes:
  - success → `bg-green-600 text-white`
  - error → `bg-red-600 text-white`
  - info → `bg-blue-600 text-white`
  - warning → `bg-yellow-500 text-white`

  Auto-dismiss: each toast schedules a 4000 ms `setTimeout` on mount (use `useEffect` inside a `ToastItem` sub-component or track timers in the provider). Include an `×` close button (`aria-label="Close notification"`).

  Export:
  - `ToastProvider` (default or named — named preferred)
  - `useToast` hook that returns `{ toast }` where `toast.success(msg)`, `toast.error(msg)`, `toast.info(msg)`, `toast.warning(msg)` each call the internal `addToast`.

  **Decision:** Use a `ToastItem` sub-component inside the same file to isolate the auto-dismiss `useEffect` and transition state per toast, avoiding timer-bookkeeping complexity in the provider.

  Files: `client/src/components/Toast.jsx`  
  Verify: `cd client && npm run build` — exits 0 (file is created but not imported yet, so just ensures no syntax errors if Vite scans it).

---

- [ ] 2. **Wrap `<App />` in `<ToastProvider>` in `client/src/App.jsx`**

  Import `{ ToastProvider }` from `./components/Toast`. In the `App()` default export, wrap the entire `<BrowserRouter>…</BrowserRouter>` tree with `<ToastProvider>`. This means `ToastProvider` is the outermost wrapper in `App.jsx`.

  **Rationale:** `ToastProvider` must be outside `BrowserRouter` so toasts can fire during navigation events, and outside `AuthProvider`/`LanguageProvider` so those providers' error states can use toasts in later steps.

  Files: `client/src/App.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 3. **Replace `alert()` in `DonationFlow.jsx` and add success toasts across auth + scheme pages**

  Import `useToast` in each file listed below. Call `const { toast } = useToast()` at the top of each component.

  **`client/src/pages/DonationFlow.jsx`:**
  - Line in `onStep2Submit` catch block: replace `alert(err.response?.data?.error || 'Order creation failed…')` with `toast.error(err.response?.data?.error || 'Order creation failed. Please retry.')`.
  - After `setPaymentSuccess(true)` (inside the Razorpay `handler`): add `toast.success('Donation successful! Thank you.')` — but only if the existing success UI already shows, so this is supplemental.

  **`client/src/pages/Login.jsx`:**
  - After `login(token, user)` and before `navigate(...)`: add `toast.success(\`Welcome back, \${user.name}!\`)`.

  **`client/src/pages/Register.jsx`:**
  - After `login(token, user)` and before `navigate('/')`: add `toast.success('Account created successfully!')`.

  **`client/src/pages/SchemeFinder.jsx`:**
  - After `setHelplineSuccess(true)`: add `toast.success("We'll call you back shortly")`.
  - The bookmark-save toast (`"Scheme saved to your account"`) only applies if a bookmark/save action exists. Audit: `SchemeFinder.jsx` has no bookmark button — skip this one (no such action in the current codebase).

  **`client/src/pages/AdminSchemes.jsx`:**
  - In `SchemeModal.onSubmit` after `onSaved()` is called (success path): add `toast.success('Scheme saved successfully')`.
  - In `handleApprove` after `onSaved()`: add `toast.success('Hindi summary approved and published')`.

  **`client/src/pages/AdminCampaigns.jsx`:**
  - In `CampaignModal.onSubmit` after `onSaved(); onClose()`: add `toast.success('Campaign saved successfully')`.

  **Note:** `AdminDonations.jsx` has no `alert()` calls and no natural success toast moment — skip.

  Files: `client/src/pages/DonationFlow.jsx`, `client/src/pages/Login.jsx`, `client/src/pages/Register.jsx`, `client/src/pages/SchemeFinder.jsx`, `client/src/pages/AdminSchemes.jsx`, `client/src/pages/AdminCampaigns.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 4. **Add hero search bar to `client/src/pages/Home.jsx`**

  Inside the `<header>` section, after the closing `</div>` of the title/subtitle flex row (the `<div className="flex-1 text-center px-4">` block), add a new centered `<div>` containing:

  1. A search `<form>` with `onSubmit` that calls `navigate(\`/schemes?q=\${encodeURIComponent(searchTerm)}\`)`. Use a new local state `const [heroSearch, setHeroSearch] = useState('')`.
  2. Input: `type="text"`, placeholder `"Search schemes, benefits, eligibility…"`, `className="flex-1 px-5 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-secondary"`.
  3. Submit button with magnifying glass SVG (`M21 21l-4.35-4.35m0 0A7 7 0 1 0 6.35 6.35a7 7 0 0 0 10.3 10.3z` path), `className="bg-secondary text-white px-4 py-3 rounded-full hover:bg-green-700 transition-colors"`.
  4. Wrap both in `flex items-center gap-2 bg-white rounded-full shadow-md px-2 w-full max-w-xl`.
  5. Below the form: a `<div className="flex gap-2 flex-wrap justify-center mt-3">` of 4 pill buttons (Health | Livelihood | Pension | Maternity) using the existing `NEEDS` array — each `onClick` calls `navigate(\`/schemes?need=\${n.key}\`)`. Style: `px-4 py-1 rounded-full text-xs font-medium bg-white/80 text-primaryText hover:bg-white transition-colors border border-white/50`.

  Wrap the entire new block in `<div className="flex flex-col items-center gap-2 mt-4 pb-6 w-full">`.

  **Decision:** Keep `heroSearch` state local to `Home.jsx` — no need for a separate component since it's a small inline block.

  Files: `client/src/pages/Home.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 5. **Return `emailPreviewUrl` from email service and surface it in the donation flow**

  **`server/src/utils/emailService.js`:**
  - Change the function signature: it is `async function sendDonationConfirmation(...)` and currently returns `undefined`.
  - Capture `previewUrl` at the end of the try block: `const previewUrl = nodemailer.getTestMessageUrl(info);` (already done, just not returned).
  - Add `return previewUrl || null;` as the last line of the `try` block.
  - In the `catch` block: `return null;` (so callers always get a value).
  - The function signature in `module.exports` is unchanged.

  **`server/src/controllers/donationController.js`:**
  - In `verifyPayment`, the fire-and-forget call `sendDonationConfirmation({...})` must become `const emailPreviewUrl = await sendDonationConfirmation({...});` (add `await`).
  - In the final `res.json(...)`, change `data: { receiptNumber, donationId }` to `data: { receiptNumber, donationId, emailPreviewUrl: emailPreviewUrl || null }`.

  **`client/src/pages/DonationFlow.jsx`:**
  - In the payment success section, after the `<ReceiptDownload .../>` component, add a conditional block:
    ```jsx
    {completedDonation.emailPreviewUrl && (
      <div className="mt-3 flex flex-col items-center gap-1">
        <a
          href={completedDonation.emailPreviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          📧 View Confirmation Email (Demo)
        </a>
        <p className="text-xs text-gray-400">This is a test email preview — not sent to a real inbox</p>
      </div>
    )}
    ```

  Files: `server/src/utils/emailService.js`, `server/src/controllers/donationController.js`, `client/src/pages/DonationFlow.jsx`  
  Verify: `cd client && npm run build` — exits 0 (backend changes are runtime, not build-time).

---

- [ ] 6. **Create `client/src/components/SkeletonCard.jsx` with three exports**

  Create a new file with three named exports:

  **`SkeletonCard`** — A single card placeholder:
  ```jsx
  // animate-pulse wrapper, gray-200 background rounded-lg
  // Inside: 3 lines — a tall block (image/title, h-5 w-3/4 bg-gray-200 rounded),
  // a medium block (h-4 w-full bg-gray-200 rounded mt-2),
  // a short block (h-4 w-1/2 bg-gray-200 rounded mt-2),
  // a badge block (h-6 w-16 bg-gray-300 rounded-full mt-3),
  // a link block (h-9 w-full bg-gray-200 rounded mt-4)
  ```
  All blocks use `bg-gray-200` or `bg-gray-300`. Container: `bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-2`.

  **`SkeletonCampaignCard`** — Campaign variant with image and progress bar placeholders:
  - Image block: `h-36 w-full bg-gray-200 rounded mb-3`
  - Title: `h-5 w-3/4 bg-gray-200 rounded`
  - Description lines: two `h-4 bg-gray-200 rounded` at different widths
  - Progress bar: `h-2 w-full bg-gray-200 rounded-full mt-3`
  - Progress label row: two small `h-3 w-16 bg-gray-200 rounded` blocks in a flex justify-between
  - Button: `h-9 w-full bg-gray-200 rounded mt-4`

  **`SkeletonGrid`** — Renders 3 `<SkeletonCard>` in a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`.

  All three are named exports. No default export needed (but a default export of `SkeletonCard` can be added for convenience — do not add it to avoid ambiguity).

  Files: `client/src/components/SkeletonCard.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 7. **Replace `<LoadingSpinner />` with skeleton variants in `Home.jsx` and `SchemeFinder.jsx`**

  **`client/src/pages/Home.jsx`:**
  - Add import: `import { SkeletonGrid, SkeletonCampaignCard } from '../components/SkeletonCard';`
  - Remove the `LoadingSpinner` import if it's no longer used in `Home.jsx` (it is only used here — remove it).
  - In "Featured Schemes" section: replace `{loadingSchemes ? <LoadingSpinner /> : ...}` with `{loadingSchemes ? <SkeletonGrid /> : ...}`.
  - In "Campaigns" section: replace `{loadingCampaigns ? <LoadingSpinner /> : ...}` with a 3-card skeleton grid. Since `SkeletonGrid` uses `SkeletonCard` (not `SkeletonCampaignCard`), render the campaign skeleton inline:
    ```jsx
    {loadingCampaigns ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[0,1,2].map((i) => <SkeletonCampaignCard key={i} />)}
      </div>
    ) : ...}
    ```

  **`client/src/pages/SchemeFinder.jsx`:**
  - Add import: `import { SkeletonGrid } from '../components/SkeletonCard';`
  - Keep `LoadingSpinner` import (it is not used in this file currently — double-check: it IS imported and used in the `loading` branch of the results panel).
  - In the results panel `{loading ? <LoadingSpinner /> : ...}`: replace with `{loading ? <SkeletonGrid /> : ...}`.
  - Remove `LoadingSpinner` import from `SchemeFinder.jsx` since it's no longer used there.

  Files: `client/src/pages/Home.jsx`, `client/src/pages/SchemeFinder.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 8. **Add `successfulDonationsCount` to backend dashboard and two new stat cards in `AdminDashboard.jsx`**

  **`server/src/controllers/adminController.js` — `getDashboard`:**
  - Add a 6th entry to the `Promise.all` array:
    ```js
    Donation.countDocuments({ paymentStatus: 'success' }),
    ```
    This makes the destructured array `[totalDonationsCount, successfulDonations, uniqueDonorCount, schemesByStatus, campaignCount, successfulDonationsCount]`.
  - In the `res.json` data object, add: `successfulDonationsCount`.
  - Note: `uniqueDonors` is already `uniqueDonorCount.length` — no change needed there.

  **`client/src/pages/AdminDashboard.jsx`:**
  - Change the stat cards grid from `grid-cols-2 lg:grid-cols-4` to `grid-cols-2 lg:grid-cols-3`.
  - Add 5th `<StatCard>` after the existing 4:
    ```jsx
    <StatCard
      title="Unique Donors"
      value={data.uniqueDonors ?? 0}
      color="text-blue-600"
    />
    ```
  - Add 6th `<StatCard>`:
    ```jsx
    <StatCard
      title="Successful Payments"
      value={data.successfulDonationsCount ?? 0}
      color="text-secondary"
    />
    ```

  Files: `server/src/controllers/adminController.js`, `client/src/pages/AdminDashboard.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 9. **Rewrite `client/src/pages/NotFound.jsx`**

  Full rewrite of `NotFound.jsx`. Keep the same imports (`Link` from `react-router-dom`, `Navbar`, `Footer`, `useLanguage`).

  Structure:
  ```jsx
  // Inline SVG: a simple "broken compass" or "lost figure" — use a minimal SVG
  // (a circle with an X inside it, or a question mark in a circle, ~80×80px)
  // in primary color (#F5A623 / text-primary).
  ```
  - SVG: a circle outline with a question mark `?` in the center, `width="80" height="80"`, using `stroke="currentColor"` and `className="text-primary mx-auto mb-6"`.
  - Heading: `"Oops! Page not found"` / `"अरे! पृष्ठ नहीं मिला"` — `text-2xl font-bold text-gray-800`.
  - Subtext: `"The page you're looking for doesn't exist or has been moved."` / `"जो पृष्ठ आप खोज रहे हैं वह मौजूद नहीं है या हटा दिया गया है।"` — `text-sm text-gray-500`.
  - Three buttons in a `flex flex-col sm:flex-row gap-3 justify-center mt-8`:
    1. "Go Home" → `/` — `bg-secondary text-white px-6 py-2.5 rounded font-semibold hover:bg-green-700` (primary filled)
    2. "Find Schemes" → `/schemes` — `border border-secondary text-secondary px-6 py-2.5 rounded font-semibold hover:bg-green-50` (outlined)
    3. "Donate" → `/donate` — `text-gray-600 px-6 py-2.5 rounded font-semibold hover:bg-gray-100` (ghost)
  - Use `t(en, hi)` for all visible strings.

  Files: `client/src/pages/NotFound.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 10. **Add Print button to `client/src/components/ReceiptDownload.jsx`**

  The current component has one button. Changes:
  - Wrap the existing button (and the new print button) in a `<div className="flex gap-2 items-center flex-wrap">`.
  - Add a `printLoading` / `printError` state pair alongside the existing `loading`/`error`.
  - New `handlePrint` async function: same logic as `handleDownload` (fetch blob, create object URL) but instead of `<a>.click()`, call `window.open(url)`. Since `URL.createObjectURL` creates a blob URL that lives until revoked, and `window.open` opens it in a new tab for the browser's print dialog, do NOT revoke the URL immediately — let the tab manage it. Add a short comment explaining this.
  - Print button:
    ```jsx
    <button
      onClick={handlePrint}
      disabled={printLoading}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-colors"
      aria-label={`Print receipt ${receiptNumber || ''}`}
    >
      {printLoading ? '…' : '🖨'} {t('Print', 'प्रिंट')}
    </button>
    ```
  - Show `printError` as a separate `<p className="text-red-600 text-xs">` below.
  - The `error` paragraph for download stays as-is.

  Files: `client/src/components/ReceiptDownload.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

- [ ] 11. **Add end-date badges and closed-state guard to `client/src/components/CampaignCard.jsx`**

  Logic to add (place before the return, or compute inline):
  ```js
  const now = new Date();
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
  const isClosed = campaign.status === 'closed' || (endDate && endDate < now);
  const daysUntilEnd = endDate && !isClosed
    ? Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    : null;
  const isEndingSoon = daysUntilEnd !== null && daysUntilEnd <= 7;
  ```

  In the JSX, wrap the existing card `<div>` content in a `relative` container (add `relative` to the outer card div's className):
  - After the outer div opening tag, add:
    ```jsx
    {isClosed && (
      <span className="absolute top-2 right-2 bg-gray-400 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
        {t('Closed', 'बंद')}
      </span>
    )}
    {!isClosed && isEndingSoon && (
      <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full z-10">
        {t('Ending Soon', 'जल्द समाप्त')}
      </span>
    )}
    ```
  - Replace the `<Link to={...}>Donate Now</Link>` with a conditional:
    ```jsx
    {isClosed ? (
      <button
        disabled
        className="mt-auto block text-center w-full bg-gray-200 text-gray-400 py-2 rounded text-sm font-medium cursor-not-allowed"
        aria-disabled="true"
      >
        {t('Campaign Closed', 'अभियान समाप्त')}
      </button>
    ) : (
      <Link
        to={`/donate/${campaign._id}`}
        className="mt-auto block text-center bg-secondary text-white py-2 rounded text-sm font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
      >
        {t('Donate Now', 'दान करें')}
      </Link>
    )}
    ```

  Files: `client/src/components/CampaignCard.jsx`  
  Verify: `cd client && npm run build` — exits 0.

---

## Dependency Order Summary

Items 1–2 (Toast) must be done first as item 3 depends on `useToast` being available.  
Items 6–7 (Skeleton) must be done in order — component before page usage.  
Item 8 (backend + dashboard) is independent of all frontend items.  
Items 4, 5, 9, 10, 11 are independent of each other and of the Toast/Skeleton items.

Recommended execution order: **1 → 2 → 3 → 6 → 7 → 4 → 5 → 8 → 9 → 10 → 11**

All items leave the build in a passing state when completed.

---

## Implementation Record (Iteration 1)

**Completed:** All 8 enhancements implemented and committed.  
**Commit:** `32b85b1` — feat: 8 enhancements - toast, hero search, email preview, skeletons, donor stats, 404 polish, print receipt, campaign badges  
**Build result:** `✓ built in 1.21s` — exit 0. 17 files changed, 378 insertions, 53 deletions.

### Files changed
- NEW: `client/src/components/Toast.jsx` — ToastProvider + useToast hook
- NEW: `client/src/components/SkeletonCard.jsx` — SkeletonCard, SkeletonCampaignCard, SkeletonGrid
- MODIFIED: `client/src/App.jsx` — wrapped App in ToastProvider
- MODIFIED: `client/src/pages/Home.jsx` — hero search bar, skeleton replacements
- MODIFIED: `client/src/pages/Login.jsx` — toast.success on login
- MODIFIED: `client/src/pages/Register.jsx` — toast.success on register
- MODIFIED: `client/src/pages/DonationFlow.jsx` — replaced alert, email preview link
- MODIFIED: `client/src/pages/SchemeFinder.jsx` — helpline toast, SkeletonGrid
- MODIFIED: `client/src/pages/AdminSchemes.jsx` — scheme/approve toasts
- MODIFIED: `client/src/pages/AdminCampaigns.jsx` — campaign save toast
- MODIFIED: `client/src/pages/AdminDashboard.jsx` — 2 new stat cards, 6-col grid
- MODIFIED: `client/src/pages/NotFound.jsx` — full rewrite with SVG + 3 buttons
- MODIFIED: `client/src/components/ReceiptDownload.jsx` — Print button added
- MODIFIED: `client/src/components/CampaignCard.jsx` — Ending Soon / Closed badges
- MODIFIED: `server/src/utils/emailService.js` — returns previewUrl
- MODIFIED: `server/src/controllers/donationController.js` — awaits email, returns emailPreviewUrl
- MODIFIED: `server/src/controllers/adminController.js` — successfulDonationsCount added

---

## Gotchas & Edge Cases

1. **Toast in `main.jsx` vs `App.jsx`:** Wrapping `<App>` in `main.jsx` with `<ToastProvider>` would work but is fragile if `App` is lazy-loaded later. Wrap inside `App.jsx` as the outermost element instead — this is safer and matches the existing provider nesting pattern.

2. **`sendDonationConfirmation` is fire-and-forget by design:** Adding `await` in `verifyPayment` makes the response wait for the email attempt (including Ethereal account creation). This is acceptable in dev (Ethereal is fast) and in prod (real SMTP is fast). The existing error-swallowing catch in `emailService.js` ensures no email failure breaks the payment response. Do not remove the try/catch.

3. **`SkeletonGrid` layout must match real grid layout:** Home.jsx featured schemes grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`. `SkeletonGrid` must use the same class string exactly.

4. **`CampaignCard` `relative` class:** The outer div already has `bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow`. Just append `relative` — no other change to existing classes.

5. **`endDate` from Mongoose:** Campaign model stores `endDate` as a Date. When serialized to JSON, it comes as an ISO string. `new Date(campaign.endDate)` handles both cases correctly.

6. **Hero search bar in `Home.jsx` and SchemeFinder `q` param:** `SchemeFinder.jsx` reads `searchParams.get('q')` (maps to `params.q` in `fetchSchemes`) inside `useEffect`. The hero search bar navigates to `/schemes?q=...` which will populate this correctly. No changes needed in `SchemeFinder.jsx` for this enhancement.

7. **`AdminDashboard.jsx` grid change:** The existing `grid-cols-2 lg:grid-cols-4` becomes `grid-cols-2 lg:grid-cols-3`. On medium screens (between sm and lg) this means 2 cards per row for all 6 cards — acceptable, and the existing 4-card layout already had this behavior for the first 4 cards.

8. **`useToast` in `SchemeModal` (inside `AdminSchemes.jsx`):** `SchemeModal` is a function component defined inside the module. `useToast()` can be called at its top level since it is a React component — this is fine.
