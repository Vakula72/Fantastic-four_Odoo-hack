"use client"

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users } from 'lucide-react';

interface User {
  id: number;
  name: string;
  role: string;
}

const DEMO_USERS: User[] = [
  { id: 1, name: 'John Admin', role: 'ADMIN' },
  { id: 2, name: 'Sarah Manager', role: 'MANAGER' },
  { id: 3, name: 'Mike Manager', role: 'MANAGER' },
  { id: 4, name: 'Alice Employee', role: 'EMPLOYEE' },
];

interface RoleSwitcherProps {
  currentUserId: number;
  onUserChange: (userId: number) => void;
}

export function RoleSwitcher({ currentUserId, onUserChange }: RoleSwitcherProps) {
  const currentUser = DEMO_USERS.find(u => u.id === currentUserId) || DEMO_USERS[3];

  return (
    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
      <Users className="h-5 w-5 text-muted-foreground" />
      <div className="flex-1 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Demo Mode - Switch User</Label>
        <Select 
          value={currentUserId.toString()} 
          onValueChange={(value) => onUserChange(parseInt(value))}
        >
          <SelectTrigger className="h-9">
            <SelectValue>
              {currentUser.name} ({currentUser.role})
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DEMO_USERS.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}