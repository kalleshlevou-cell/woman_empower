# EmpowerHer — Deployment Guide

## GitHub Repository
**https://github.com/kalleshlevou-cell/woman_empower**

## Demo Login Credentials

| Role  | Email                    | Password   |
|-------|--------------------------|------------|
| Admin | admin@empowerher.org     | Admin@123  |
| Donor | donor@test.com           | Donor@123  |

**Razorpay test card:** `4111 1111 1111 1111` — any future expiry, CVV `123`

---

## Run Locally — Step by Step

### Prerequisites
- Node.js 18 or higher (`node --version`)
- Git
- MongoDB Atlas free account — [cloud.mongodb.com](https://cloud.mongodb.com)
- Razorpay test account — [razorpay.com](https://razorpay.com)

### 1. Clone the repository
```bash
git clone https://github.com/kalleshlevou-cell/woman_empower.git
cd woman_empower
```

### 2. Install all dependencies
```bash
npm run install:all
```
Installs root, client, and server dependencies in one command.

### 3. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/empowerher
JWT_SECRET=<any-long-random-string>
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
TRUST_NAME=Company A Charitable Trust, Bhopal
TRUST_PAN=<trust-pan>
TRUST_80G_REG=<trust-80g-reg-number>
PORT=5000
CLIENT_URL=http://localhost:5173
```

Edit `client/.env`:
```
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
```

### 4. Allow your IP in MongoDB Atlas
Atlas → Network Access → Add IP Address → Allow from Anywhere (`0.0.0.0/0`)

### 5. Start both servers
```bash
npm run dev
```
- Frontend: **http://localhost:5173**
- Backend: **http://localhost:5000**

The server auto-seeds 2 campaigns, 3 schemes, 1 admin, and 1 donor on first start.

### 6. (Optional) Manual seed
```bash
cd server && npm run seed
```

---

## Environment Variables Reference

### server/.env

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | JWT token signing secret |
| `RAZORPAY_KEY_ID` | Razorpay test key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret |
| `TRUST_NAME` | Trust name on 80G certificates |
| `TRUST_PAN` | Trust PAN on 80G certificates |
| `TRUST_80G_REG` | Trust 80G registration number |
| `PORT` | Server port (default 5000) |
| `CLIENT_URL` | Frontend origin for CORS |
| `CLOUDINARY_CLOUD_NAME` | Optional — local upload fallback if absent |
| `CLOUDINARY_API_KEY` | Optional |
| `CLOUDINARY_API_SECRET` | Optional |
| `EMAIL_HOST` | Optional — Ethereal mock used in dev if absent |
| `EMAIL_USER` | Optional |
| `EMAIL_PASS` | Optional |

### client/.env

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend API base URL |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key for frontend checkout |

---

## Deployment (Production)

### Frontend → Vercel
1. Import repo at [vercel.com](https://vercel.com)
2. Root directory: `client`
3. Add `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID` as env vars
4. Deploy

### Backend → Render
1. New Web Service at [render.com](https://render.com)
2. Root directory: `server`
3. Build: `npm install` · Start: `node src/server.js`
4. Add all `server/.env` variables in Render dashboard
5. Deploy

### Database → MongoDB Atlas
Free M0 cluster is sufficient for the demo.

---

## Known Limitations
- All payments are Razorpay **test mode** — no real money moves
- 80G receipts are for demonstration only — not legally valid
- AI Hindi summaries are **mocked** — no OpenAI key required to run
- Email uses **Ethereal** (mock SMTP) in dev — preview URL shown in UI after donation
- Data resets on server restart if Atlas is unreachable (falls back to in-memory MongoDB)
