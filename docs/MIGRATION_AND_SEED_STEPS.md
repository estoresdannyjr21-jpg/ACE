# Migration and seed steps (payout schedule & schema)

Run these when your database is available (e.g. `DATABASE_URL` is set).

## 1. Apply schema changes

From the **api** directory:

```bash
cd api
npx prisma db push --schema ../prisma/schema.prisma
```

Or, if you use migrations:

```bash
npx prisma migrate dev --schema ../prisma/schema.prisma --name payout_release_schedule
```

This adds:

- **payout_batches:** `targetReleaseDate`, `held`, `releasedAt`
- **payout_batch_exclusions:** new table (`payoutBatchId`, `tripId`, `reason`)

## 2. Generate Prisma client

```bash
npx prisma generate --schema ../prisma/schema.prisma
```

## 3. Re-seed (recommended)

Updates service configs with correct payout terms (3 / 8 / 13 days) and doc submission / cycle:

```bash
npm run prisma:seed
```

Or:

```bash
npx ts-node prisma/seed.ts
```

Existing batches keep working; `targetReleaseDate` stays null for them. New batches will use the new flow.
