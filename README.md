# Dena-Paona - Personal Finance Ledger

A full-stack, secure, production-ready web application for managing personal and social debt/credit tracking.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Custom CSS (Dark/Light Theme)
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (Neon)
- **Email**: Nodemailer (Gmail)
- **Auth**: JWT + bcrypt
- **Deployment**: Vercel
- **Internationalization**: 3 Languages (English, Bengali, Banglish)

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
- ✅ **Mobile-responsive design for all devices**
- ✅ **Dark & Light theme modes**
- ✅ **Multi-language support (English, Bengali, Banglish)**
- ✅ **Email logging system**

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env.local` file:
```env
DATABASE_URL=your_neon_postgresql_url
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=admin.denapaona@gmail.com
EMAIL_PASS=your_gmail_app_password
APP_URL=https://your-domain.vercel.app
NODE_ENV=development
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
2. Import to Vercel at https://vercel.com
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `APP_URL`
4. Deploy to: https://denapaonaxd.vercel.app/

## 🎨 Theme & Language Features

### Dark/Light Mode
- Toggle between dark and light themes in the sidebar
- Preference is saved to localStorage
- Smooth transitions between themes
- CSS variables automatically update

### Multi-Language Support
- **English** (en)
- **Bengali** (bn) - Complete Bengali translation
- **Banglish** (banglish) - English with Bengali phonetics

Switch languages using the language selector in the sidebar. Preference is saved to localStorage.

### Mobile Responsive
- Fully responsive design for all screen sizes
- Mobile hamburger menu
- Optimized layouts for tablets and smartphones
- Touch-friendly buttons and spacing

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
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx      # NEW: Dark/Light theme toggle
│   └── LanguageContext.tsx   # NEW: Multi-language support
└── lib/
    ├── db.ts
    ├── init-db.ts
    ├── jwt.ts
    ├── email.ts
    ├── translations.ts        # NEW: Language translations
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
