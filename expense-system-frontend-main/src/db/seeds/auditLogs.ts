import { db } from '@/db';
import { auditLogs } from '@/db/schema';

async function main() {
    const sampleAuditLogs = [
        {
            userId: 1,
            action: 'CREATE_EXPENSE',
            entityType: 'expense',
            entityId: 1,
            oldValue: null,
            newValue: {
                amount: 125.50,
                currency: 'USD',
                category: 'Travel',
                description: 'Business trip taxi fare',
                status: 'PENDING',
                paidBy: 'PERSONAL'
            },
            ipAddress: '192.168.1.45',
            createdAt: new Date('2024-01-15T09:30:00Z').toISOString(),
        },
        {
            userId: 3,
            action: 'UPDATE_EXPENSE',
            entityType: 'expense',
            entityId: 1,
            oldValue: {
                amount: 125.50,
                description: 'Business trip taxi fare',
                status: 'PENDING'
            },
            newValue: {
                amount: 125.50,
                description: 'Business trip taxi fare - updated with receipt',
                status: 'IN_PROGRESS'
            },
            ipAddress: '10.0.0.23',
            createdAt: new Date('2024-01-16T14:22:00Z').toISOString(),
        },
        {
            userId: 2,
            action: 'APPROVE_EXPENSE',
            entityType: 'expense',
            entityId: 1,
            oldValue: {
                status: 'IN_PROGRESS'
            },
            newValue: {
                status: 'APPROVED'
            },
            ipAddress: '192.168.1.67',
            createdAt: new Date('2024-01-17T11:45:00Z').toISOString(),
        },
        {
            userId: 4,
            action: 'CREATE_EXPENSE',
            entityType: 'expense',
            entityId: 2,
            oldValue: null,
            newValue: {
                amount: 89.99,
                currency: 'USD',
                category: 'Office Supplies',
                description: 'Printer paper and ink cartridges',
                status: 'PENDING',
                paidBy: 'COMPANY_CARD'
            },
            ipAddress: '10.0.0.45',
            createdAt: new Date('2024-01-20T16:10:00Z').toISOString(),
        },
        {
            userId: 2,
            action: 'REJECT_EXPENSE',
            entityType: 'expense',
            entityId: 3,
            oldValue: {
                status: 'PENDING'
            },
            newValue: {
                status: 'REJECTED'
            },
            ipAddress: '192.168.1.67',
            createdAt: new Date('2024-01-25T10:30:00Z').toISOString(),
        },
        {
            userId: 1,
            action: 'CREATE_USER',
            entityType: 'user',
            entityId: 5,
            oldValue: null,
            newValue: {
                name: 'Sarah Johnson',
                email: 'sarah.johnson@company.com',
                role: 'EMPLOYEE',
                managerId: 2,
                isActive: true
            },
            ipAddress: '192.168.1.10',
            createdAt: new Date('2024-02-01T13:20:00Z').toISOString(),
        },
        {
            userId: 1,
            action: 'UPDATE_USER',
            entityType: 'user',
            entityId: 3,
            oldValue: {
                role: 'EMPLOYEE',
                managerId: 2
            },
            newValue: {
                role: 'MANAGER',
                managerId: 1
            },
            ipAddress: '192.168.1.10',
            createdAt: new Date('2024-02-10T09:15:00Z').toISOString(),
        },
        {
            userId: 5,
            action: 'CREATE_EXPENSE',
            entityType: 'expense',
            entityId: 4,
            oldValue: null,
            newValue: {
                amount: 2350.00,
                currency: 'USD',
                category: 'Travel',
                description: 'Conference attendance - flight and hotel',
                status: 'PENDING',
                paidBy: 'PERSONAL'
            },
            ipAddress: '10.0.0.78',
            createdAt: new Date('2024-02-15T08:45:00Z').toISOString(),
        },
        {
            userId: 6,
            action: 'UPDATE_EXPENSE',
            entityType: 'expense',
            entityId: 2,
            oldValue: {
                status: 'PENDING',
                description: 'Printer paper and ink cartridges'
            },
            newValue: {
                status: 'IN_PROGRESS',
                description: 'Printer paper and ink cartridges - approved by manager'
            },
            ipAddress: '192.168.1.89',
            createdAt: new Date('2024-02-18T15:30:00Z').toISOString(),
        },
        {
            userId: 1,
            action: 'APPROVE_EXPENSE',
            entityType: 'expense',
            entityId: 4,
            oldValue: {
                status: 'IN_PROGRESS'
            },
            newValue: {
                status: 'APPROVED'
            },
            ipAddress: '192.168.1.10',
            createdAt: new Date('2024-02-20T12:00:00Z').toISOString(),
        },
        {
            userId: 7,
            action: 'CREATE_EXPENSE',
            entityType: 'expense',
            entityId: 5,
            oldValue: null,
            newValue: {
                amount: 45.25,
                currency: 'USD',
                category: 'Meals',
                description: 'Client lunch meeting',
                status: 'PENDING',
                paidBy: 'PERSONAL'
            },
            ipAddress: '10.0.0.134',
            createdAt: new Date('2024-03-05T12:30:00Z').toISOString(),
        },
        {
            userId: 1,
            action: 'UPDATE_USER',
            entityType: 'user',
            entityId: 4,
            oldValue: {
                isActive: true,
                role: 'EMPLOYEE'
            },
            newValue: {
                isActive: false,
                role: 'EMPLOYEE'
            },
            ipAddress: '192.168.1.10',
            createdAt: new Date('2024-03-10T16:45:00Z').toISOString(),
        },
        {
            userId: 8,
            action: 'CREATE_EXPENSE',
            entityType: 'expense',
            entityId: 6,
            oldValue: null,
            newValue: {
                amount: 299.99,
                currency: 'USD',
                category: 'Technology',
                description: 'Wireless keyboard and mouse set',
                status: 'PENDING',
                paidBy: 'COMPANY_CARD'
            },
            ipAddress: '192.168.1.156',
            createdAt: new Date('2024-03-15T10:20:00Z').toISOString(),
        },
        {
            userId: 3,
            action: 'APPROVE_EXPENSE',
            entityType: 'expense',
            entityId: 5,
            oldValue: {
                status: 'PENDING'
            },
            newValue: {
                status: 'APPROVED'
            },
            ipAddress: '10.0.0.23',
            createdAt: new Date('2024-03-16T14:10:00Z').toISOString(),
        },
        {
            userId: 2,
            action: 'REJECT_EXPENSE',
            entityType: 'expense',
            entityId: 6,
            oldValue: {
                status: 'PENDING',
                amount: 299.99
            },
            newValue: {
                status: 'REJECTED',
                amount: 299.99
            },
            ipAddress: '192.168.1.67',
            createdAt: new Date('2024-03-20T09:30:00Z').toISOString(),
        }
    ];

    await db.insert(auditLogs).values(sampleAuditLogs);
    
    console.log('✅ Audit logs seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});