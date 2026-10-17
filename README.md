# EduPulse

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

## Quick Start

```bash
npm install
npx prisma db push        # create tables
npx prisma db seed        # seed demo school data
npm run dev               # http://localhost:3000
```

## Demo Accounts

Password for all: `demo123`

| Role    | Email                  | Notes                          |
|---------|------------------------|--------------------------------|
| Admin   | admin@edupulse.in      | Principal — full school view   |
| Teacher | teacher@edupulse.in    | Anjali Sharma — Mathematics    |
| Parent  | parent@edupulse.in     | Rakesh Patel — weekly reports  |
| Student | student@edupulse.in    | Aarav Patel — Class 6A         |

## Stack

- **Framework:** Next.js 16.4.2 (App Router, Cache Components)
- **Language:** TypeScript
- **Database:** SQLite via Prisma 6
- **Auth:** JWT httpOnly cookie (jose)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts
