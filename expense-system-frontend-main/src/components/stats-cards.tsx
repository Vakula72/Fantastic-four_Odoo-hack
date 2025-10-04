"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StatsCardsProps {
  userId?: number;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalAmount: number;
}

export function StatsCards({ userId, role }: StatsCardsProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams();
        if (userId && role === 'EMPLOYEE') {
          params.append('userId', userId.toString());
        }
        params.append('limit', '1000');

        const response = await fetch(`/api/expenses?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const expenses = await response.json();
        
        const calculated = {
          total: expenses.length,
          pending: expenses.filter((e: any) => e.status === 'PENDING').length,
          approved: expenses.filter((e: any) => e.status === 'APPROVED').length,
          rejected: expenses.filter((e: any) => e.status === 'REJECTED').length,
          totalAmount: expenses.reduce((sum: number, e: any) => sum + e.amount, 0)
        };

        setStats(calculated);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userId, role]);

  const cards = [
    {
      title: 'Total Expenses',
      value: stats.total,
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Approved',
      value: stats.approved,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Rejected',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-red-600'
    },
    {
      title: 'Total Amount',
      value: `$${stats.totalAmount.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}