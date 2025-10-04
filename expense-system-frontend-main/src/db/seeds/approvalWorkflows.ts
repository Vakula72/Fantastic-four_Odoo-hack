import { db } from '@/db';
import { approvalWorkflows } from '@/db/schema';

async function main() {
    const sampleApprovalWorkflows = [
        {
            companyId: 1,
            name: 'Manager Approval Required',
            isManagerApprover: true,
            isActive: true,
            createdAt: new Date('2024-01-15').toISOString(),
        },
        {
            companyId: 2,
            name: 'Standard Approval Process',
            isManagerApprover: true,
            isActive: true,
            createdAt: new Date('2024-01-20').toISOString(),
        }
    ];

    await db.insert(approvalWorkflows).values(sampleApprovalWorkflows);
    
    console.log('✅ Approval workflows seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});