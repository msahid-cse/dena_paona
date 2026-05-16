# 💰 Dena-Paona — Personal Finance Ledger

<div align="center">

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-denapaonaxd.vercel.app-6366f1?style=for-the-badge)](https://denapaonaxd.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-008bb9?style=for-the-badge&logo=postgresql)](https://neon.tech)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Track who owes you, who you owe — simply and securely.**

A full-stack social finance ledger for managing **Dena** (দেনা / payable) and **Paona** (পাওনা / receivable) transactions between friends, family, and colleagues.

[Live App](https://denapaonaxd.vercel.app) · [Report Bug](https://github.com/msahid-cse/dena_paona/issues) · [Request Feature](https://github.com/msahid-cse/dena_paona/issues)

</div>

---

## 📋 Table of Contents

- [About The Project](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Database Schema](#-database-schema)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Super Admin](#-super-admin)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📖 About The Project

**Dena-Paona** (দেনা-পাওনা) is a Bengali term meaning *"debts and credits"*. This web application helps you track informal money transactions with people in your life — eliminating the need to remember who owes you what.

### The Problem It Solves
- You lend ৳500 to a friend — hard to remember later
- Multiple people owe you different amounts — impossible to track mentally
- Settling debts requires both parties to agree on the amount

### How It Works
1. **Register** and verify your email
2. **Add transactions** — record who owes you (Paona) or who you owe (Dena)
3. **Linked users get notified** — if you add a registered user to your Paona list, they receive a notification
4. **They can approve** — the counterparty can approve the request, auto-adding it to their Dena list
5. **Record payments** as money changes hands until the debt is fully cleared
6. **Chat** with contacts directly within the app

---

## ✨ Features

### 💳 Transaction Management
- Add **Paona** (receivable) and **Dena** (payable) transactions
- Partial payment tracking with progress bar
- Payment history per transaction
- Due date reminders
- Status tracking: `Pending → Partial → Cleared`

### 🔔 Smart Notification System
- When User A adds User B to their **Paona** list → User B gets an in-app notification
- User B can **✅ Approve** (auto-creates matching entry in their Dena list) or **❌ Decline**
- Notifications for transaction updates and approvals
- Real-time badge count in sidebar (polls every 30 seconds)

### 💬 User-to-User Chat
- Direct messaging between registered users
- Conversation list with unread count badges
- Auto-polling for new messages every 5 seconds
- Full message thread with timestamps

### 🌍 Multilingual Support
| Language | Code | Script |
|----------|------|--------|
| English | `en` | Latin |
| বাংলা (Bangla) | `bn` | Bengali |
| Banglish | `banglish` | Romanized Bengali |

### 🌙 Dark / Light Mode
- Toggle between dark and light themes
- Preference saved in `localStorage`
- Flicker-free (theme set before page paint)

### 👥 User Management
- JWT-based authentication with 7-day token expiry
- Email verification (6-digit OTP)
- Password reset via email
- User search by name, username, email, or phone

### 🛡️ Admin Panel
- Full member CRUD (Create, Read, Update, Delete)
- Ban / Unban users
- Promote / Demote admin roles
- Force-verify user accounts
- System activity logs
- Transaction volume statistics

### 📱 Fully Responsive
- Mobile-friendly sidebar drawer
- Responsive grids and tables
- Touch-optimized interactions

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Language** | TypeScript |
| **Styling** | Vanilla CSS with CSS Variables |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **Auth** | JWT (`jsonwebtoken`) + bcrypt |
| **Email** | Nodemailer (Gmail SMTP) |
| **HTTP Client** | Axios |
| **Date Formatting** | date-fns |
| **Toast Notifications** | react-hot-toast |
| **Deployment** | [Vercel](https://vercel.com) |

---

## 🗄 Database Schema

```
users
├── id (UUID PK)
├── name, username (unique), email (unique), phone (unique)
├── password_hash, age, gender
├── is_verified, is_admin, is_banned
└── created_at, updated_at

transactions
├── id (UUID PK)
├── owner_id → users.id
├── contact_user_id → users.id (nullable, for registered contacts)
├── contact_name, contact_phone (for unregistered contacts)
├── amount, paid_amount, remaining_amount (computed)
├── type: 'dena' | 'paona'
├── status: 'pending' | 'partial' | 'cleared'
├── notes, due_date
└── created_at, updated_at

payment_history
├── id, transaction_id → transactions.id
├── amount, notes
└── created_at

notifications
├── id (UUID PK)
├── recipient_id → users.id
├── sender_id → users.id
├── type (transaction_request | transaction_approved | transaction_rejected | dena_info)
├── title, message, data (JSONB)
├── is_read, is_actioned, action_taken
└── created_at

messages
├── id (UUID PK)
├── sender_id → users.id
├── recipient_id → users.id
├── content, is_read
└── created_at

activity_logs
├── id, user_id → users.id
├── action, description, metadata (JSONB)
└── created_at

verification_codes
├── id, user_id → users.id
├── code, type, expires_at
└── created_at

system_logs
├── id, level, message, metadata (JSONB)
└── created_at
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- A **Neon PostgreSQL** database (free tier works): [neon.tech](https://neon.tech)
- A **Gmail** account with an [App Password](https://support.google.com/accounts/answer/185833)

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msahid-cse/dena_paona.git
   cd dena_paona
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values (see below)
   ```

4. **Initialize the database**
   ```bash
   npm run dev
   # Then in another terminal:
   curl -X GET http://localhost:3000/api/setup/seed-admin \
     -H "x-setup-secret: YOUR_SETUP_SECRET"
   ```

5. **Seed the super admin** *(wipes all data and creates admin)*
   ```bash
   curl -X POST http://localhost:3000/api/setup/seed-admin \
     -H "x-setup-secret: YOUR_SETUP_SECRET" \
     -H "Content-Type: application/json"
   ```

6. **Open the app**
   ```
   http://localhost:3000
   ```

---

## 🔐 Environment Variables

Create a `.env.local` file in the project root:

```env
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT signing secret (use a long random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Gmail SMTP credentials for email verification
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Public app URL (used in email links)
APP_URL=http://localhost:3000

# Secret for the setup/seed endpoint
SETUP_SECRET=YOUR_SETUP_SECRET
```

> **Note:** For `EMAIL_PASS`, use a Gmail **App Password**, not your regular Gmail password.  
> Enable 2FA and generate one at: [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords)

### Vercel Environment Variables

When deploying to Vercel, add these same variables in:  
**Vercel Dashboard → Project → Settings → Environment Variables**

Or use the CLI:
```bash
echo "your_value" | npx vercel env add VARIABLE_NAME production
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT |
| `POST` | `/api/auth/logout` | Logout (clears cookie) |
| `POST` | `/api/auth/verify` | Verify email OTP |
| `POST` | `/api/auth/resend-code` | Resend verification code |
| `POST` | `/api/auth/forgot-password` | Send password reset code |
| `POST` | `/api/auth/reset-password` | Reset password with code |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | List user's transactions |
| `POST` | `/api/transactions` | Create transaction + notify contact |
| `GET` | `/api/transactions/[id]` | Get transaction detail + payment history |
| `PUT` | `/api/transactions/[id]` | Record payment |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get all notifications |
| `PUT` | `/api/notifications` | Mark as read |
| `POST` | `/api/notifications/[id]` | Approve or decline a transaction request |

### Messages (Chat)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages` | List conversations |
| `GET` | `/api/messages?with=userId` | Get messages with a user |
| `POST` | `/api/messages` | Send a message |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/user/profile` | Get own profile |
| `PUT` | `/api/user/profile` | Update profile |
| `GET` | `/api/user/search?q=query` | Search users |
| `GET` | `/api/dashboard` | Dashboard stats |

### Admin *(requires `is_admin = true`)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | List all users (paginated) |
| `GET` | `/api/admin/users/[id]` | Get user detail |
| `PUT` | `/api/admin/users/[id]` | Ban / Unban / Edit / Verify / Toggle Admin |
| `DELETE` | `/api/admin/users/[id]` | Delete user |
| `GET` | `/api/admin/stats` | Platform-wide statistics |

### Setup *(protected by `x-setup-secret` header)*
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/setup/seed-admin` | Initialize DB schema only |
| `POST` | `/api/setup/seed-admin` | **Wipe all data** + create super admin |

> ⚠️ **Warning:** The `POST /api/setup/seed-admin` endpoint deletes ALL data. Only use this for initial setup.

---

## 🛡 Super Admin

The super admin account is created by the seed endpoint:

| Field | Value |
|-------|-------|
| **Username** | `admindenapaona` |
| **Password** | `DENA@12345#paona` |
| **Email** | `admin@denapaona.com` |

The super admin **cannot be deleted** through the admin panel (protected in the API).

---

## ☁️ Deployment

### Deploy to Vercel (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Add environment variables**
   ```bash
   echo "your_db_url" | vercel env add DATABASE_URL production
   echo "your_jwt_secret" | vercel env add JWT_SECRET production
   echo "your_email" | vercel env add EMAIL_USER production
   echo "your_app_pass" | vercel env add EMAIL_PASS production
   echo "https://yourdomain.vercel.app" | vercel env add APP_URL production
   echo "your_secret" | vercel env add SETUP_SECRET production
   ```

4. **Deploy**
   ```bash
   vercel --prod --yes
   ```

5. **Initialize the database on production**
   ```bash
   curl -X GET https://yourdomain.vercel.app/api/setup/seed-admin \
     -H "x-setup-secret: your_secret"
   ```

6. **Disable Vercel Authentication** *(to make the site public)*  
   Go to: `Vercel Dashboard → Project → Settings → Deployment Protection → Vercel Authentication → OFF`

### Making the Site Public

By default Vercel may require login. Disable it at:
> **Vercel Dashboard → [Your Project] → Settings → Deployment Protection**  
> Toggle **"Vercel Authentication"** to **OFF**

---

## 📸 Screenshots

> Dashboard showing Paona/Dena summary, Contact Ledger, and Quick Actions

| Dark Mode | Light Mode |
|-----------|-----------|
| Full sidebar with admin panel, notifications badge | Clean light theme, same layout |

---

## 🗂 Project Structure

```
dena_paona/
├── src/
│   ├── app/
│   │   ├── api/                    # API Routes
│   │   │   ├── admin/              # Admin endpoints
│   │   │   ├── auth/               # Auth endpoints
│   │   │   ├── messages/           # Chat endpoints
│   │   │   ├── notifications/      # Notification endpoints
│   │   │   ├── setup/              # DB init/seed
│   │   │   ├── transactions/       # Transaction CRUD
│   │   │   └── user/               # User profile/search
│   │   ├── admin/                  # Admin pages
│   │   ├── chat/                   # Chat page
│   │   ├── contacts/               # Contacts page
│   │   ├── dashboard/              # Dashboard page
│   │   ├── login/                  # Login page
│   │   ├── notifications/          # Notifications page
│   │   ├── profile/                # Profile page
│   │   ├── register/               # Registration page
│   │   ├── transactions/           # Transactions pages
│   │   ├── verify/                 # Email verification
│   │   ├── globals.css             # Global styles + theme variables
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── AppLayout.tsx           # App shell with mobile header
│   │   └── Sidebar.tsx             # Sidebar with nav + badges
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Authentication state
│   │   ├── LanguageContext.tsx     # i18n (EN / বাংলা / Banglish)
│   │   └── ThemeContext.tsx        # Dark / Light mode
│   └── lib/
│       ├── db.ts                   # Neon DB query wrapper
│       ├── email.ts                # Nodemailer email functions
│       ├── init-db.ts              # Database schema initialization
│       ├── jwt.ts                  # JWT sign/verify helpers
│       └── middleware.ts           # Auth middleware helpers
├── public/
├── vercel.json                     # Vercel build config
├── next.config.ts                  # Next.js config
├── package.json
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

### Development Tips

- Run `npm run dev` for local development with hot reload
- Use `npm run build` to verify TypeScript before pushing
- The DB is shared (Neon serverless) — be careful with seed endpoints
- Add new translations to all three language objects in `LanguageContext.tsx`

---

## 🐛 Known Limitations

- **Chat is polling-based** (refreshes every 5s) — not true WebSocket real-time. Vercel serverless doesn't support persistent connections on the free tier.
- **Email delivery** depends on Gmail App Password being valid. If emails fail, the user can still be manually verified by an admin.
- **Vercel free tier** has 100GB bandwidth/month and serverless function limits.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

## 👨‍💻 Author

**Md. Sahid** — [@msahid-cse](https://github.com/msahid-cse)

---

## 🙏 Acknowledgements

- [Neon](https://neon.tech) — Serverless Postgres
- [Vercel](https://vercel.com) — Hosting and deployment
- [Next.js](https://nextjs.org) — The React framework
- [react-hot-toast](https://react-hot-toast.com) — Toast notifications
- [date-fns](https://date-fns.org) — Date formatting
- [Inter Font](https://fonts.google.com/specimen/Inter) — UI typography

---

<div align="center">
Made with ❤️ in Bangladesh 🇧🇩
</div>
