import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Mock current user for demo purposes
// In production, this would validate JWT tokens or session cookies
export async function getCurrentUser(request?: NextRequest) {
  // For demo, return a mock user based on cookie or default to employee
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('mock_user_id');
  
  const mockUserId = userCookie?.value ? parseInt(userCookie.value) : 4;
  
  // Mock user data based on ID
  const mockUsers = {
    1: { id: 1, name: 'John Admin', email: 'admin@acme.com', role: 'ADMIN', companyId: 1 },
    2: { id: 2, name: 'Sarah Manager', email: 'manager1@acme.com', role: 'MANAGER', companyId: 1 },
    3: { id: 3, name: 'Mike Manager', email: 'manager2@acme.com', role: 'MANAGER', companyId: 1 },
    4: { id: 4, name: 'Alice Employee', email: 'employee1@acme.com', role: 'EMPLOYEE', companyId: 1, managerId: 2 },
  };
  
  return mockUsers[mockUserId as keyof typeof mockUsers] || mockUsers[4];
}

export function setMockUser(userId: number) {
  // This would be called from a login page
  // For now, it's just a helper
  return userId;
}