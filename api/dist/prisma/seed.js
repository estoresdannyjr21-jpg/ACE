"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    let tenant = await prisma.tenant.findFirst({
        where: { name: 'Ace Truckers Corp' },
    });
    if (!tenant) {
        tenant = await prisma.tenant.create({
            data: {
                name: 'Ace Truckers Corp',
            },
        });
    }
    console.log('✅ Created tenant:', tenant.name);
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@acetruckers.com' },
        update: {},
        create: {
            email: 'admin@acetruckers.com',
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            tenantId: tenant.id,
        },
    });
    console.log('✅ Created Super Admin:', superAdmin.email);
    const spxAccount = await prisma.client.upsert({
        where: { tenantId_code: { tenantId: tenant.id, code: 'SPX' } },
        update: { name: 'Shopee Express' },
        create: {
            tenantId: tenant.id,
            name: 'Shopee Express',
            code: 'SPX',
            status: 'ACTIVE',
        },
    });
    console.log('✅ Created client:', spxAccount.name);
    const segments = [
        { name: 'FM Oncall', code: 'FM_ONCALL', sortOrder: 1 },
        { name: 'FM Wetlease', code: 'FM_WETLEASE', sortOrder: 2 },
        { name: 'MFM Oncall', code: 'MFM_ONCALL', sortOrder: 3 },
    ];
    const segmentIdByCode = new Map();
    for (const seg of segments) {
        const segment = await prisma.serviceSegment.upsert({
            where: { clientAccountId_code: { clientAccountId: spxAccount.id, code: seg.code } },
            update: { name: seg.name, sortOrder: seg.sortOrder, status: 'ACTIVE' },
            create: {
                clientAccountId: spxAccount.id,
                name: seg.name,
                code: seg.code,
                sortOrder: seg.sortOrder,
                status: 'ACTIVE',
            },
        });
        segmentIdByCode.set(seg.code, segment.id);
        console.log(`✅ Service segment: ${segment.code}`);
    }
    const categories = [
        { name: 'SPX FM 4W Oncall', code: 'SPX_FM_4W_ONCALL', segment: 'FM_ONCALL', payoutTermsBusinessDays: 13, firstTripOnlyPayout: false },
        { name: 'SPX FM 6WCV Oncall', code: 'SPX_FM_6WCV_ONCALL', segment: 'FM_ONCALL', payoutTermsBusinessDays: 8, firstTripOnlyPayout: false },
        { name: 'SPX FM 10W Oncall', code: 'SPX_FM_10W_ONCALL', segment: 'FM_ONCALL', payoutTermsBusinessDays: 8, firstTripOnlyPayout: false },
        { name: 'SPX FM 4WCV Wetlease', code: 'SPX_FM_4WCV_WETLEASE', segment: 'FM_WETLEASE', payoutTermsBusinessDays: 13, firstTripOnlyPayout: true },
        { name: 'SPX FM 6WCV Wetlease', code: 'SPX_FM_6WCV_WETLEASE', segment: 'FM_WETLEASE', payoutTermsBusinessDays: 8, firstTripOnlyPayout: true },
        { name: 'SPX MEGA FM 6W', code: 'SPX_MEGA_FM_6W', segment: 'MFM_ONCALL', payoutTermsBusinessDays: 3, firstTripOnlyPayout: false },
        { name: 'SPX MEGA FM 10W', code: 'SPX_MEGA_FM_10W', segment: 'MFM_ONCALL', payoutTermsBusinessDays: 3, firstTripOnlyPayout: false },
        { name: 'SPX MFM Shunting 6W', code: 'SPX_MFM_SHUNTING_6W', segment: 'MFM_ONCALL', payoutTermsBusinessDays: 3, firstTripOnlyPayout: false },
    ];
    for (const cat of categories) {
        const serviceSegmentId = segmentIdByCode.get(cat.segment);
        const category = await prisma.serviceCategory.upsert({
            where: { clientAccountId_code: { clientAccountId: spxAccount.id, code: cat.code } },
            update: {
                name: cat.name,
                serviceSegmentId,
                payoutTermsBusinessDays: cat.payoutTermsBusinessDays,
                docSubmissionDay: 'Tuesday',
                cycleStartDay: 'Wednesday',
                firstTripOnlyPayout: cat.firstTripOnlyPayout,
            },
            create: {
                clientAccountId: spxAccount.id,
                serviceSegmentId,
                name: cat.name,
                code: cat.code,
                status: 'ACTIVE',
                payoutTermsBusinessDays: cat.payoutTermsBusinessDays,
                docSubmissionDay: 'Tuesday',
                cycleStartDay: 'Wednesday',
                excludeWeekends: true,
                subcontractorInvoiceDeadlineDays: 30,
                callTimeGraceMinutes: 15,
                firstTripOnlyPayout: cat.firstTripOnlyPayout,
            },
        });
        console.log(`✅ Created/updated service category: ${category.name} (${cat.payoutTermsBusinessDays} days payout terms)`);
    }
    const tripRequirements = [
        {
            code: 'POD_IMAGE',
            label: 'POD / Runsheet photo',
            kind: client_1.TripRequirementKind.DOCUMENT,
            docType: client_1.DocumentType.POD_RUNSHEET,
            sortOrder: 1,
            helpText: 'Photo of the signed runsheet / proof of delivery',
        },
        {
            code: 'WAYBILL_NUMBER',
            label: 'Waybill number',
            kind: client_1.TripRequirementKind.FIELD,
            docType: null,
            sortOrder: 2,
            helpText: 'Waybill number printed on the runsheet',
        },
        {
            code: 'SEAL_NUMBER',
            label: 'Seal number',
            kind: client_1.TripRequirementKind.FIELD,
            docType: null,
            sortOrder: 3,
            helpText: 'Seal number on the container door',
        },
    ];
    for (const req of tripRequirements) {
        await prisma.clientTripRequirement.upsert({
            where: { clientAccountId_code: { clientAccountId: spxAccount.id, code: req.code } },
            update: {
                label: req.label,
                kind: req.kind,
                docType: req.docType,
                sortOrder: req.sortOrder,
                helpText: req.helpText,
            },
            create: {
                tenantId: tenant.id,
                clientAccountId: spxAccount.id,
                code: req.code,
                label: req.label,
                kind: req.kind,
                docType: req.docType,
                required: true,
                sortOrder: req.sortOrder,
                status: 'ACTIVE',
                helpText: req.helpText,
            },
        });
        console.log(`✅ Trip requirement: ${req.code}`);
    }
    const wetleaseSeed = [
        { code: 'SPX_FM_4WCV_WETLEASE', client: 4100.0, subcontractor: 3100.0 },
        { code: 'SPX_FM_6WCV_WETLEASE', client: 4333.33, subcontractor: 3333.33 },
    ];
    const epochStart = new Date('2020-01-01T00:00:00.000Z');
    for (const wl of wetleaseSeed) {
        const wc = await prisma.serviceCategory.findFirst({
            where: { code: wl.code, clientAccountId: spxAccount.id },
        });
        if (!wc)
            continue;
        const existingOpen = await prisma.wetleaseFirstTripRate.findFirst({
            where: {
                tenantId: tenant.id,
                clientAccountId: spxAccount.id,
                serviceCategoryId: wc.id,
                effectiveEnd: null,
            },
        });
        if (existingOpen) {
            await prisma.wetleaseFirstTripRate.update({
                where: { id: existingOpen.id },
                data: {
                    firstTripClientBillAmount: wl.client,
                    firstTripPayoutVatable: wl.subcontractor,
                },
            });
        }
        else {
            await prisma.wetleaseFirstTripRate.create({
                data: {
                    tenantId: tenant.id,
                    clientAccountId: spxAccount.id,
                    serviceCategoryId: wc.id,
                    firstTripClientBillAmount: wl.client,
                    firstTripPayoutVatable: wl.subcontractor,
                    effectiveStart: epochStart,
                    effectiveEnd: null,
                },
            });
        }
        console.log(`✅ Wetlease first-trip: ${wl.code} client PHP ${wl.client} / subcontractor PHP ${wl.subcontractor} (from ${epochStart.toISOString().slice(0, 10)})`);
    }
    console.log('🎉 Seeding completed!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map