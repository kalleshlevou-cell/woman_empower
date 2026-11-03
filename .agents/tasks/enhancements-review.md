# EmpowerHer NGO Platform — 8 Enhancements

This commit adds a self-contained toast notification system, a hero search bar with quick-filter pills, email preview linking for Ethereal test emails, skeleton loading screens replacing two `LoadingSpinner` usages, two new donor-stat cards on the admin dashboard, a fully rewritten 404 page, a Print button on the receipt component, and campaign end-date badges with a closed-state donate guard. The build passes (Vite, exit 0, 17 files, 381 insertions). All changes are Tailwind-only — no new npm packages.

**Watch for:** (confirmed) `useSchemes.js` was modified in this commit but the hook is unused across the codebase — the fix is correct but untested by any real consumer. (confirmed) The email preview link in `DonationFlow.jsx` is only reachable in local development with Ethereal; production SMTP will return `null` and the block will be hidden — expected, but worth noting the UX dead-end in prod.

**Verdict**: APPROVED

---

## High-level view

The toast system is implemented as a standalone context with a `ToastItem` sub-component that owns its own auto-dismiss timer and slide transition state, avoiding bookkeeping complexity in the provider. `ToastProvider` wraps the entire `<App>` as the outermost element, so toasts are available to all route-level components including auth flows. The `useToast` hook throws if called outside the provider, which will surface integration mistakes early.

The hero search bar lives entirely in `Home.jsx`, navigating to `/schemes?q=…`. `SchemeFinder.jsx` already reads `?q=` via `useSearchParams`, so no changes were needed there. The quick-filter pills reuse the existing `NEEDS` constant — no duplication.

The email preview chain is wired correctly end-to-end: `emailService.js` now returns `previewUrl || null`, `donationController.js` `await`s it and passes `emailPreviewUrl` in the response JSON, and `DonationFlow.jsx` renders the link only when the field is truthy. The `await` adds a small latency to the `verifyPayment` response in dev (Ethereal account creation), but errors are swallowed in the existing `catch` block so no payment failure risk is introduced.

Skeleton screens replace `LoadingSpinner` in `Home.jsx` and `SchemeFinder.jsx`. `DonationFlow.jsx` step 1 retains `LoadingSpinner` — intentional per plan.

The `useSchemes.js` hook was also updated in this commit (correctly unpacks `res.data.data.schemes`), but no component imports the hook. The fix is correct but unexercised.

---

<details>
<summary>Issues (2)</summary>

1. **`useSchemes` fix untested** — The hook correctly drills into `payload.schemes` now, but no component imports it. If a future component uses it before a test exists, there's no regression coverage. Add a consumer or a unit test before relying on it.

2. **Email preview unreachable in production** — `nodemailer.getTestMessageUrl(info)` only returns a URL when the transport is Ethereal (test mode). With real SMTP in production, `info` won't carry that URL and the function returns `null`. The "View Confirmation Email (Demo)" button will never appear in prod — which is fine — but the disclaimer copy ("This is a test email preview") should be stripped or gated before going to production to avoid confusing users who accidentally see it in a staging environment with Ethereal still wired.

</details>

---

<details>
<summary>Details</summary>

### Toast architecture — one non-obvious choice

The `toast` object inside `ToastProvider` is recreated on every render (it's not `useMemo`d or `useCallback`d). This is fine because context consumers don't use `toast` as a `useEffect` dependency — they call `toast.success(...)` in event handlers. If a future consumer adds `toast.success` to a `useEffect` dependency array, it will cause an infinite loop. The fix would be to wrap `toast` in `useMemo`. Not blocking, but worth noting before the codebase grows.

### `useSchemes.js` modified but has no consumers

The previous code would have set the `schemes` state to the entire `{ schemes, total, page, limit }` response object instead of the array — a bug. The fix is correct. However, no component currently imports `useSchemes`, so this code path is unexercised. Any future consumer is silently relying on an untested code path.

### Email preview — production UX gap

`nodemailer.getTestMessageUrl(info)` only returns a URL for Ethereal transports. With real SMTP in production, the field will always be `null` and the "View Confirmation Email (Demo)" button will never render. The disclaimer text ("This is a test email preview — not sent to a real inbox") should be removed before production deploy, or the block should be explicitly guarded to a `NODE_ENV !== 'production'` check on the server side, otherwise it remains dead markup in the component forever.

</details>

---

<details>
<summary>File map</summary>

| File | Change |
|------|--------|
| `client/src/components/Toast.jsx` | New — ToastProvider + useToast hook + ToastItem sub-component |
| `client/src/components/SkeletonCard.jsx` | New — SkeletonCard, SkeletonCampaignCard, SkeletonGrid exports |
| `client/src/App.jsx` | Wrapped App tree in ToastProvider as outermost element |
| `client/src/pages/Home.jsx` | Hero search bar + quick-filter pills; SkeletonGrid/SkeletonCampaignCard replacing LoadingSpinner |
| `client/src/pages/Login.jsx` | Added useToast + toast.success on successful login |
| `client/src/pages/Register.jsx` | Added useToast + toast.success; PAN schema refactor; better error logging |
| `client/src/pages/DonationFlow.jsx` | Replaced alert() with toast.error; email preview conditional link |
| `client/src/pages/SchemeFinder.jsx` | Helpline success toast; SkeletonGrid replacing LoadingSpinner in results panel |
| `client/src/pages/AdminSchemes.jsx` | Toast on scheme save and Hindi summary approval |
| `client/src/pages/AdminCampaigns.jsx` | Toast on campaign save |
| `client/src/pages/AdminDashboard.jsx` | Two new stat cards (Unique Donors, Successful Payments); grid lg:grid-cols-3 |
| `client/src/pages/NotFound.jsx` | Full rewrite — SVG illustration, updated heading/subtext, 3 action buttons |
| `client/src/components/ReceiptDownload.jsx` | Print button with handlePrint + printError state; flex row layout |
| `client/src/components/CampaignCard.jsx` | Ending Soon / Closed badges; disabled Donate button for closed/past campaigns |
| `server/src/utils/emailService.js` | Returns previewUrl from try block and null from catch |
| `server/src/controllers/donationController.js` | Awaits sendDonationConfirmation; passes emailPreviewUrl in response |
| `server/src/controllers/adminController.js` | Adds successfulDonationsCount via countDocuments to Promise.all |
| `client/src/hooks/useSchemes.js` | Fixes payload unpacking to correctly read .schemes from API response |

Full diff: `git -C <repo> diff HEAD~1`

</details>
