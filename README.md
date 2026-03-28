# Blockchain Auth MVP

Fullstack MVP for wallet-based authentication with Ethereum signatures.

## What Is Implemented

- Wallet connect from browser extension wallets (`window.ethereum`)
- Nonce challenge with expiration and SIWE-style message fields
- Signature verification with `ethers.verifyMessage`
- Access token + rotating refresh token sessions
- Refresh session invalidation on login/logout
- Profile API with protected routes (`/api/profile`, `/api/session`)
- Security baseline: `helmet`, CORS policy, basic rate limiting, payload size limit
- Mobile-first frontend with animated UI and responsive layout

## Project Structure

- `backend/` - Express API
- `frontend/` - Vite + React app

## Run Locally

1. Install backend deps
   ```bash
   cd backend
   npm install
   ```
2. Configure backend env
   ```bash
   copy .env.example .env
   ```
3. Start backend
   ```bash
   npm run dev
   ```
4. Install and start frontend
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:4000`

## Backend Endpoints

- `GET /api/health`
- `GET /api/nonce?address=0x...&chainId=1`
- `POST /api/authenticate`
- `POST /api/refresh`
- `POST /api/logout`
- `GET /api/session`
- `GET /api/sessions`
- `POST /api/sessions/revoke`
- `GET /api/profile`
- `PUT /api/profile`

## Notes

- Current storage is file-based (`backend/users.json`) for MVP simplicity.
- For production, move to a database and add distributed rate limiting.
