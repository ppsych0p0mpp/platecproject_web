# 🖥️ SAMS Web Admin

The web administration panel for the Student Attendance Management System.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see below)

# Seed the database
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔧 Environment Variables

Create a `.env.local` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-super-secret-key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🗄️ Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase-schema.sql`
3. Get credentials from **Settings > API**

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:seed:fresh` | Wipe and reseed database |
| `npm run db:wipe` | Wipe all data |
| `npm run test:system` | Run system tests |

## 🔐 Default Credentials

- **Admin:** admin@sams.com / admin123
- **Student:** john@student.com / password123
