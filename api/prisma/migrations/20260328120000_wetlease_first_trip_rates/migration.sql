-- Wetlease: effective-dated first-trip payout amounts; same-day 2nd+ trips use 0 trip payout (reimbursables unchanged).

CREATE TABLE "wetlease_first_trip_rates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "serviceCategoryId" TEXT NOT NULL,
    "firstTripPayoutVatable" DECIMAL(14,4) NOT NULL,
    "effectiveStart" TIMESTAMP(3) NOT NULL,
    "effectiveEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wetlease_first_trip_rates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wetlease_first_trip_rates_tenantId_clientAccountId_serviceCategoryId_idx" ON "wetlease_first_trip_rates"("tenantId", "clientAccountId", "serviceCategoryId");

ALTER TABLE "wetlease_first_trip_rates" ADD CONSTRAINT "wetlease_first_trip_rates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wetlease_first_trip_rates" ADD CONSTRAINT "wetlease_first_trip_rates_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wetlease_first_trip_rates" ADD CONSTRAINT "wetlease_first_trip_rates_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
