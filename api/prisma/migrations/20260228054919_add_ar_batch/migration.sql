-- AlterTable
ALTER TABLE "trip_finance" ADD COLUMN     "billingDispute" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billingDisputeReason" TEXT;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "clientTripRef" TEXT;

-- CreateTable
CREATE TABLE "ar_batches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientAccountId" TEXT NOT NULL,
    "serviceSegment" TEXT NOT NULL,
    "cutoffStartDate" TIMESTAMP(3) NOT NULL,
    "cutoffEndDate" TIMESTAMP(3) NOT NULL,
    "reverseBillingReceivedAt" TIMESTAMP(3),
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "paymentListReceivedAt" TIMESTAMP(3),
    "amountPaidFromClient" DECIMAL(12,2),
    "checkPickupDate" TIMESTAMP(3),
    "depositedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'REVERSE_BILLING_RECEIVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ar_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_batch_trips" (
    "id" TEXT NOT NULL,
    "arBatchId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_batch_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_batch_unmatched_lines" (
    "id" TEXT NOT NULL,
    "arBatchId" TEXT NOT NULL,
    "clientProvidedRef" TEXT NOT NULL,
    "ourInternalRef" TEXT,
    "serviceCategoryCode" TEXT,
    "runsheetDate" TIMESTAMP(3),
    "amountClient" DECIMAL(12,2),
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedByUserId" TEXT,

    CONSTRAINT "ar_batch_unmatched_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ar_batches_tenantId_clientAccountId_serviceSegment_cutoffSt_key" ON "ar_batches"("tenantId", "clientAccountId", "serviceSegment", "cutoffStartDate", "cutoffEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "ar_batch_trips_arBatchId_tripId_key" ON "ar_batch_trips"("arBatchId", "tripId");

-- AddForeignKey
ALTER TABLE "ar_batches" ADD CONSTRAINT "ar_batches_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_batches" ADD CONSTRAINT "ar_batches_clientAccountId_fkey" FOREIGN KEY ("clientAccountId") REFERENCES "client_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_batch_trips" ADD CONSTRAINT "ar_batch_trips_arBatchId_fkey" FOREIGN KEY ("arBatchId") REFERENCES "ar_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_batch_trips" ADD CONSTRAINT "ar_batch_trips_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_batch_unmatched_lines" ADD CONSTRAINT "ar_batch_unmatched_lines_arBatchId_fkey" FOREIGN KEY ("arBatchId") REFERENCES "ar_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
