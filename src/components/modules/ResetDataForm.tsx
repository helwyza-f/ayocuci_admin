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

const RESET_TYPE_OPTIONS = [
  {
    value: 'full' as const,
    label: 'Full Reset',
    description:
      'Reset outlet ke state awal: transaksi, pelanggan, koin, addon, pegawai, dan master data default',
  },
  {
    value: 'transactions_only' as const,
    label: 'Transactions Only',
    description: 'Delete orders but keep customer profiles',
  },
  {
    value: 'customers_only' as const,
    label: 'Customers Only',
    description: 'Delete customer profiles but keep order history',
  },
];

const REASON_OPTIONS = [
  {
    value: 'trial_to_production' as const,
    label: 'Trial to Production',
    description: 'Customer transitioning from trial to paid plan',
  },
  {
    value: 'data_cleanup' as const,
    label: 'Data Cleanup',
    description: 'Removing test/dummy data',
  },
  {
    value: 'customer_request' as const,
    label: 'Customer Request',
    description: 'Customer requested data reset',
  },
  {
    value: 'other' as const,
    label: 'Other',
    description: 'Other reason',
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
      toast.error('Outlet name does not match');
      setError('Outlet name does not match');
      return;
    }

    if (!confirmed) {
      toast.error('Please confirm that you understand this action is permanent');
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
        toast.success(`Data reset successful! ${response.data.deleted_records.orders} orders deleted`);

        if (onSuccess) {
          // Delay callback to let user see success message
          setTimeout(onSuccess, 2000);
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reset data';
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
              Data Reset Completed Successfully
            </h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>
                <strong>Orders deleted:</strong> {deletedStats.orders}
              </p>
              <p>
                <strong>Customers deleted:</strong> {deletedStats.customers}
              </p>
              <p>
                <strong>Expenses deleted:</strong> {deletedStats.expenses}
              </p>
              {deletedStats.detail_transaksi > 0 && (
                <p>
                  <strong>Transaction details:</strong> {deletedStats.detail_transaksi}
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-green-700">
              A backup of the deleted data has been saved for recovery purposes.
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
            <h3 className="font-semibold text-red-900">⚠️ Permanent Action</h3>
            <p className="mt-1 text-sm text-red-800">
              This action will permanently delete operational data from this outlet. A backup
              will be created, but deleted data cannot be easily restored. Proceed with caution.
            </p>
          </div>
        </div>
      </Card>

      {/* Reset Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Reset Type</Label>
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
          Reason for Reset
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
              Type outlet name to confirm
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
            <p className="mt-1 text-xs text-gray-500">Must match: "{outletName}"</p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">
              I understand this action is permanent and cannot be undone
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
            Resetting data...
          </>
        ) : (
          'Confirm Reset'
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        This operation will be logged for audit purposes
      </p>
    </div>
  );
}
