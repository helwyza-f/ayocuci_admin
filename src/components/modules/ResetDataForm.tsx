'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { resetDataService } from '@/services/reset-data-service';
import { ResetType, ResetReason, DeletedStats } from '@/types/reset-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

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

const RESET_TYPE_OPTIONS = [
  {
    value: 'full' as const,
    label: 'Reset Penuh',
    description:
      'Kembalikan outlet ke kondisi awal: transaksi, pelanggan, koin, addon, pegawai, dan data master default',
  },
  {
    value: 'transactions_only' as const,
    label: 'Hanya Transaksi',
    description: 'Hapus transaksi, tetapi profil pelanggan tetap disimpan',
  },
  {
    value: 'customers_only' as const,
    label: 'Hanya Pelanggan',
    description: 'Hapus profil pelanggan, tetapi riwayat transaksi tetap ada',
  },
];

const REASON_OPTIONS = [
  {
    value: 'trial_to_production' as const,
    label: 'Trial ke Produksi',
    description: 'Outlet berpindah dari masa trial ke penggunaan aktif',
  },
  {
    value: 'data_cleanup' as const,
    label: 'Bersihkan Data',
    description: 'Menghapus data percobaan atau data dummy',
  },
  {
    value: 'customer_request' as const,
    label: 'Permintaan Pelanggan',
    description: 'Reset diminta langsung oleh pelanggan',
  },
  {
    value: 'other' as const,
    label: 'Lainnya',
    description: 'Alasan lainnya',
  },
];

interface ResetDataFormProps {
  outletId: string;
  outletName: string;
  onSuccess?: () => void;
}

export function ResetDataForm({
  outletId,
  outletName,
  onSuccess,
}: ResetDataFormProps) {
  const [resetType, setResetType] = useState<ResetType>('full');
  const [reason, setReason] = useState<ResetReason>('trial_to_production');
  const [confirmed, setConfirmed] = useState(false);
  const [outletNameInput, setOutletNameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletedStats, setDeletedStats] = useState<DeletedStats | null>(null);

  const handleReset = async () => {
    if (outletNameInput !== outletName) {
      toast.error('Nama outlet tidak cocok');
      setError('Nama outlet tidak cocok');
      return;
    }

    if (!confirmed) {
      toast.error('Silakan konfirmasi bahwa tindakan ini permanen');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const confirmationCode = `RESET-${outletId.toUpperCase()}-${Date.now()}`;
      const response = await resetDataService.resetOutletData(outletId, {
        reset_type: resetType,
        reason,
        confirmation_code: confirmationCode,
      });

      if (response.data) {
        setSuccess(true);
        setDeletedStats(response.data.deleted_records);
        toast.success(`Reset data berhasil! ${response.data.deleted_records.orders} transaksi dihapus`);

        if (onSuccess) {
          // Delay callback to let user see success message
          setTimeout(onSuccess, 2000);
        }
      }
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Gagal mereset data');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success && deletedStats) {
    return (
      <Card className="border-l-4 border-green-500 bg-green-50 p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <h3 className="mb-3 text-lg font-semibold text-green-900">
              Reset Data Berhasil
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>
                <strong>Transaksi dihapus:</strong> {deletedStats.orders}
              </p>
              <p>
                <strong>Pelanggan dihapus:</strong> {deletedStats.customers}
              </p>
              <p>
                <strong>Pengeluaran dihapus:</strong> {deletedStats.expenses}
              </p>
              {deletedStats.detail_transaksi > 0 && (
                <p>
                  <strong>Detail transaksi:</strong> {deletedStats.detail_transaksi}
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-green-700">
              Cadangan data yang dihapus sudah disimpan untuk kebutuhan pemulihan.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Warning Card */}
      <Card className="border-l-4 border-red-500 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">⚠️ Penghapusan Permanen</h3>
            <p className="mt-1 text-sm text-red-800">
              Tindakan ini akan menghapus data operasional outlet secara permanen. Cadangan akan
              dibuat, tetapi data yang terhapus tidak bisa dipulihkan dengan mudah. Lanjutkan
              dengan hati-hati.
            </p>
          </div>
        </div>
      </Card>

      {/* Reset Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Jenis Reset</Label>
        <div className="space-y-2">
          {RESET_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-gray-50">
              <input
                type="radio"
                name="reset-type"
                value={option.value}
                checked={resetType === option.value}
                onChange={(e) => setResetType(e.target.value as ResetType)}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-gray-600">{option.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Reason Selection */}
      <div className="space-y-3">
        <Label htmlFor="reason" className="text-base font-semibold">
          Alasan Reset
        </Label>
        <Select value={reason} onValueChange={(value) => setReason(value as ResetReason)}>
          <SelectTrigger id="reason">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REASON_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Confirmation */}
      <Card className="bg-gray-50 p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="outlet-name" className="block text-sm font-medium text-gray-700">
              Ketik nama outlet untuk konfirmasi
            </Label>
            <Input
              id="outlet-name"
              type="text"
              placeholder={outletName}
              value={outletNameInput}
              onChange={(e) => setOutletNameInput(e.target.value)}
              className="mt-2 border-red-300 focus:border-red-500"
              autoComplete="off"
            />
            <p className="mt-1 text-xs text-gray-500">
              Harus sesuai: &quot;{outletName}&quot;
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
              Saya memahami bahwa tindakan ini permanen dan tidak dapat dibatalkan
            </Label>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-l-4 border-red-500 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {/* Action Button */}
      <Button
        onClick={handleReset}
        disabled={!confirmed || outletNameInput !== outletName || loading}
        variant="destructive"
        size="lg"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Memproses reset...
          </>
        ) : (
          'Konfirmasi Reset'
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Tindakan ini akan dicatat untuk kebutuhan audit
      </p>
    </div>
  );
}
