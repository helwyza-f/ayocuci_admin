'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { tenantService } from '@/services/tenant.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface DeleteTenantActionProps {
  outletId: string;
  outletName: string;
  onDeleted?: () => void;
}

export function DeleteTenantAction({ outletId, outletName, onDeleted }: DeleteTenantActionProps) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canDelete = confirmName.trim() === outletName && confirmed && !loading;

  const handleDelete = async () => {
    if (confirmName.trim() !== outletName) {
      toast.error('Nama outlet harus sama untuk melanjutkan');
      return;
    }

    if (!confirmed) {
      toast.error('Konfirmasi penghapusan terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const response = await tenantService.deleteTenant(outletId);
      if (response?.status) {
        toast.success('Outlet berhasil dihapus');
        setOpen(false);
        onDeleted?.();
      } else {
        toast.error(response?.message || 'Gagal menghapus outlet');
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Gagal menghapus outlet'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-l-4 border-rose-500 bg-rose-50 p-5">
        <div className="flex items-start gap-3">
          <Trash2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
          <div className="space-y-1">
            <h3 className="font-semibold text-rose-900">Hapus Outlet</h3>
            <p className="text-sm text-rose-800">
              Tindakan ini akan menghapus outlet dan seluruh data operasionalnya secara permanen.
              Akun owner tidak dihapus, tetapi outlet ini tidak bisa dipulihkan setelah proses selesai.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="destructive"
          className="mt-4 w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Outlet
        </Button>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) {
            setConfirmName('');
            setConfirmed(false);
            setLoading(false);
          }
        }}
      >
        <DialogContent className="max-w-md overflow-hidden rounded-xl border-none bg-white p-0 shadow-2xl">
          <DialogTitle className="border-b border-rose-100 bg-rose-50 px-5 py-4 text-base font-bold text-rose-900">
            Konfirmasi Hapus Outlet
          </DialogTitle>

          <div className="space-y-5 p-5">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-rose-900">Penghapusan permanen</p>
                  <p className="text-sm text-rose-700">
                    Outlet <span className="font-semibold">{outletName}</span> akan dihapus beserta
                    transaksi, pelanggan, koin, addon, pegawai, dan data operasional terkait.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-outlet-name" className="text-sm font-medium text-slate-700">
                Ketik nama outlet untuk konfirmasi
              </Label>
              <Input
                id="delete-outlet-name"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={outletName}
                autoComplete="off"
                className="border-rose-200 focus:border-rose-500"
              />
              <p className="text-xs text-slate-500">Harus sesuai: &quot;{outletName}&quot;</p>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Checkbox
                id="delete-confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <Label htmlFor="delete-confirm" className="text-sm text-slate-700">
                Saya memahami bahwa tindakan ini permanen dan tidak dapat dibatalkan
              </Label>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={!canDelete}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  'Hapus Sekarang'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
