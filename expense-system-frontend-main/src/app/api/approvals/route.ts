import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { approvals, expenses, users } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single approval by ID with expense and approver details
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const approval = await db.select({
        id: approvals.id,
        expenseId: approvals.expenseId,
        approverId: approvals.approverId,
        workflowStep: approvals.workflowStep,
        status: approvals.status,
        remarks: approvals.remarks,
        approvedAt: approvals.approvedAt,
        createdAt: approvals.createdAt,
        expense: {
          id: expenses.id,
          amount: expenses.amount,
          currency: expenses.currency,
          category: expenses.category,
          description: expenses.description,
          expenseDate: expenses.expenseDate,
          status: expenses.status
        },
        approver: {
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }
      })
      .from(approvals)
      .leftJoin(expenses, eq(approvals.expenseId, expenses.id))
      .leftJoin(users, eq(approvals.approverId, users.id))
      .where(eq(approvals.id, parseInt(id)))
      .limit(1);

      if (approval.length === 0) {
        return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
      }

      return NextResponse.json(approval[0]);
    }

    // List approvals with pagination and filters
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const expenseId = searchParams.get('expenseId');
    const approverId = searchParams.get('approverId');
    const status = searchParams.get('status');
    const workflowStep = searchParams.get('workflowStep');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select({
      id: approvals.id,
      expenseId: approvals.expenseId,
      approverId: approvals.approverId,
      workflowStep: approvals.workflowStep,
      status: approvals.status,
      remarks: approvals.remarks,
      approvedAt: approvals.approvedAt,
      createdAt: approvals.createdAt,
      expense: {
        id: expenses.id,
        amount: expenses.amount,
        currency: expenses.currency,
        category: expenses.category,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        status: expenses.status
      },
      approver: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
    .from(approvals)
    .leftJoin(expenses, eq(approvals.expenseId, expenses.id))
    .leftJoin(users, eq(approvals.approverId, users.id));

    // Build where conditions
    const conditions = [];
    
    if (expenseId) {
      conditions.push(eq(approvals.expenseId, parseInt(expenseId)));
    }
    
    if (approverId) {
      conditions.push(eq(approvals.approverId, parseInt(approverId)));
    }
    
    if (status) {
      conditions.push(eq(approvals.status, status));
    }
    
    if (workflowStep) {
      conditions.push(eq(approvals.workflowStep, parseInt(workflowStep)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = sort === 'createdAt' ? approvals.createdAt : 
                     sort === 'status' ? approvals.status :
                     sort === 'workflowStep' ? approvals.workflowStep :
                     approvals.createdAt;

    query = query.orderBy(order === 'asc' ? asc(sortField) : desc(sortField));

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const requestBody = await request.json();
    const { expenseId, approverId, workflowStep, status = 'PENDING', remarks } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!expenseId) {
      return NextResponse.json({ 
        error: "Expense ID is required",
        code: "MISSING_EXPENSE_ID" 
      }, { status: 400 });
    }

    if (!approverId) {
      return NextResponse.json({ 
        error: "Approver ID is required",
        code: "MISSING_APPROVER_ID" 
      }, { status: 400 });
    }

    if (!workflowStep || workflowStep <= 0) {
      return NextResponse.json({ 
        error: "Workflow step is required and must be a positive integer",
        code: "INVALID_WORKFLOW_STEP" 
      }, { status: 400 });
    }

    // Validate that expenseId exists
    const expense = await db.select().from(expenses).where(eq(expenses.id, parseInt(expenseId))).limit(1);
    if (expense.length === 0) {
      return NextResponse.json({ 
        error: "Expense not found",
        code: "EXPENSE_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate that approverId exists
    const approver = await db.select().from(users).where(eq(users.id, parseInt(approverId))).limit(1);
    if (approver.length === 0) {
      return NextResponse.json({ 
        error: "Approver not found",
        code: "APPROVER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Ensure approver cannot approve their own expenses
    if (expense[0].userId === parseInt(approverId)) {
      return NextResponse.json({ 
        error: "Approver cannot approve their own expenses",
        code: "SELF_APPROVAL_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate status
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be PENDING, APPROVED, or REJECTED",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    const insertData = {
      expenseId: parseInt(expenseId),
      approverId: parseInt(approverId),
      workflowStep: parseInt(workflowStep),
      status,
      remarks: remarks || null,
      approvedAt: status === 'APPROVED' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString()
    };

    const newApproval = await db.insert(approvals)
      .values(insertData)
      .returning();

    return NextResponse.json(newApproval[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { status, remarks, workflowStep } = requestBody;

    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Check if approval exists
    const existingApproval = await db.select()
      .from(approvals)
      .where(eq(approvals.id, parseInt(id)))
      .limit(1);

    if (existingApproval.length === 0) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    const currentApproval = existingApproval[0];

    // Validate status transitions - can only change from PENDING
    if (status && currentApproval.status !== 'PENDING') {
      return NextResponse.json({ 
        error: "Status can only be changed from PENDING",
        code: "INVALID_STATUS_TRANSITION" 
      }, { status: 400 });
    }

    // Validate status values
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ 
        error: "Status must be PENDING, APPROVED, or REJECTED",
        code: "INVALID_STATUS" 
      }, { status: 400 });
    }

    // Validate workflow step if provided
    if (workflowStep !== undefined && workflowStep <= 0) {
      return NextResponse.json({ 
        error: "Workflow step must be a positive integer",
        code: "INVALID_WORKFLOW_STEP" 
      }, { status: 400 });
    }

    const updates = {};

    if (status !== undefined) {
      updates.status = status;
      // Set approvedAt when status changes to APPROVED
      if (status === 'APPROVED') {
        updates.approvedAt = new Date().toISOString();
      }
    }

    if (remarks !== undefined) {
      updates.remarks = remarks;
    }

    if (workflowStep !== undefined) {
      updates.workflowStep = parseInt(workflowStep);
    }

    const updated = await db.update(approvals)
      .set(updates)
      .where(eq(approvals.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const deleted = await db.delete(approvals)
      .where(eq(approvals.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Approval deleted successfully',
      deletedApproval: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}