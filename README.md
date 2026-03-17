# Ace Truckers Corp ERP SaaS - Phase 1 (Shopee Express)

A centralized ERP SaaS for managing subcontractors, dispatching trips, and processing finance operations for Shopee Express (SPX).

## Tech Stack

- **Web Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend API**: NestJS + Prisma + PostgreSQL
- **Mobile App**: React Native (offline-first, GPS + photo stamping)
- **Storage**: S3-compatible object storage
- **Notifications**: Firebase Cloud Messaging (FCM)

## Project Structure

```
ace-truckers-erp/
├── web/                 # Next.js web application
├── api/                 # NestJS backend API
├── mobile/             # React Native driver app
├── prisma/             # Shared Prisma schema
└── README.md
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for local PostgreSQL)
- Android Studio (for mobile app development)

## Quick Start

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb ace_truckers_erp

# Or using Docker
docker run --name ace-truckers-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ace_truckers_erp -p 5432:5432 -d postgres:14
```

### 2. Backend API Setup

```bash
cd api
npm install
cp .env.example .env
# Edit .env with your database URL and other configs
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API runs on `http://localhost:3001`

### 3. Web Application Setup

```bash
cd web
npm install
cp .env.example .env
# Edit .env with API URL
npm run dev
```

Web app runs on `http://localhost:3000`

### 4. Mobile App Setup

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with API URL and FCM config
npm run android
```

## Environment Variables

### API (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/ace_truckers_erp"
JWT_SECRET="your-secret-key"
S3_ENDPOINT="your-s3-endpoint"
S3_ACCESS_KEY="your-access-key"
S3_SECRET_KEY="your-secret-key"
S3_BUCKET="ace-truckers-uploads"
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### Mobile (.env)
```
API_URL="http://localhost:3001"
FCM_SERVER_KEY="your-fcm-server-key"
```

## Seed Data

The seed script creates:
- Super Admin user (email: `admin@acetruckers.com`, password: `admin123`)
- Shopee Express (SPX) client account
- 8 SPX service categories (FM, Mega FM, MFM Shunting)
- Default service configurations for each category

## Module Summary

### Implemented (Milestone 0-1)
- ✅ **Database Schema**: Complete Prisma schema with all entities
- ✅ **Authentication**: JWT-based auth with RBAC guards
- ✅ **Fleet Acquisition**: Create operators, drivers, vehicles with assignment history
- ✅ **Dispatch**: Create trips with operator enforcement, POD verify/reject workflow
- ✅ **Finance**: Scan trip by internal ref (barcode), view trip (blocked until POD_VERIFIED)
- ✅ **Web UI Shell**: Login, sidebar, topbar, placeholder pages for all modules

### Pending Implementation
- Driver Android App (React Native)
- Notification system (FCM, hourly reminders)
- Incident reporting workflow
- Rates management
- Finance computation & batching
- Cashbond logic
- Payout approvals workflow
- Dashboards with KPIs
- Audit logging

## Development

### Database Migrations

```bash
cd api
npx prisma migrate dev --name migration_name
npx prisma generate
```

### View Database

```bash
cd api
npx prisma studio
```

## Key Features (Phase 1)

- ✅ Fleet Acquisition (Operator/Driver/Vehicle onboarding)
- ✅ Dispatch & Trip Management
- ✅ Driver Android App (offline-first)
- ✅ POD Verification Workflow
- ✅ Finance Processing & Batching
- ✅ Incident Reporting
- ✅ Rates Management
- ✅ RBAC & Audit Logs

## License

Proprietary - Ace Truckers Corp
