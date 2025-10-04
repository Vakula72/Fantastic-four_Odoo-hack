import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, companies } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single user by ID
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const user = await db.select({
        id: users.id,
        companyId: users.companyId,
        name: users.name,
        email: users.email,
        role: users.role,
        managerId: users.managerId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user[0]);
    }

    // List users with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const companyId = searchParams.get('companyId');
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select({
      id: users.id,
      companyId: users.companyId,
      name: users.name,
      email: users.email,
      role: users.role,
      managerId: users.managerId,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`)
        )
      );
    }

    if (companyId) {
      conditions.push(eq(users.companyId, parseInt(companyId)));
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(users.isActive, isActive === 'true'));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderFunc = order === 'asc' ? asc : desc;
    const sortField = sort === 'name' ? users.name :
                     sort === 'email' ? users.email :
                     sort === 'role' ? users.role :
                     sort === 'updatedAt' ? users.updatedAt :
                     users.createdAt;

    const results = await query
      .orderBy(orderFunc(sortField))
      .limit(limit)
      .offset(offset);

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
    const { name, email, passwordHash, role, companyId, managerId, isActive } = requestBody;

    // Validate required fields
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ 
        error: "Name is required and must be at least 2 characters",
        code: "INVALID_NAME" 
      }, { status: 400 });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ 
        error: "Valid email is required",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    if (!passwordHash) {
      return NextResponse.json({ 
        error: "Password hash is required",
        code: "MISSING_PASSWORD_HASH" 
      }, { status: 400 });
    }

    if (!role || !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
      return NextResponse.json({ 
        error: "Role must be ADMIN, MANAGER, or EMPLOYEE",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ 
        error: "Company ID is required",
        code: "MISSING_COMPANY_ID" 
      }, { status: 400 });
    }

    // Validate companyId exists
    const company = await db.select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (company.length === 0) {
      return NextResponse.json({ 
        error: "Company not found",
        code: "COMPANY_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate managerId if provided
    if (managerId) {
      const manager = await db.select()
        .from(users)
        .where(eq(users.id, managerId))
        .limit(1);

      if (manager.length === 0) {
        return NextResponse.json({ 
          error: "Manager not found",
          code: "MANAGER_NOT_FOUND" 
        }, { status: 400 });
      }

      // Validate manager hierarchy - managers can't report to employees
      const managerUser = manager[0];
      if (role === 'MANAGER' && managerUser.role === 'EMPLOYEE') {
        return NextResponse.json({ 
          error: "Managers cannot report to employees",
          code: "INVALID_HIERARCHY" 
        }, { status: 400 });
      }

      if (role === 'ADMIN' && (managerUser.role === 'EMPLOYEE' || managerUser.role === 'MANAGER')) {
        return NextResponse.json({ 
          error: "Admins cannot report to managers or employees",
          code: "INVALID_HIERARCHY" 
        }, { status: 400 });
      }
    }

    // Check email uniqueness
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    const newUser = await db.insert(users)
      .values({
        name: name.trim(),
        email: email.toLowerCase(),
        passwordHash,
        role,
        companyId,
        managerId: managerId || null,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning({
        id: users.id,
        companyId: users.companyId,
        name: users.name,
        email: users.email,
        role: users.role,
        managerId: users.managerId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }
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
    const { name, email, role, companyId, managerId, isActive } = requestBody;

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: any = { updatedAt: new Date().toISOString() };

    // Validate and update fields
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ 
          error: "Name must be at least 2 characters",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        return NextResponse.json({ 
          error: "Valid email is required",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }

      // Check email uniqueness (excluding current user)
      const existingEmail = await db.select()
        .from(users)
        .where(and(
          eq(users.email, email.toLowerCase()),
          eq(users.id, parseInt(id))
        ))
        .limit(1);

      if (existingEmail.length === 0) {
        const emailCheck = await db.select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);

        if (emailCheck.length > 0) {
          return NextResponse.json({ 
            error: "Email already exists",
            code: "EMAIL_EXISTS" 
          }, { status: 400 });
        }
      }

      updates.email = email.toLowerCase();
    }

    if (role !== undefined) {
      if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
        return NextResponse.json({ 
          error: "Role must be ADMIN, MANAGER, or EMPLOYEE",
          code: "INVALID_ROLE" 
        }, { status: 400 });
      }
      updates.role = role;
    }

    if (companyId !== undefined) {
      const company = await db.select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      if (company.length === 0) {
        return NextResponse.json({ 
          error: "Company not found",
          code: "COMPANY_NOT_FOUND" 
        }, { status: 400 });
      }
      updates.companyId = companyId;
    }

    if (managerId !== undefined) {
      if (managerId !== null) {
        const manager = await db.select()
          .from(users)
          .where(eq(users.id, managerId))
          .limit(1);

        if (manager.length === 0) {
          return NextResponse.json({ 
            error: "Manager not found",
            code: "MANAGER_NOT_FOUND" 
          }, { status: 400 });
        }

        // Validate manager hierarchy
        const managerUser = manager[0];
        const userRole = updates.role || existingUser[0].role;
        
        if (userRole === 'MANAGER' && managerUser.role === 'EMPLOYEE') {
          return NextResponse.json({ 
            error: "Managers cannot report to employees",
            code: "INVALID_HIERARCHY" 
          }, { status: 400 });
        }

        if (userRole === 'ADMIN' && (managerUser.role === 'EMPLOYEE' || managerUser.role === 'MANAGER')) {
          return NextResponse.json({ 
            error: "Admins cannot report to managers or employees",
            code: "INVALID_HIERARCHY" 
          }, { status: 400 });
        }
      }
      updates.managerId = managerId;
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    const updated = await db.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        companyId: users.companyId,
        name: users.name,
        email: users.email,
        role: users.role,
        managerId: users.managerId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    if (error.message?.includes('UNIQUE constraint failed: users.email')) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }
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

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deleted = await db.delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        companyId: users.companyId,
        name: users.name,
        email: users.email,
        role: users.role,
        managerId: users.managerId,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      });

    return NextResponse.json({
      message: "User deleted successfully",
      user: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}