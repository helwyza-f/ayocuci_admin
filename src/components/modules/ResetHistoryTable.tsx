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

function getErrorMessage(err: unknown, fallback: string) {
  if (typeof err === 'object' && err !== null) {
    const maybeAxiosError = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return maybeAxiosError.response?.data?.message || maybeAxiosError.message || fallback;
  }

  return fallback;
}

interface ResetHistoryTableProps {
  outletId: string;
}

const RESET_TYPE_LABELS: Record<string, string> = {
  full: 'Reset Penuh',
  transactions_only: 'Hanya Transaksi',
  customers_only: 'Hanya Pelanggan',
};

const REASON_LABELS: Record<string, string> = {
  trial_to_production: 'Trial → Produksi',
  data_cleanup: 'Bersihkan Data',
  customer_request: 'Permintaan Pelanggan',
  other: 'Lainnya',
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
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Gagal memuat riwayat reset'));
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
        <p className="text-center text-sm text-gray-500">Belum ada riwayat reset</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal & Waktu</TableHead>
            <TableHead>Jenis Reset</TableHead>
            <TableHead>Alasan</TableHead>
            <TableHead className="text-right">Data Dihapus</TableHead>
            <TableHead className="text-right">Oleh</TableHead>
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
                  <p>Transaksi: <strong>{reset.deleted_stats.orders}</strong></p>
                  <p>Pelanggan: <strong>{reset.deleted_stats.customers}</strong></p>
                  <p>Pengeluaran: <strong>{reset.deleted_stats.expenses}</strong></p>
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
