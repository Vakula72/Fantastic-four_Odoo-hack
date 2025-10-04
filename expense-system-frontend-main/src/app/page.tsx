"use client"

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleSwitcher } from '@/components/role-switcher';
import { StatsCards } from '@/components/stats-cards';
import { ExpenseForm } from '@/components/expense-form';
import { ExpenseList } from '@/components/expense-list';
import { ApprovalInterface } from '@/components/approval-interface';
import { UserManagement } from '@/components/user-management';
import { Toaster } from '@/components/ui/sonner';
import { LayoutDashboard, FileText, CheckSquare, Users, Settings } from 'lucide-react';

const DEMO_USERS = {
  1: { id: 1, name: 'John Admin', role: 'ADMIN' as const, companyId: 1 },
  2: { id: 2, name: 'Sarah Manager', role: 'MANAGER' as const, companyId: 1 },
  3: { id: 3, name: 'Mike Manager', role: 'MANAGER' as const, companyId: 1 },
  4: { id: 4, name: 'Alice Employee', role: 'EMPLOYEE' as const, companyId: 1 },
};

export default function ExpenseManagementDashboard() {
  const [currentUserId, setCurrentUserId] = useState(4);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const currentUser = DEMO_USERS[currentUserId as keyof typeof DEMO_USERS];

  const handleExpenseSubmit = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Expense Management System</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track and manage expenses with approval workflows
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-semibold">{currentUser.name}</div>
                <div className="text-sm text-muted-foreground">{currentUser.role}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Demo Role Switcher */}
        <RoleSwitcher 
          currentUserId={currentUserId} 
          onUserChange={setCurrentUserId} 
        />

        {/* Stats Cards */}
        <StatsCards 
          userId={currentUser.role === 'EMPLOYEE' ? currentUser.id : undefined} 
          role={currentUser.role} 
          key={`stats-${refreshTrigger}`}
        />

        {/* Tabs based on role */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <FileText className="h-4 w-4 mr-2" />
              My Expenses
            </TabsTrigger>
            {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
              <TabsTrigger value="approvals">
                <CheckSquare className="h-4 w-4 mr-2" />
                Approvals
              </TabsTrigger>
            )}
            {currentUser.role === 'ADMIN' && (
              <>
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Submit New Expense</CardTitle>
                  <CardDescription>
                    Create a new expense report for approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseForm 
                    userId={currentUser.id} 
                    onSuccess={handleExpenseSubmit}
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                    <CardDescription>Overview of your expense activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <span className="text-2xl font-bold">$2,450.00</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: '65%' }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      65% of monthly budget used
                    </p>
                  </CardContent>
                </Card>

                {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Approvals</CardTitle>
                      <CardDescription>Expenses waiting for your review</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <div className="text-4xl font-bold text-primary">3</div>
                        <p className="text-sm text-muted-foreground mt-2">
                          Items require attention
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* My Expenses Tab */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentUser.role === 'EMPLOYEE' ? 'My Expenses' : 'All Expenses'}
                </CardTitle>
                <CardDescription>
                  {currentUser.role === 'EMPLOYEE' 
                    ? 'View and track your submitted expenses'
                    : 'View and manage all company expenses'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExpenseList 
                  userId={currentUser.role === 'EMPLOYEE' ? currentUser.id : undefined}
                  role={currentUser.role}
                  key={`list-${refreshTrigger}`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab (Manager/Admin) */}
          {(currentUser.role === 'MANAGER' || currentUser.role === 'ADMIN') && (
            <TabsContent value="approvals">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Approvals</CardTitle>
                  <CardDescription>
                    Review and approve or reject expense submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ApprovalInterface approverId={currentUser.id} />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* User Management Tab (Admin only) */}
          {currentUser.role === 'ADMIN' && (
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>
          )}

          {/* Settings Tab (Admin only) */}
          {currentUser.role === 'ADMIN' && (
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Company Settings</CardTitle>
                  <CardDescription>
                    Manage company-wide expense policies and workflows
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Approval Workflow</h3>
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Manager Approval Required</div>
                          <div className="text-sm text-muted-foreground">
                            All expenses must be approved by direct manager
                          </div>
                        </div>
                        <div className="text-green-600 font-semibold">Active</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Expense Categories</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        'Travel',
                        'Meals & Entertainment',
                        'Office Supplies',
                        'Software & Tools',
                        'Client Entertainment',
                        'Utilities',
                        'Marketing',
                        'Training & Development'
                      ].map((category) => (
                        <div key={category} className="border rounded-lg p-3 text-sm">
                          {category}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Company Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Company Name</span>
                        <span className="font-medium">Acme Corp</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Base Currency</span>
                        <span className="font-medium">USD</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Total Employees</span>
                        <span className="font-medium">13</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6 bg-card">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Expense Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}