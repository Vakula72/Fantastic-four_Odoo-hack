"use client"

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface PendingApproval {
  id: number;
  expenseId: number;
  workflowStep: number;
  status: string;
  expense: {
    id: number;
    amount: number;
    currency: string;
    category: string;
    description: string;
    expenseDate: string;
  };
}

interface ApprovalInterfaceProps {
  approverId: number;
}

export function ApprovalInterface({ approverId }: ApprovalInterfaceProps) {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<Record<number, string>>({});

  const fetchPendingApprovals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/approvals?approverId=${approverId}&status=PENDING&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch approvals');
      
      const data = await response.json();
      setPendingApprovals(data);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, [approverId]);

  const handleApproval = async (approvalId: number, status: 'APPROVED' | 'REJECTED') => {
    setProcessingId(approvalId);
    try {
      const response = await fetch(`/api/approvals?id=${approvalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          remarks: remarks[approvalId] || ''
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update approval');
      }

      toast.success(`Expense ${status.toLowerCase()} successfully!`);
      
      // Remove from pending list
      setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
      
      // Clear remarks
      setRemarks(prev => {
        const newRemarks = { ...prev };
        delete newRemarks[approvalId];
        return newRemarks;
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to process approval');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No pending approvals</p>
          <p className="text-sm text-muted-foreground mt-2">
            All expenses have been reviewed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pendingApprovals.map((approval) => (
        <Card key={approval.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">
                  {approval.expense.currency} {approval.expense.amount.toFixed(2)}
                </CardTitle>
                <CardDescription className="mt-1">
                  {approval.expense.category} • {format(new Date(approval.expense.expenseDate), 'MMM d, yyyy')}
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                Step {approval.workflowStep}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{approval.expense.description}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`remarks-${approval.id}`}>Remarks (Optional)</Label>
              <Textarea
                id={`remarks-${approval.id}`}
                placeholder="Add any comments or reasons for your decision..."
                value={remarks[approval.id] || ''}
                onChange={(e) => setRemarks({ ...remarks, [approval.id]: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="default"
                onClick={() => handleApproval(approval.id, 'APPROVED')}
                disabled={processingId === approval.id}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={() => handleApproval(approval.id, 'REJECTED')}
                disabled={processingId === approval.id}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}