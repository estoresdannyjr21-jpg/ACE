-- Master data refactor: clients own service segments; segments own service categories;
-- operational + financial rules become per-category data; trip requirements become per-client data.

-- ============================================
-- 1) Enums
-- ============================================
CREATE TYPE "TripRequirementKind" AS ENUM ('DOCUMENT', 'FIELD');
CREATE TYPE "TripCompletionSource" AS ENUM ('DRIVER', 'COORDINATOR', 'ADMIN_FORCE');

-- ============================================
-- 2) Client codes are the FK target for rate / AR uploads, so they must be unique per tenant
-- ============================================
CREATE UNIQUE INDEX "client_accounts_tenantId_code_key" ON "client_accounts"("tenantId", "code");

-- ============================================
-- 3) Service segments (new master data layer between client and category)
-- ============================================
CREATE TABLE "service_segments" (
    "id" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_segments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "service_segments_clientAccountId_code_key" ON "service_segments"("clientAccountId", "code");

ALTER TABLE "service_segments"
    ADD CONSTRAINT "service_segments_clientAccountId_fkey"
    FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: derive the batching segments that were previously hardcoded
-- (FM_ONCALL / FM_WETLEASE / MFM_ONCALL) from existing category codes.
INSERT INTO "service_segments" ("id", "clientAccountId", "name", "code", "sortOrder", "status", "createdAt", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text || d."clientAccountId" || d.seg_code),
    d."clientAccountId",
    replace(d.seg_code, '_', ' '),
    d.seg_code,
    0,
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT
        c."clientAccountId",
        CASE
            WHEN c."code" LIKE '%WETLEASE%' THEN 'FM_WETLEASE'
            WHEN c."segmentType" = 'FM' THEN 'FM_ONCALL'
            WHEN c."segmentType" IN ('MEGA_FM', 'MFM_SHUNTING') THEN 'MFM_ONCALL'
            ELSE c."segmentType"
        END AS seg_code
    FROM "service_categories" c
) d;

-- ============================================
-- 4) Service categories: segment FK + configurable rules
-- ============================================
ALTER TABLE "service_categories" ADD COLUMN "serviceSegmentId" TEXT;

UPDATE "service_categories" c
SET "serviceSegmentId" = s."id"
FROM "service_segments" s
WHERE s."clientAccountId" = c."clientAccountId"
  AND s."code" = CASE
        WHEN c."code" LIKE '%WETLEASE%' THEN 'FM_WETLEASE'
        WHEN c."segmentType" = 'FM' THEN 'FM_ONCALL'
        WHEN c."segmentType" IN ('MEGA_FM', 'MFM_SHUNTING') THEN 'MFM_ONCALL'
        ELSE c."segmentType"
    END;

ALTER TABLE "service_categories" ALTER COLUMN "serviceSegmentId" SET NOT NULL;

ALTER TABLE "service_categories"
    ADD CONSTRAINT "service_categories_serviceSegmentId_fkey"
    FOREIGN KEY ("serviceSegmentId") REFERENCES "service_segments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "service_categories"
    ADD COLUMN "payoutTermsBusinessDays" INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN "docSubmissionDay" TEXT NOT NULL DEFAULT 'Tuesday',
    ADD COLUMN "cycleStartDay" TEXT NOT NULL DEFAULT 'Wednesday',
    ADD COLUMN "excludeWeekends" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "subcontractorInvoiceDeadlineDays" INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN "callTimeGraceMinutes" INTEGER NOT NULL DEFAULT 15,
    ADD COLUMN "vatRate" DECIMAL(6,4) NOT NULL DEFAULT 1.12,
    ADD COLUMN "adminFeePercent" DECIMAL(6,4) NOT NULL DEFAULT 0.02,
    ADD COLUMN "withholdingPercent" DECIMAL(6,4) NOT NULL DEFAULT 0.02,
    ADD COLUMN "firstTripOnlyPayout" BOOLEAN NOT NULL DEFAULT false;

-- Carry over the per-category config rows before dropping the table
UPDATE "service_categories" c
SET
    "payoutTermsBusinessDays" = cfg."payoutTermsBusinessDays",
    "docSubmissionDay" = cfg."docSubmissionDay",
    "cycleStartDay" = cfg."cycleStartDay",
    "excludeWeekends" = cfg."excludeWeekends",
    "subcontractorInvoiceDeadlineDays" = cfg."subcontractorInvoiceDeadlineDays",
    "callTimeGraceMinutes" = cfg."callTimeGraceMinutes"
FROM "client_service_configs" cfg
WHERE cfg."serviceCategoryId" = c."id";

-- Wetlease first-trip-only payout was a hardcoded category-code set
UPDATE "service_categories" SET "firstTripOnlyPayout" = true WHERE "code" LIKE '%WETLEASE%';

DROP TABLE "client_service_configs";

ALTER TABLE "service_categories" DROP COLUMN "segmentType";

CREATE UNIQUE INDEX "service_categories_clientAccountId_code_key" ON "service_categories"("clientAccountId", "code");

-- ============================================
-- 5) Dynamic trip requirements
-- ============================================
CREATE TABLE "client_trip_requirements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "serviceCategoryId" TEXT,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "TripRequirementKind" NOT NULL,
    "docType" "DocumentType",
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "helpText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_trip_requirements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "client_trip_requirements_clientAccountId_code_key" ON "client_trip_requirements"("clientAccountId", "code");
CREATE INDEX "client_trip_requirements_tenantId_clientAccountId_status_idx" ON "client_trip_requirements"("tenantId", "clientAccountId", "status");

ALTER TABLE "client_trip_requirements"
    ADD CONSTRAINT "client_trip_requirements_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_trip_requirements"
    ADD CONSTRAINT "client_trip_requirements_clientAccountId_fkey"
    FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "client_trip_requirements"
    ADD CONSTRAINT "client_trip_requirements_serviceCategoryId_fkey"
    FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "trip_requirement_fulfillments" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "value" TEXT,
    "fileKey" TEXT,
    "source" "TripCompletionSource" NOT NULL DEFAULT 'DRIVER',
    "fulfilledByUserId" TEXT NOT NULL,
    "fulfilledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_requirement_fulfillments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "trip_requirement_fulfillments_tripId_requirementId_key" ON "trip_requirement_fulfillments"("tripId", "requirementId");
CREATE INDEX "trip_requirement_fulfillments_tripId_idx" ON "trip_requirement_fulfillments"("tripId");

ALTER TABLE "trip_requirement_fulfillments"
    ADD CONSTRAINT "trip_requirement_fulfillments_tripId_fkey"
    FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_requirement_fulfillments"
    ADD CONSTRAINT "trip_requirement_fulfillments_requirementId_fkey"
    FOREIGN KEY ("requirementId") REFERENCES "client_trip_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_requirement_fulfillments"
    ADD CONSTRAINT "trip_requirement_fulfillments_fulfilledByUserId_fkey"
    FOREIGN KEY ("fulfilledByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================
-- 6) Trip completion audit trail
-- ============================================
ALTER TABLE "trips"
    ADD COLUMN "completedAt" TIMESTAMP(3),
    ADD COLUMN "completedByUserId" TEXT,
    ADD COLUMN "completionSource" "TripCompletionSource",
    ADD COLUMN "forceCompletedReason" TEXT;

ALTER TABLE "trips"
    ADD CONSTRAINT "trips_completedByUserId_fkey"
    FOREIGN KEY ("completedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
