# EmpowerHer — NGO Donations & Women's Welfare Portal

## 🌐 Live Demo
| | URL |
|---|---|
| **Frontend** | **https://client-7eab.vercel.app** |
| **Backend API** | **https://woman-empower.onrender.com** |

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@empowerher.org | Admin@123 |
| Donor | donor@test.com | Donor@123 |

A full-stack MERN platform connecting donors, women seeking government benefits, and NGO administrators. Features a women's government schemes finder, a complete donation workflow with 80G receipts, and an admin dashboard.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + React Hook Form + Zod
- **Backend**: Node.js + Express 4 + Mongoose 8
- **Database**: MongoDB Atlas (or local MongoDB)
- **Payments**: Razorpay (test/sandbox mode)
- **Email**: Nodemailer (Ethereal in dev)
- **Storage**: Cloudinary (optional; falls back to local `server/uploads/`)

## Setup Instructions

### Prerequisites

- Node.js 20+
- MongoDB running locally OR a MongoDB Atlas URI

### Steps

1. Clone the repository and install all dependencies:
   ```bash
   npm run install:all
   ```

2. Copy environment files:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. Edit `server/.env` and fill in:
   - `MONGODB_URI` — your local or Atlas connection string
   - `JWT_SECRET` — any long random string
   - `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — from Razorpay test dashboard
   - `TRUST_NAME`, `TRUST_PAN`, `TRUST_80G_REG` — trust details for receipts

4. Edit `client/.env` and fill in:
   - `VITE_RAZORPAY_KEY_ID` — same as `RAZORPAY_KEY_ID` above

5. Start both servers:
   ```bash
   npm run dev
   ```
   - Client: http://localhost:5173
   - Server: http://localhost:5000

## Test Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@empowerher.org     | Admin@123  |
| Donor | donor@test.com           | Donor@123  |

## Razorpay Test Cards

| Scenario | Card Number          | Expiry      | CVV |
|----------|----------------------|-------------|-----|
| Success  | 4111 1111 1111 1111  | Any future  | 123 |
| Failure  | 4000 0000 0000 0002  | Any future  | 123 |

## Seeding

```bash
cd server && npm run seed
```

## Known Limitations

- **AI Hindi draft** is mocked — returns a hardcoded paragraph, not a real OpenAI call.
- **All payments are Razorpay test mode** — no real money moves.
- **Email is Ethereal in dev** — check the console for the preview URL.
- **Cloudinary**: image upload requires real Cloudinary keys; falls back to local `server/uploads/` without them.
- **Foreign card blocking**: detection is best-effort based on Razorpay's `international` flag.
- **WCAG 2.1 AA**: contrast and keyboard navigation implemented; full certification requires manual testing with assistive technologies.
- **80G receipts are for demonstration only** and are not legally valid documents.
