-- Separate client billing (AR) snapshot from subcontractor vatable base (AP) in trip_finance.
ALTER TABLE "trip_finance" ADD COLUMN "clientBillAmount" DECIMAL(12,2);

-- Wetlease: first-trip amount billed to client vs paid to subcontractor (same effective window).
ALTER TABLE "wetlease_first_trip_rates" ADD COLUMN "firstTripClientBillAmount" DECIMAL(14,4);

-- Backfill: existing rows stored only subcontractor-sized amounts in firstTripPayoutVatable (previously conflated with client). Copy to client bill; set known SPX wetlease subcontractor defaults.
UPDATE "wetlease_first_trip_rates" AS w
SET
  "firstTripClientBillAmount" = w."firstTripPayoutVatable",
  "firstTripPayoutVatable" = CASE c.code
    WHEN 'SPX_FM_4WCV_WETLEASE' THEN 3100.0
    WHEN 'SPX_FM_6WCV_WETLEASE' THEN 3333.33
    ELSE w."firstTripPayoutVatable"
  END
FROM "service_categories" AS c
WHERE w."serviceCategoryId" = c.id;
