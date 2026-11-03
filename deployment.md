# EmpowerHer — Deployment Guide

## Live URLs
| Service | URL |
|---------|-----|
| Backend API (Render) | **https://woman-empower.onrender.com** ✅ Live |
| Frontend (Vercel) | **https://client-7eab.vercel.app** ✅ Live |
| GitHub | https://github.com/kalleshlevou-cell/woman_empower |

## Prerequisites

- **Node.js** ≥ 20.x (https://nodejs.org/)
- **npm** ≥ 10.x (bundled with Node.js)
- **MongoDB Atlas** account (free tier works) _or_ local MongoDB 7.x
- **Git** (https://git-scm.com/)

---

## Run Locally — Step by Step

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/empowerher.git
cd empowerher
```

### 2. Install all dependencies

```bash
npm run install:all
```

This runs `npm install` in the root, `client/`, and `server/` directories.

### 3. Configure environment variables

#### Server (`server/.env`)

Copy the example file and fill in your values:

```bash
cd server
cp .env.example .env
```

Required variables (names only — never commit actual values):

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default: `5000`) |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `RAZORPAY_KEY_ID` | Razorpay test-mode key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test-mode key secret |
| `TRUST_PAN` | Trust PAN for 80G receipt PDF |
| `TRUST_80G_REG` | Trust 80G registration number for receipt PDF |
| `TRUST_NAME` | Trust name printed on receipt PDF |
| `CLIENT_URL` | Frontend URL for CORS (default: `http://localhost:5173`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (optional — falls back to local uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API key (optional) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret (optional) |
| `EMAIL_HOST` | SMTP host for email (optional — uses Ethereal in dev) |
| `EMAIL_USER` | SMTP username (optional) |
| `EMAIL_PASS` | SMTP password (optional) |

#### Client (`client/.env`)

```bash
cd ../client
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API base URL (default: `http://localhost:5000`) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay test-mode key ID (public, safe for client) |

### 4. Seed the database

```bash
cd server
npm run seed
```

This creates sample users, schemes, and campaigns. The seed is idempotent (safe to re-run).

### 5. Start the application

From the project root:

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 5173) concurrently.

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

> **DNS Note (Windows)**: If you see `querySrv ECONNREFUSED` when connecting to MongoDB Atlas, your local DNS may not support SRV records. The server's `db.js` includes a Google DNS fallback (`8.8.8.8`) to handle this automatically.

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@empowerher.org` | `Admin@123` |
| **Donor** | `donor@test.com` | `Donor@123` |

### Razorpay Test Cards

| Scenario | Card Number | Expiry | CVV |
|----------|------------|--------|-----|
| **Success** | 4111 1111 1111 1111 | Any future date | 123 |
| **Failure** | 4000 0000 0000 0002 | Any future date | 123 |

---

## Deployment (Production)

### Option A — Render / Railway

1. **Backend**: Deploy `server/` as a Node.js web service.
   - Build command: `npm install`
   - Start command: `node src/server.js`
   - Set all environment variables from the table above.

2. **Frontend**: Deploy `client/` as a static site.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist/`
   - Set `VITE_API_URL` to the deployed backend URL.

### Option B — Vercel (frontend) + Render (backend)

1. Deploy `server/` on Render with env vars.
2. Deploy `client/` on Vercel; set `VITE_API_URL` to Render backend URL.

### Option C — Single VPS

```bash
# Build the frontend
cd client && npm run build

# Serve the built frontend from Express (add static middleware to server.js)
# Or use nginx to serve client/dist and proxy /api/* to localhost:5000

cd ../server
NODE_ENV=production node src/server.js
```

### Environment Variables Needed in Production

All variables from the server table above, plus:
- Set `MONGODB_URI` to your production Atlas cluster.
- Set `JWT_SECRET` to a strong random string (≥ 32 chars).
- Set `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to live keys (when ready for real payments).
- Set `CLIENT_URL` to your production frontend domain.
- Configure `CLOUDINARY_*` for image uploads.
- Configure `EMAIL_*` for real email delivery.

---

## Project Structure

```
empowerher/
├── package.json              # Root — concurrently runs both apps
├── server/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js          # Express entry point
│       ├── seed.js            # Database seeder
│       ├── config/db.js       # MongoDB connection
│       ├── models/            # Mongoose schemas (User, Scheme, Campaign, Donation, etc.)
│       ├── controllers/       # Route handlers
│       ├── routes/            # Express routers
│       ├── middleware/        # Auth, error handler, rate limiter, upload
│       └── utils/             # PDF generator, email service, eligibility engine
├── client/
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx            # Router setup
│       ├── main.jsx           # Entry point
│       ├── api/               # Axios instance + API wrappers
│       ├── components/        # Reusable UI components
│       ├── context/           # Auth + Language contexts
│       ├── hooks/             # Custom React hooks
│       ├── pages/             # Page components (Home, SchemeFinder, Admin*, etc.)
│       └── utils/             # Validators, formatters, constants
└── deployment.md              # This file
```
