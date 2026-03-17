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
    let spxAccount = await prisma.clientAccount.findFirst({
        where: { code: 'SPX', tenantId: tenant.id },
    });
    if (!spxAccount) {
        spxAccount = await prisma.clientAccount.create({
            data: {
                tenantId: tenant.id,
                name: 'Shopee Express',
                code: 'SPX',
                status: 'ACTIVE',
            },
        });
    }
    console.log('✅ Created client account:', spxAccount.name);
    const categories = [
        { name: 'SPX FM 4W Oncall', code: 'SPX_FM_4W_ONCALL', segmentType: 'FM', payoutTermsBusinessDays: 13 },
        { name: 'SPX FM 6WCV Oncall', code: 'SPX_FM_6WCV_ONCALL', segmentType: 'FM', payoutTermsBusinessDays: 8 },
        { name: 'SPX FM 10W Oncall', code: 'SPX_FM_10W_ONCALL', segmentType: 'FM', payoutTermsBusinessDays: 8 },
        { name: 'SPX FM 4WCV Wetlease', code: 'SPX_FM_4WCV_WETLEASE', segmentType: 'FM', payoutTermsBusinessDays: 13 },
        { name: 'SPX FM 6WCV Wetlease', code: 'SPX_FM_6WCV_WETLEASE', segmentType: 'FM', payoutTermsBusinessDays: 8 },
        { name: 'SPX MEGA FM 6W', code: 'SPX_MEGA_FM_6W', segmentType: 'MEGA_FM', payoutTermsBusinessDays: 3 },
        { name: 'SPX MEGA FM 10W', code: 'SPX_MEGA_FM_10W', segmentType: 'MEGA_FM', payoutTermsBusinessDays: 3 },
        { name: 'SPX MFM Shunting 6W', code: 'SPX_MFM_SHUNTING_6W', segmentType: 'MFM_SHUNTING', payoutTermsBusinessDays: 3 },
    ];
    for (const cat of categories) {
        let category = await prisma.serviceCategory.findFirst({
            where: { code: cat.code, clientAccountId: spxAccount.id },
        });
        if (!category) {
            category = await prisma.serviceCategory.create({
                data: {
                    clientAccountId: spxAccount.id,
                    name: cat.name,
                    code: cat.code,
                    segmentType: cat.segmentType,
                    status: 'ACTIVE',
                },
            });
        }
        await prisma.clientServiceConfig.upsert({
            where: { serviceCategoryId: category.id },
            create: {
                clientAccountId: spxAccount.id,
                serviceCategoryId: category.id,
                payoutTermsBusinessDays: cat.payoutTermsBusinessDays,
                docSubmissionDay: 'Tuesday',
                cycleStartDay: 'Wednesday',
                excludeWeekends: true,
                subcontractorInvoiceDeadlineDays: 30,
                callTimeGraceMinutes: 15,
            },
            update: {
                payoutTermsBusinessDays: cat.payoutTermsBusinessDays,
                docSubmissionDay: 'Tuesday',
                cycleStartDay: 'Wednesday',
            },
        });
        console.log(`✅ Created/updated service category: ${category.name} (${cat.payoutTermsBusinessDays} days payout terms)`);
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