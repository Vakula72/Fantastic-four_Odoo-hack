import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { expenses, users } from '@/db/schema';
import { eq, like, and, or, desc, asc, gte, lte } from 'drizzle-orm';

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'];
const VALID_CATEGORIES = [
  'Travel',
  'Meals & Entertainment', 
  'Office Supplies',
  'Software & Tools',
  'Client Entertainment',
  'Utilities',
  'Marketing',
  'Training & Development'
];
const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS'];
const VALID_PAID_BY = ['PERSONAL', 'COMPANY_CARD'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single expense with user details
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const expense = await db.select({
        id: expenses.id,
        userId: expenses.userId,
        amount: expenses.amount,
        currency: expenses.currency,
        category: expenses.category,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        paidBy: expenses.paidBy,
        status: expenses.status,
        submittedAt: expenses.submittedAt,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        userName: users.name,
        userEmail: users.email
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id))
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

      if (expense.length === 0) {
        return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
      }

      return NextResponse.json(expense[0]);
    } else {
      // List expenses with pagination and filters
      const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
      const offset = parseInt(searchParams.get('offset') || '0');
      const search = searchParams.get('search');
      const userIdFilter = searchParams.get('userId');
      const status = searchParams.get('status');
      const category = searchParams.get('category');
      const currency = searchParams.get('currency');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');
      const sort = searchParams.get('sort') || 'createdAt';
      const order = searchParams.get('order') || 'desc';

      let query = db.select({
        id: expenses.id,
        userId: expenses.userId,
        amount: expenses.amount,
        currency: expenses.currency,
        category: expenses.category,
        description: expenses.description,
        expenseDate: expenses.expenseDate,
        paidBy: expenses.paidBy,
        status: expenses.status,
        submittedAt: expenses.submittedAt,
        createdAt: expenses.createdAt,
        updatedAt: expenses.updatedAt,
        userName: users.name
      })
      .from(expenses)
      .leftJoin(users, eq(expenses.userId, users.id));

      const conditions = [];

      if (search) {
        conditions.push(like(expenses.description, `%${search}%`));
      }

      if (userIdFilter && !isNaN(parseInt(userIdFilter))) {
        conditions.push(eq(expenses.userId, parseInt(userIdFilter)));
      }

      if (status && VALID_STATUSES.includes(status)) {
        conditions.push(eq(expenses.status, status));
      }

      if (category && VALID_CATEGORIES.includes(category)) {
        conditions.push(eq(expenses.category, category));
      }

      if (currency && VALID_CURRENCIES.includes(currency)) {
        conditions.push(eq(expenses.currency, currency));
      }

      if (dateFrom) {
        conditions.push(gte(expenses.expenseDate, dateFrom));
      }

      if (dateTo) {
        conditions.push(lte(expenses.expenseDate, dateTo));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = sort === 'amount' ? expenses.amount :
                        sort === 'expenseDate' ? expenses.expenseDate :
                        sort === 'status' ? expenses.status :
                        expenses.createdAt;

      query = query.orderBy(order === 'asc' ? asc(sortColumn) : desc(sortColumn));

      const results = await query.limit(limit).offset(offset);

      return NextResponse.json(results);
    }
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { userId, amount, currency, category, description, expenseDate, paidBy } = requestBody;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ 
        error: "Amount is required",
        code: "MISSING_AMOUNT" 
      }, { status: 400 });
    }

    if (!currency) {
      return NextResponse.json({ 
        error: "Currency is required",
        code: "MISSING_CURRENCY" 
      }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ 
        error: "Category is required",
        code: "MISSING_CATEGORY" 
      }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ 
        error: "Description is required",
        code: "MISSING_DESCRIPTION" 
      }, { status: 400 });
    }

    if (!expenseDate) {
      return NextResponse.json({ 
        error: "Expense date is required",
        code: "MISSING_EXPENSE_DATE" 
      }, { status: 400 });
    }

    // Validate user exists
    const user = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ 
        error: "User not found",
        code: "USER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate amount is positive
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ 
        error: "Amount must be a positive number",
        code: "INVALID_AMOUNT" 
      }, { status: 400 });
    }

    // Validate currency
    if (!VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json({ 
        error: "Invalid currency code",
        code: "INVALID_CURRENCY" 
      }, { status: 400 });
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ 
        error: "Invalid category",
        code: "INVALID_CATEGORY" 
      }, { status: 400 });
    }

    // Validate description length
    if (description.trim().length < 5) {
      return NextResponse.json({ 
        error: "Description must be at least 5 characters long",
        code: "DESCRIPTION_TOO_SHORT" 
      }, { status: 400 });
    }

    // Validate expense date
    if (isNaN(Date.parse(expenseDate))) {
      return NextResponse.json({ 
        error: "Invalid expense date format",
        code: "INVALID_EXPENSE_DATE" 
      }, { status: 400 });
    }

    // Validate paidBy if provided
    if (paidBy && !VALID_PAID_BY.includes(paidBy)) {
      return NextResponse.json({ 
        error: "Invalid paid by value",
        code: "INVALID_PAID_BY" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newExpense = await db.insert(expenses).values({
      userId: parseInt(userId),
      amount: parseFloat(amount),
      currency: currency,
      category: category,
      description: description.trim(),
      expenseDate: expenseDate,
      paidBy: paidBy || 'PERSONAL',
      status: 'PENDING',
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    }).returning();

    return NextResponse.json(newExpense[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    const { amount, currency, category, description, expenseDate, paidBy } = requestBody;

    // Check if expense exists
    const existingExpense = await db.select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (existingExpense.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check if expense status allows updates
    if (existingExpense[0].status !== 'PENDING') {
      return NextResponse.json({ 
        error: "Only expenses with PENDING status can be updated",
        code: "UPDATE_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and update amount if provided
    if (amount !== undefined) {
      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return NextResponse.json({ 
          error: "Amount must be a positive number",
          code: "INVALID_AMOUNT" 
        }, { status: 400 });
      }
      updates.amount = parseFloat(amount);
    }

    // Validate and update currency if provided
    if (currency !== undefined) {
      if (!VALID_CURRENCIES.includes(currency)) {
        return NextResponse.json({ 
          error: "Invalid currency code",
          code: "INVALID_CURRENCY" 
        }, { status: 400 });
      }
      updates.currency = currency;
    }

    // Validate and update category if provided
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ 
          error: "Invalid category",
          code: "INVALID_CATEGORY" 
        }, { status: 400 });
      }
      updates.category = category;
    }

    // Validate and update description if provided
    if (description !== undefined) {
      if (description.trim().length < 5) {
        return NextResponse.json({ 
          error: "Description must be at least 5 characters long",
          code: "DESCRIPTION_TOO_SHORT" 
        }, { status: 400 });
      }
      updates.description = description.trim();
    }

    // Validate and update expense date if provided
    if (expenseDate !== undefined) {
      if (isNaN(Date.parse(expenseDate))) {
        return NextResponse.json({ 
          error: "Invalid expense date format",
          code: "INVALID_EXPENSE_DATE" 
        }, { status: 400 });
      }
      updates.expenseDate = expenseDate;
    }

    // Validate and update paidBy if provided
    if (paidBy !== undefined) {
      if (!VALID_PAID_BY.includes(paidBy)) {
        return NextResponse.json({ 
          error: "Invalid paid by value",
          code: "INVALID_PAID_BY" 
        }, { status: 400 });
      }
      updates.paidBy = paidBy;
    }

    const updated = await db.update(expenses)
      .set(updates)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if expense exists
    const existingExpense = await db.select()
      .from(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .limit(1);

    if (existingExpense.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check if expense status allows deletion
    if (existingExpense[0].status !== 'PENDING') {
      return NextResponse.json({ 
        error: "Only expenses with PENDING status can be deleted",
        code: "DELETE_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const deleted = await db.delete(expenses)
      .where(eq(expenses.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Expense deleted successfully',
      deleted: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}