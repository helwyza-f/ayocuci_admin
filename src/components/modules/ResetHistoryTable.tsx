'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { resetDataService } from '@/services/reset-data-service';
import { ResetBackup } from '@/types/reset-data';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface ResetHistoryTableProps {
  outletId: string;
}

const RESET_TYPE_LABELS: Record<string, string> = {
  full: 'Full Reset',
  transactions_only: 'Transactions Only',
  customers_only: 'Customers Only',
};

const REASON_LABELS: Record<string, string> = {
  trial_to_production: 'Trial → Production',
  data_cleanup: 'Data Cleanup',
  customer_request: 'Customer Request',
  other: 'Other',
};

export function ResetHistoryTable({ outletId }: ResetHistoryTableProps) {
  const [history, setHistory] = useState<ResetBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await resetDataService.getResetHistory(outletId, 10);
        setHistory(data);
      } catch (err: any) {
        setError('Failed to load reset history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [outletId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-red-500 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-sm text-gray-500">No reset history found</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Reset Type</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right">Records Deleted</TableHead>
            <TableHead className="text-right">By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {history.map((reset) => (
            <TableRow key={reset.id}>
              <TableCell className="font-medium">
                {format(new Date(reset.reset_at), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {RESET_TYPE_LABELS[reset.reset_type] || reset.reset_type}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {REASON_LABELS[reset.reason] || reset.reason}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1 text-xs">
                  <p>Orders: <strong>{reset.deleted_stats.orders}</strong></p>
                  <p>Customers: <strong>{reset.deleted_stats.customers}</strong></p>
                  <p>Expenses: <strong>{reset.deleted_stats.expenses}</strong></p>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-gray-600">
                {reset.actor_type === 'admin' ? 'Admin' : reset.actor_id}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
