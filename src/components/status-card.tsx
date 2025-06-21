'use client';
import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatusCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StatusCard({ title, icon, children, className }: StatusCardProps) {
  return (
    <Card className={cn('bg-card/80 backdrop-blur-sm', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium font-headline">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-body">{children}</div>
      </CardContent>
    </Card>
  );
}
