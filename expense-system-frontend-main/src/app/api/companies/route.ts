import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { companies } from '@/db/schema';
import { eq, like, desc, asc } from 'drizzle-orm';

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR'];

function validateCurrency(currency: string): boolean {
  return VALID_CURRENCIES.includes(currency.toUpperCase());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single company by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const company = await db.select({
        id: companies.id,
        name: companies.name,
        baseCurrency: companies.baseCurrency,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt
      })
      .from(companies)
      .where(eq(companies.id, parseInt(id)))
      .limit(1);

      if (company.length === 0) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }

      return NextResponse.json(company[0]);
    }

    // List companies with pagination and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select({
      id: companies.id,
      name: companies.name,
      baseCurrency: companies.baseCurrency,
      createdAt: companies.createdAt,
      updatedAt: companies.updatedAt
    }).from(companies);

    if (search) {
      query = query.where(like(companies.name, `%${search}%`));
    }

    // Apply sorting
    const sortColumn = sort === 'name' ? companies.name : 
                      sort === 'baseCurrency' ? companies.baseCurrency :
                      sort === 'updatedAt' ? companies.updatedAt :
                      companies.createdAt;
    
    query = order === 'asc' ? query.orderBy(asc(sortColumn)) : query.orderBy(desc(sortColumn));

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
    const requestBody = await request.json();
    const { name, baseCurrency } = requestBody;

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: "Company name is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    if (typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ 
        error: "Company name must be at least 2 characters long",
        code: "INVALID_NAME_LENGTH" 
      }, { status: 400 });
    }

    // Validate baseCurrency if provided
    const finalBaseCurrency = baseCurrency ? baseCurrency.toUpperCase() : 'USD';
    if (!validateCurrency(finalBaseCurrency)) {
      return NextResponse.json({ 
        error: "Invalid currency code. Must be one of: " + VALID_CURRENCIES.join(', '),
        code: "INVALID_CURRENCY" 
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const insertData = {
      name: name.trim(),
      baseCurrency: finalBaseCurrency,
      createdAt: now,
      updatedAt: now
    };

    const newCompany = await db.insert(companies)
      .values(insertData)
      .returning({
        id: companies.id,
        name: companies.name,
        baseCurrency: companies.baseCurrency,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt
      });

    return NextResponse.json(newCompany[0], { status: 201 });
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

    // Check if company exists
    const existingCompany = await db.select()
      .from(companies)
      .where(eq(companies.id, parseInt(id)))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const requestBody = await request.json();
    const { name, baseCurrency } = requestBody;

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate name if provided
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return NextResponse.json({ 
          error: "Company name must be at least 2 characters long",
          code: "INVALID_NAME_LENGTH" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    // Validate baseCurrency if provided
    if (baseCurrency !== undefined) {
      const normalizedCurrency = baseCurrency.toUpperCase();
      if (!validateCurrency(normalizedCurrency)) {
        return NextResponse.json({ 
          error: "Invalid currency code. Must be one of: " + VALID_CURRENCIES.join(', '),
          code: "INVALID_CURRENCY" 
        }, { status: 400 });
      }
      updates.baseCurrency = normalizedCurrency;
    }

    const updatedCompany = await db.update(companies)
      .set(updates)
      .where(eq(companies.id, parseInt(id)))
      .returning({
        id: companies.id,
        name: companies.name,
        baseCurrency: companies.baseCurrency,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt
      });

    return NextResponse.json(updatedCompany[0]);
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

    // Check if company exists
    const existingCompany = await db.select()
      .from(companies)
      .where(eq(companies.id, parseInt(id)))
      .limit(1);

    if (existingCompany.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const deletedCompany = await db.delete(companies)
      .where(eq(companies.id, parseInt(id)))
      .returning({
        id: companies.id,
        name: companies.name,
        baseCurrency: companies.baseCurrency,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt
      });

    return NextResponse.json({
      message: 'Company deleted successfully',
      deletedCompany: deletedCompany[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}