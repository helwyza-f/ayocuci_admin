"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PermissionGate from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/user.service";

interface OwnerProfileDetail {
  name: string;
  email: string;
  nohp?: string;
  status: number;
}

interface OwnerDetailData {
  profile: OwnerProfileDetail;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybeAxiosError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return maybeAxiosError.response?.data?.message || maybeAxiosError.message || fallback;
  }

  return fallback;
}

export default function EditOwnerPage() {
  const params = useParams();
  const router = useRouter();
  const ownerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [data, setData] = useState<OwnerDetailData | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    nohp: "",
    password: "",
  });
  const [deleteReasonDetail, setDeleteReasonDetail] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await userService.getOwnerDetail(ownerId);
      if (res.status) {
        const detail = res.data as OwnerDetailData;
        setData(detail);
        setForm({
          name: detail.profile.name || "",
          email: detail.profile.email || "",
          nohp: detail.profile.nohp || "",
          password: "",
        });
      } else {
        toast.error(res.message || "Gagal memuat data owner");
      }
    } catch {
      toast.error("Gagal memuat data owner");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const canDelete = useMemo(() => {
    return confirmName.trim() === (data?.profile.name || "") && confirmed && !deleting;
  }, [confirmName, confirmed, data?.profile.name, deleting]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Nama dan email wajib diisi");
      return;
    }

    try {
      setSaving(true);
      const res = await userService.updateOwnerProfile(ownerId, {
        name: form.name.trim(),
        email: form.email.trim(),
        nohp: form.nohp.trim(),
        password: form.password.trim() || undefined,
      });

      if (res.status) {
        toast.success(res.message || "Profil owner berhasil diperbarui");
        router.push(`/users/${ownerId}`);
        router.refresh();
        return;
      }

      toast.error(res.message || "Gagal memperbarui profil owner");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperbarui profil owner"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;

    if (confirmName.trim() !== data.profile.name) {
      toast.error("Nama owner harus sama untuk melanjutkan");
      return;
    }

    if (!confirmed) {
      toast.error("Konfirmasi penghapusan terlebih dahulu");
      return;
    }

    try {
      setDeleting(true);
      const res = await userService.deleteOwner(ownerId, {
        reason: "deleted_by_admin",
        reason_detail: deleteReasonDetail.trim() || undefined,
      });

      if (res.status) {
        toast.success(res.message || "Owner berhasil dihapus");
        router.push("/users");
        router.refresh();
        return;
      }

      toast.error(res.message || "Gagal menghapus owner");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal menghapus owner"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Memuat data owner...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <ShieldAlert className="h-8 w-8 text-rose-500" />
        <p className="text-sm font-bold text-slate-900">Data owner tidak ditemukan</p>
        <Button variant="outline" onClick={() => router.push("/users")}>Kembali ke daftar owner</Button>
      </div>
    );
  }

  return (
    <PermissionGate module="users" action="update">
      <div className="space-y-6 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/users/${ownerId}`}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-500"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Manajemen Owner</p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Atur Profil Owner</h1>
              <p className="mt-1 text-sm text-slate-500">
                Ubah identitas login owner atau hapus akun beserta seluruh outlet dan data terkait.
              </p>
            </div>
          </div>
          <Link href={`/users/${ownerId}`}>
            <Button variant="outline" className="h-10 rounded-xl border-slate-200 bg-white text-xs font-bold uppercase tracking-widest">
              Kembali ke Detail
            </Button>
          </Link>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-none">
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Nama Owner</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama owner"
                  className="h-12 rounded-xl border-slate-200 text-sm font-semibold"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Email Login</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="owner@email.com"
                    className="h-12 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">No. HP</Label>
                  <Input
                    value={form.nohp}
                    onChange={(e) => setForm((prev) => ({ ...prev, nohp: e.target.value }))}
                    placeholder="08xxxxxxxxxx"
                    className="h-12 rounded-xl border-slate-200 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Reset Password Baru</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Kosongkan jika tidak diubah"
                  className="h-12 rounded-xl border-slate-200 text-sm font-semibold"
                />
                <p className="text-xs text-slate-400">Password hanya diisi jika admin perlu mengganti akses login owner.</p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
                <Link href={`/users/${ownerId}`}>
                  <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white px-5 text-xs font-bold uppercase tracking-widest">
                    Batal
                  </Button>
                </Link>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 rounded-xl bg-primary px-5 text-xs font-bold uppercase tracking-widest text-white hover:bg-primary/90"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </div>
          </Card>

          <PermissionGate module="users" action="delete">
            <Card className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 shadow-none">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-rose-100 p-3">
                  <Trash2 className="h-5 w-5 text-rose-600" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-black text-rose-900">Hapus Owner</h2>
                  <p className="text-sm leading-6 text-rose-800">
                    Penghapusan ini bersifat permanen. Seluruh outlet, pegawai, transaksi, top up, ledger koin,
                    referral, dan data lain yang dimiliki owner ini akan ikut dihapus.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-rose-200 bg-white p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-400">Owner Target</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{data.profile.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <Mail className="h-4 w-4" />
                    {data.profile.email}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-400">Catatan Admin</Label>
                  <Input
                    value={deleteReasonDetail}
                    onChange={(e) => setDeleteReasonDetail(e.target.value)}
                    placeholder="Opsional, misal duplikat akun atau permintaan owner"
                    className="h-12 rounded-xl border-rose-200 bg-white text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.24em] text-rose-400">
                    Ketik nama owner untuk konfirmasi
                  </Label>
                  <Input
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={data.profile.name}
                    className="h-12 rounded-xl border-rose-200 bg-white text-sm font-semibold"
                  />
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-white p-4">
                  <Checkbox
                    id="confirm-delete-owner"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked === true)}
                  />
                  <Label htmlFor="confirm-delete-owner" className="text-sm leading-6 text-slate-700">
                    Saya memahami bahwa penghapusan owner ini permanen dan seluruh data terkait tidak dapat dipulihkan.
                  </Label>
                </div>

                <Button
                  variant="destructive"
                  disabled={!canDelete}
                  onClick={handleDelete}
                  className="h-12 w-full rounded-xl bg-rose-600 text-xs font-bold uppercase tracking-widest text-white hover:bg-rose-700"
                >
                  {deleting ? "Menghapus Owner..." : "Hapus Owner Permanen"}
                </Button>
              </div>
            </Card>
          </PermissionGate>
        </div>
      </div>
    </PermissionGate>
  );
}
