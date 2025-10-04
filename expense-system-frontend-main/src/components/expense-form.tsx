"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CATEGORIES = [
  'Travel',
  'Meals & Entertainment',
  'Office Supplies',
  'Software & Tools',
  'Client Entertainment',
  'Utilities',
  'Marketing',
  'Training & Development'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

interface ExpenseFormProps {
  userId: number;
  onSuccess?: () => void;
}

export function ExpenseForm({ userId, onSuccess }: ExpenseFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    description: '',
    paidBy: 'PERSONAL'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast.error('Please select an expense date');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          category: formData.category,
          description: formData.description,
          expenseDate: date.toISOString(),
          paidBy: formData.paidBy
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit expense');
      }

      toast.success('Expense submitted successfully!');
      
      // Reset form
      setFormData({
        amount: '',
        currency: 'USD',
        category: '',
        description: '',
        paidBy: 'PERSONAL'
      });
      setDate(undefined);
      
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit expense');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency *</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr} value={curr}>{curr}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })} required>
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Expense Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paidBy">Paid By *</Label>
          <Select value={formData.paidBy} onValueChange={(value) => setFormData({ ...formData, paidBy: value })}>
            <SelectTrigger id="paidBy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERSONAL">Personal Card</SelectItem>
              <SelectItem value="COMPANY_CARD">Company Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt">Receipt (Optional)</Label>
          <div className="flex items-center gap-2">
            <Input id="receipt" type="file" accept="image/*,.pdf" className="flex-1" />
            <Button type="button" variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your expense..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => {
          setFormData({
            amount: '',
            currency: 'USD',
            category: '',
            description: '',
            paidBy: 'PERSONAL'
          });
          setDate(undefined);
        }}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Expense'}
        </Button>
      </div>
    </form>
  );
}