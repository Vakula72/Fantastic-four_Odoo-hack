import { db } from '@/db';
import { companies } from '@/db/schema';

async function main() {
    const sampleCompanies = [
        {
            name: 'Acme Corp',
            baseCurrency: 'USD',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
        {
            name: 'Global Tech',
            baseCurrency: 'EUR',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ];

    await db.insert(companies).values(sampleCompanies);
    
    console.log('✅ Companies seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});