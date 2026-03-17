# Ace Truckers Corp ERP SaaS - Project Summary

## Overview

This is the Phase 1 implementation of the Ace Truckers Corp ERP SaaS for Shopee Express (SPX). The system manages subcontractors, dispatches trips, processes finance operations, and provides a driver mobile app.

## Architecture

### Tech Stack
- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Mobile**: React Native (to be implemented)
- **Storage**: S3-compatible object storage
- **Notifications**: Firebase Cloud Messaging (FCM)

### Project Structure
```
ace-truckers-erp/
├── api/              # NestJS backend
├── web/              # Next.js frontend
├── mobile/           # React Native app (to be implemented)
├── prisma/           # Shared Prisma schema
└── README.md
```

## Database Schema

The Prisma schema includes:

### Core Entities
- **Tenants**: Multi-tenancy support
- **Users & RBAC**: 10 roles (Super Admin, Admin, Manager, Fleet Acquisition, Operations Account Coordinator, Finance Personnel, Finance Manager, CFO, Driver, Operator User)
- **Client Accounts**: Shopee Express (SPX)
- **Service Categories**: 8 SPX categories (FM, Mega FM, MFM Shunting)

### Fleet Acquisition
- **Operators**: Subcontractor companies with bank details
- **Drivers**: Driver profiles with SPX driver IDs
- **Vehicles**: Vehicle inventory with plate numbers
- **Assignment History**: Driver-operator and vehicle-operator assignments with start/end dates
- **Fleet Inventory**: Client-specific vehicle tagging

### Trips & Operations
- **Trips**: Trip records with assignment status, POD status, call times
- **Trip Stops**: Pickup, SOC, Drop, Hub stops
- **Trip Events**: ARRIVED, DEPARTED events with GPS + photo proof
- **Trip Documents**: POD/runsheet, reimbursables, barcode cover sheets

### POD Workflow
- **States**: POD_NOT_UPLOADED → POD_UPLOADED_PENDING_REVIEW → POD_VERIFIED or POD_REJECTED_NEEDS_REUPLOAD
- **Verification**: Operations Account Coordinator can verify or reject with comments
- **Finance Gate**: Finance actions blocked until POD_VERIFIED

### Incidents
- **Trip Incidents**: Incident reporting with type, severity, status workflow
- **Incident Updates**: Timeline of incident status changes
- **Media**: Photo attachments for incidents

### Finance
- **Trip Finance**: Computation snapshots, reimbursables, billing/payout status
- **Route Rates**: Origin-destination rates with effective dates
- **Payout Batches**: Operator-specific batches with approval workflow
- **Cashbond**: ₱500 per driver per batch (cap ₱50,000)
- **Override Requests**: 30-day deadline override workflow

### Notifications
- **Notification Types**: Trip assigned, reminders, call-time alerts, POD status, incidents
- **Scheduling**: Hourly jobs for acceptance reminders, call-time reminders, coordinator alerts

## API Endpoints (Implemented)

### Authentication
- `POST /auth/login` - Login with email/password

### Fleet Acquisition
- `POST /fleet-acquisition/operators` - Create operator
- `GET /fleet-acquisition/operators` - List operators
- `POST /fleet-acquisition/drivers` - Create driver
- `GET /fleet-acquisition/drivers` - List drivers
- `POST /fleet-acquisition/vehicles` - Create vehicle
- `GET /fleet-acquisition/vehicles` - List vehicles

### Dispatch
- `POST /dispatch/trips` - Create trip
- `GET /dispatch/trips` - List trips
- `GET /dispatch/trips/:id` - Get trip details
- `PUT /dispatch/trips/:id/pod/verify` - Verify POD
- `PUT /dispatch/trips/:id/pod/reject` - Reject POD

### Finance
- `GET /finance/trips/scan/:internalRef` - Get trip by barcode (internal ref)
- `POST /finance/trips/:id/mark-doc-received` - Mark Finance Doc Received

## RBAC Enforcement

### Fleet Acquisition
- **Can Access**: Super Admin, Admin, Manager, Fleet Acquisition
- **Cannot Access**: Dispatch, Finance modules

### Operations Account Coordinator
- **Can Access**: Dispatch, Trips, Incidents
- **Can**: Create trips, verify/reject POD, monitor trips
- **Cannot Access**: Fleet Acquisition, Finance processing, Rates editing

### Finance Personnel
- **Can Access**: Finance, Trips (view), Incidents (view)
- **Can**: Scan trips, mark doc received, compute payouts
- **Cannot**: Verify POD, approve payouts

### Finance Manager
- **Can**: Approve payout batches (Level 1)

### CFO
- **Can**: Approve payout batches (final), approve override requests

## Web UI

### Implemented
- ✅ Login page
- ✅ Dashboard layout with sidebar and topbar
- ✅ Role-based navigation (sidebar filters by user role)
- ✅ Placeholder pages for all modules
- ✅ Brand colors and typography (Space Grotesk + Inter)
- ✅ Sky Blue theme (#0E86C7)

### UI Components
- Button (Primary, Secondary, Danger variants)
- Input (with focus states)
- Label
- Sidebar (role-filtered navigation)
- Topbar (search, notifications, user menu)

## Seed Data

Running `npm run prisma:seed` creates:
- Default tenant: "Ace Truckers Corp"
- Super Admin user: `admin@acetruckers.com` / `admin123`
- Shopee Express (SPX) client account
- 8 SPX service categories with default configurations

## Key Business Rules Implemented

1. **Operator Enforcement**: When assigning driver to trip, vehicle must belong to same operator
2. **POD Workflow**: Finance cannot process trips until POD is verified
3. **Assignment History**: Drivers and vehicles track operator assignments with dates
4. **RBAC**: Strict role-based access control with module-level restrictions

## Next Steps (To Complete Milestone 0-1)

1. **Driver Android App**:
   - React Native setup
   - Trip acceptance UI
   - Stop execution (ARRIVED/DEPARTED with GPS + photo)
   - POD upload
   - Offline queue

2. **Notification System**:
   - FCM integration
   - Hourly reminder scheduler
   - Call-time based reminder logic

3. **Complete Vertical Slice**:
   - End-to-end trip creation → driver acceptance → event submission → POD upload → verification → finance processing

## Development Commands

### Backend
```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

### Frontend
```bash
cd web
npm install
npm run dev
```

## Environment Setup

See `.env.example` files in `api/` and `web/` directories for required environment variables.

## Notes

- Prisma schema is shared between root `prisma/` and `api/prisma/` (copied for now)
- Logo files should be placed in `web/public/logos/` (horizontal and square versions)
- All timestamps use Asia/Manila timezone
- Business day calculations exclude weekends
