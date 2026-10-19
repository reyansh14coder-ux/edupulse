# Vidyora

AI-powered student progress monitoring platform for schools — continuous assessment loop: **Collect → Track → Analyze → Recommend → Assess → Re-analyze → Improve**.

Built with Next.js 16 (App Router), Prisma + SQLite, TypeScript, Tailwind CSS v4.

## Features

- **4 role dashboards** — Admin (principal), Teacher, Student, Parent
- **Attendance & marks** — one-tap attendance, marks entry with live class stats
- **Homework / assignments / projects** — create, track submissions, overdue flags
- **AI recommendations engine** — weak-subject detection, decline alerts, attendance risk, strengths
- **AI-generated quizzes** — syllabus-aware MCQs; quiz results feed back into progress analysis
- **Weekly parent reports** — auto-generated highlights, concerns, next-week focus
- **Counseling** — at-risk queue, session scheduling, guidance notes
- **Student profiles** — score ring, trend charts, subject-wise performance, activity history

---

## Installation (Step by Step)

### Prerequisites

1. **Node.js** v18 or newer — download from [https://nodejs.org](https://nodejs.org) (LTS version recommended)
2. **npm** — comes bundled with Node.js (no separate install needed)
3. **Git** — download from [https://git-scm.com](https://git-scm.com) (optional, only if cloning via git)

### Option A — Clone from GitHub (recommended)

```bash
# 1. Clone the repository
git clone https://github.com/reyansh14coder-ux/edupulse.git

# 2. Go into the project folder
cd Vidyora

# 3. Install all dependencies
npm install

# 4. Create the database tables
npx prisma db push

# 5. Seed the database with demo school data (students, teachers, marks, attendance, AI quizzes)
npx prisma db seed

# 6. Start the development server
npm run dev
```

### Option B — Download ZIP

1. Click the green **<> Code** button on the repo page
2. Click **Download ZIP**
3. Extract the ZIP anywhere on your computer
4. Open terminal/cmd in the extracted `Vidyora` folder
5. Run the same commands as Option A, steps 3–6:

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### Open in browser

After `npm run dev`, open:

```
http://localhost:3000
```

You should see the Vidyora landing page. Click **"Try the demo"** or go to `/login`.

---

## Demo Accounts

Password for all accounts: **`demo123`**

| Role    | Email                  | Notes                          |
|---------|------------------------|--------------------------------|
| Admin   | admin@Vidyora.in      | Principal — full school view   |
| Teacher | teacher@Vidyora.in    | Anjali Sharma — Mathematics    |
| Parent  | parent@Vidyora.in     | Rakesh Patel — weekly reports  |
| Student | student@Vidyora.in    | Aarav Patel — Class 6A         |

---

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start development server (hot reload) |
| `npm run build` | Create production build |
| `npm run start` | Run production build |
| `npx prisma db push` | Sync schema to database (creates tables) |
| `npx prisma db seed` | Populate database with demo data |
| `npx prisma studio` | Open database browser at http://localhost:5555 |

---

## Project Structure

```
Vidyora/
├── prisma/
│   ├── schema.prisma      # Database models
│   ├── seed.ts            # Demo data seeder
│   └── dev.db             # SQLite database (auto-created)
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page
│   │   ├── login/                 # Login page
│   │   ├── (protected)/           # All dashboard pages (auth required)
│   │   │   ├── admin/             # Admin dashboard
│   │   │   ├── teacher/           # Teacher dashboard
│   │   │   ├── student/           # Student dashboard
│   │   │   ├── parent/            # Parent dashboard
│   │   │   ├── students/[id]/     # Shared student profile
│   │   │   └── counseling/        # Counseling queue
│   │   └── actions/               # Server actions (forms, auth)
│   ├── components/                # UI components
│   ├── lib/                       # Auth, AI engine, insights, utils
│   └── proxy.ts                   # Auth middleware
├── .env                           # Environment variables (DATABASE_URL, SESSION_SECRET)
└── package.json
```

---

## Tech Stack

- **Framework:** Next.js 16.4.2 (App Router, Cache Components)
- **Language:** TypeScript
- **Database:** SQLite via Prisma 6
- **Auth:** JWT httpOnly cookie (jose)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
- **Icons:** Lucide React

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `npm` not recognized | Install Node.js from [nodejs.org](https://nodejs.org), restart terminal |
| Port 3000 already in use | Run `npm run dev -- -p 4000` |
| `prisma` command not found | Run `npm install` first, then try again |
| Database errors | Delete `prisma/dev.db`, then run `npx prisma db push && npx prisma db seed` |
| Login not working | Make sure `.env` file exists with `DATABASE_URL` and `SESSION_SECRET` |
