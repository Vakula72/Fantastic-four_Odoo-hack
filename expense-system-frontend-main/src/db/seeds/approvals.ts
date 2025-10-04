import { db } from '@/db';
import { approvals } from '@/db/schema';

async function main() {
    const sampleApprovals = [
        {
            expenseId: 1,
            approverId: 2,
            workflowStep: 1,
            status: 'APPROVED',
            remarks: 'Approved for legitimate business lunch with client.',
            approvedAt: new Date('2024-01-16T10:30:00Z').toISOString(),
            createdAt: new Date('2024-01-16T08:00:00Z').toISOString(),
        },
        {
            expenseId: 2,
            approverId: 2,
            workflowStep: 1,
            status: 'REJECTED',
            remarks: 'Receipt missing. Please resubmit with proper documentation.',
            approvedAt: null,
            createdAt: new Date('2024-01-17T09:15:00Z').toISOString(),
        },
        {
            expenseId: 3,
            approverId: 3,
            workflowStep: 1,
            status: 'APPROVED',
            remarks: 'Conference attendance approved as part of professional development.',
            approvedAt: new Date('2024-01-18T14:20:00Z').toISOString(),
            createdAt: new Date('2024-01-18T11:45:00Z').toISOString(),
        },
        {
            expenseId: 4,
            approverId: 3,
            workflowStep: 1,
            status: 'PENDING',
            remarks: null,
            approvedAt: null,
            createdAt: new Date('2024-01-19T16:30:00Z').toISOString(),
        },
        {
            expenseId: 5,
            approverId: 2,
            workflowStep: 1,
            status: 'APPROVED',
            remarks: 'Office supplies expense approved.',
            approvedAt: new Date('2024-01-20T11:15:00Z').toISOString(),
            createdAt: new Date('2024-01-20T09:30:00Z').toISOString(),
        },
        {
            expenseId: 6,
            approverId: 3,
            workflowStep: 1,
            status: 'REJECTED',
            remarks: 'Amount exceeds company policy for meals. Please split into separate expenses.',
            approvedAt: null,
            createdAt: new Date('2024-01-21T13:45:00Z').toISOString(),
        },
        {
            expenseId: 7,
            approverId: 10,
            workflowStep: 1,
            status: 'APPROVED',
            remarks: 'Client meeting expenses approved.',
            approvedAt: new Date('2024-01-22T10:00:00Z').toISOString(),
            createdAt: new Date('2024-01-22T08:15:00Z').toISOString(),
        },
        {
            expenseId: 8,
            approverId: 10,
            workflowStep: 1,
            status: 'PENDING',
            remarks: null,
            approvedAt: null,
            createdAt: new Date('2024-01-23T14:20:00Z').toISOString(),
        },
        {
            expenseId: 9,
            approverId: 10,
            workflowStep: 1,
            status: 'APPROVED',
            remarks: 'Training materials expense approved for team development.',
            approvedAt: new Date('2024-01-24T12:30:00Z').toISOString(),
            createdAt: new Date('2024-01-24T10:45:00Z').toISOString(),
        },
        {
            expenseId: 10,
            approverId: 2,
            workflowStep: 1,
            status: 'PENDING',
            remarks: 'Reviewing expense details. Need additional information about the business purpose.',
            approvedAt: null,
            createdAt: new Date('2024-01-25T15:00:00Z').toISOString(),
        }
    ];

    await db.insert(approvals).values(sampleApprovals);
    
    console.log('✅ Approvals seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});