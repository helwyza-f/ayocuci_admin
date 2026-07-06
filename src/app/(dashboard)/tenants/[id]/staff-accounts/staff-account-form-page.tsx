"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck, UserCog } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { tenantService } from "@/services/tenant.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StaffRoleOption {
  id: string;
  nama: string;
}

interface StaffFormState {
  nama: string;
  email: string;
  nohp: string;
  role_id: string;
  password: string;
  status: number;
}

interface StaffAccountFormPageProps {
  outletId: string;
  staffId?: string;
}

const emptyForm: StaffFormState = {
  nama: "",
  email: "",
  nohp: "",
  role_id: "",
  password: "",
  status: 1,
};

export default function StaffAccountFormPage({
  outletId,
  staffId,
}: StaffAccountFormPageProps) {
  const isEdit = Boolean(staffId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [roles, setRoles] = useState<StaffRoleOption[]>([]);
  const [form, setForm] = useState<StaffFormState>(emptyForm);
  const [staffFound, setStaffFound] = useState(true);

  useEffect(() => {
    let mounted = true;

    tenantService
      .getTenantDetail(outletId)
      .then((res) => {
        if (!mounted) return;
        if (!res.status || !res.data) {
          throw new Error("Gagal memuat detail outlet");
        }

        const detail = res.data;
        const roleOptions: StaffRoleOption[] = detail.staff_roles || [];
        const staffAccounts: any[] = detail.staff_accounts || [];

        setTenantName(detail.profile?.ot_nama || outletId);
        setRoles(roleOptions);

        if (isEdit) {
          const current = staffAccounts.find((staff) => staff.id === staffId);
          if (!current) {
            setStaffFound(false);
            return;
          }

          setForm({
            nama: current.nama || "",
            email: current.email || "",
            nohp: current.nohp || "",
            role_id: current.role_id || roleOptions[0]?.id || "",
            password: "",
            status: Number(current.status) === 1 ? 1 : 0,
          });
          return;
        }

        setForm((prev) => ({
          ...prev,
          role_id: prev.role_id || roleOptions[0]?.id || "",
        }));
      })
      .catch((error: any) => {
        if (!mounted) return;
        toast.error(error?.message || "Gagal memuat form akun karyawan");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isEdit, outletId, staffId]);

  const selectedRoleName = useMemo(
    () => roles.find((role) => role.id === form.role_id)?.nama || "Belum dipilih",
    [roles, form.role_id]
  );

  const handleSubmit = async () => {
    if (!form.nama.trim() || !form.email.trim() || !form.role_id) {
      toast.error("Nama, email, dan role wajib diisi");
      return;
    }

    if (!isEdit && form.password.trim().length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nama: form.nama.trim(),
        email: form.email.trim(),
        nohp: form.nohp.trim(),
        role_id: form.role_id,
        status: form.status,
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      if (isEdit && staffId) {
        await api.put(`/tenants/${outletId}/staff-accounts/${staffId}`, payload);
        toast.success("Akun karyawan berhasil diperbarui");
      } else {
        await api.post(`/tenants/${outletId}/staff-accounts`, payload);
        toast.success("Akun karyawan berhasil dibuat");
      }

      window.location.href = `/tenants/${outletId}?tab=staff`;
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan akun karyawan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && !staffFound) {
    return (
      <div className="space-y-4 p-6">
        <Button asChild variant="outline" className="rounded-xl border-slate-200">
          <Link href={`/tenants/${outletId}?tab=staff`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Outlet
          </Link>
        </Button>
        <Card className="rounded-3xl border-slate-200 p-8">
          <h1 className="text-xl font-bold text-slate-900">Akun karyawan tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Data akun yang ingin diedit tidak tersedia di outlet ini.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <Link href={`/tenants/${outletId}?tab=staff`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Detail Outlet
            </Link>
          </Button>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <UserCog className="h-3.5 w-3.5" />
              Akun Karyawan Outlet
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900">
              {isEdit ? "Edit Akun Karyawan" : "Tambah Akun Karyawan"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {isEdit
                ? "Perbarui identitas login, role operasional, dan status akses akun pegawai."
                : "Buat akun pegawai baru untuk outlet ini. Akun akan dipakai saat login ke aplikasi operasional."}
            </p>
          </div>
        </div>
        <Badge className="h-fit w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 shadow-none">
          Outlet: {tenantName}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="rounded-[28px] border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-7 py-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Form Akun
            </div>
            <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900">
              {isEdit ? "Perbarui Data Pegawai" : "Lengkapi Data Pegawai"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pastikan role dan status login sesuai kebutuhan operasional outlet.
            </p>
          </div>

          <div className="space-y-5 p-7">
            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Nama Karyawan
              </label>
              <input
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={form.nama}
                onChange={(e) => setForm((prev) => ({ ...prev, nama: e.target.value }))}
                placeholder="Nama lengkap"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Email Login
                </label>
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="pegawai@outlet.com"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  No. HP
                </label>
                <input
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={form.nohp}
                  onChange={(e) => setForm((prev) => ({ ...prev, nohp: e.target.value }))}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Role Outlet
                </label>
                <select
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={form.role_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, role_id: e.target.value }))}
                >
                  <option value="">Pilih role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Status Akun
                </label>
                <select
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  value={String(form.status)}
                  onChange={(e) => setForm((prev) => ({ ...prev, status: Number(e.target.value) }))}
                >
                  <option value="1">Aktif</option>
                  <option value="0">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {isEdit ? "Reset Password Baru" : "Password Awal"}
              </label>
              <input
                type="password"
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
              />
              <p className="text-[11px] leading-5 text-slate-400">
                {isEdit
                  ? "Isi hanya jika Anda ingin mengganti password login pegawai ini."
                  : "Password awal akan dipakai pegawai saat pertama kali login."}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-7 py-5 sm:flex-row sm:justify-end">
            <Button asChild variant="outline" className="rounded-2xl border-slate-200 px-5">
              <Link href={`/tenants/${outletId}?tab=staff`}>Batal</Link>
            </Button>
            <Button
              className="rounded-2xl bg-primary px-5 text-white shadow-[0_14px_32px_rgba(234,88,12,0.26)] hover:bg-primary/90"
              disabled={saving}
              onClick={handleSubmit}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Buat Akun"
              )}
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[28px] border-slate-200 bg-[linear-gradient(180deg,#fff7f2_0%,#ffffff_100%)] p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Ringkasan Akses
            </p>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Status Login
                </p>
                <p
                  className={cn(
                    "mt-2 text-sm font-bold",
                    form.status === 1 ? "text-emerald-600" : "text-slate-600"
                  )}
                >
                  {form.status === 1 ? "Aktif" : "Nonaktif"}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Role Outlet
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">{selectedRoleName}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Email Login
                </p>
                <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                  {form.email.trim() || "-"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-slate-200 p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Catatan
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <li>Role menentukan menu dan aksi yang bisa dipakai pegawai di aplikasi.</li>
              <li>Status nonaktif memutus akses login tanpa menghapus data akun.</li>
              <li>Password hanya perlu diisi saat membuat akun baru atau reset password.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
