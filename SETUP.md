# Setup Guide - Ace Truckers Corp ERP SaaS

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/) or use Docker
3. **Git** (optional, for version control)

## Quick Start

### 1. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb ace_truckers_erp
```

#### Option B: Docker PostgreSQL
```bash
docker run --name ace-truckers-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ace_truckers_erp \
  -p 5432:5432 \
  -d postgres:14
```

### 2. Backend API Setup

```bash
cd api

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database URL:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ace_truckers_erp?schema=public"
# JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database
npm run prisma:seed

# Start development server
npm run start:dev
```

API will run on `http://localhost:3001`
Swagger docs at `http://localhost:3001/api`

### 3. Web Application Setup

```bash
cd web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start development server
npm run dev
```

Web app will run on `http://localhost:3000`

### 4. Login Credentials

After seeding:
- **Email**: `admin@acetruckers.com`
- **Password**: `admin123`
- **Role**: Super Admin

## Project Structure

```
ace-truckers-erp/
├── api/                    # NestJS backend
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── fleet-acquisition/  # Fleet Acquisition module
│   │   ├── dispatch/      # Dispatch module
│   │   ├── finance/       # Finance module
│   │   └── ...
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Seed script
│   └── package.json
├── web/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   └── package.json
├── prisma/                # Shared schema (source of truth)
│   └── schema.prisma
└── README.md
```

## Database Management

### View Database
```bash
cd api
npx prisma studio
```

### Create Migration
```bash
cd api
npx prisma migrate dev --name migration_name
```

### Reset Database
```bash
cd api
npx prisma migrate reset
npm run prisma:seed
```

## Logo Files

Place logo files in `web/public/logos/`:
- `logo-horizontal.png` - For top bar, login page
- `logo-square.png` - For app icon, avatars

## Troubleshooting

### Prisma Client Not Generated
```bash
cd api
npx prisma generate
```

### Database Connection Issues
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `api/.env` (default: 3001)
- Change port in `web/.env.local` if needed

### CORS Issues
- Ensure `FRONTEND_URL` in `api/.env` matches web app URL
- Default: `http://localhost:3000`

## Development Workflow

1. Start PostgreSQL
2. Start API: `cd api && npm run start:dev`
3. Start Web: `cd web && npm run dev`
4. Access:
   - Web: http://localhost:3000
   - API: http://localhost:3001
   - Swagger: http://localhost:3001/api

## Next Steps

1. Add logo files to `web/public/logos/`
2. Implement Driver Android App (React Native)
3. Set up S3-compatible storage
4. Configure FCM for notifications
5. Complete remaining modules (Incidents, Rates, Reports, etc.)
