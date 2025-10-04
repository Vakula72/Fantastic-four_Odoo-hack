"use client"

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Eye, Filter, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Expense {
  id: number;
  amount: number;
  currency: string;
  category: string;
  description: string;
  expenseDate: string;
  status: string;
  paidBy: string;
  userName?: string;
}

interface ExpenseListProps {
  userId?: number;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  onViewDetails?: (expense: Expense) => void;
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  APPROVED: 'bg-green-500/10 text-green-700 dark:text-green-400',
  REJECTED: 'bg-red-500/10 text-red-700 dark:text-red-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
};

export function ExpenseList({ userId, role, onViewDetails }: ExpenseListProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (userId && role === 'EMPLOYEE') {
        params.append('userId', userId.toString());
      }
      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (categoryFilter !== 'ALL') {
        params.append('category', categoryFilter);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('limit', '50');
      params.append('sort', 'createdAt');
      params.append('order', 'desc');

      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [userId, statusFilter, categoryFilter, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="Travel">Travel</SelectItem>
            <SelectItem value="Meals & Entertainment">Meals & Entertainment</SelectItem>
            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
            <SelectItem value="Software & Tools">Software & Tools</SelectItem>
            <SelectItem value="Client Entertainment">Client Entertainment</SelectItem>
            <SelectItem value="Utilities">Utilities</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Training & Development">Training & Development</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {role !== 'EMPLOYEE' && <TableHead>Employee</TableHead>}
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={role !== 'EMPLOYEE' ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No expenses found
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(expense.expenseDate), 'MMM d, yyyy')}
                  </TableCell>
                  {role !== 'EMPLOYEE' && (
                    <TableCell>{expense.userName || 'Unknown'}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">{expense.category}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell className="font-semibold">
                    {expense.currency} {expense.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS]}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails?.(expense)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}