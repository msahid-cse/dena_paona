# Dena-Paona - Personal Finance Ledger

A full-stack, secure, production-ready web application for managing personal and social debt/credit tracking.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Custom CSS (Dark Theme)
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (Neon)
- **Email**: Nodemailer (Gmail)
- **Auth**: JWT + bcrypt
- **Deployment**: Vercel

## 🔐 Features

- ✅ User Registration with full profile (name, username, phone, email, age, gender)
- ✅ Email verification with 6-digit OTP
- ✅ JWT-based authentication with secure cookies
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Dena (payable) & Paona (receivable) transaction management
- ✅ Partial payment support with progress tracking
- ✅ Registered user search by username/email/phone/name
- ✅ Unregistered contact support
- ✅ Email notifications on transactions
- ✅ Activity log
- ✅ Admin panel (manage users, ban/unban, delete, promote)
- ✅ Real-time dashboard with net balance
- ✅ Mobile-responsive dark UI

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy `.env.local.example` and fill in:
```env
DATABASE_URL=your_neon_postgresql_url
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
APP_URL=https://your-domain.vercel.app
```

### 3. Initialize Database
Visit `http://localhost:3000/api/init-db` or run:
```bash
curl http://localhost:3000/api/init-db
```

### 4. Run Development
```bash
npm run dev
```

### 5. Make Yourself Admin
After registering, run in Neon SQL editor:
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'your@email.com';
```

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/       # login, register, verify, logout, resend-code
│   │   ├── user/       # profile, search
│   │   ├── transactions/ # CRUD + [id]
│   │   ├── dashboard/   # stats
│   │   ├── admin/       # users management, stats
│   │   └── init-db/     # DB initialization
│   ├── login/
│   ├── register/
│   ├── verify/
│   ├── dashboard/
│   ├── transactions/
│   ├── contacts/
│   ├── activity/
│   ├── profile/
│   └── admin/
├── components/
│   ├── AppLayout.tsx
│   └── Sidebar.tsx
├── contexts/
│   └── AuthContext.tsx
└── lib/
    ├── db.ts
    ├── init-db.ts
    ├── jwt.ts
    ├── email.ts
    └── middleware.ts
```

## 🔒 Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with 7-day expiry
- HttpOnly cookies for token storage
- Input sanitization and validation
- SQL injection prevention via parameterized queries
- Admin-only routes protected server-side

## 💰 Dena-Paona System

- **Paona** (পাওনা) = Money to Receive (someone owes you)
- **Dena** (দেনা) = Money to Pay (you owe someone)
- Automatic status: `pending` → `partial` → `cleared`
- Remaining balance auto-calculated via PostgreSQL triggers
