"use client";

import { useState, useEffect } from "react";
import useSWR, { mutate } from "swr";
import { ShieldAlert, UserPlus, Shield, Trash2, Edit3, Check, X, Plus, Key, Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetcher } from "@/lib/fetcher";
import { ApiResponse } from "@/types/api";
import { Admin, AdminRole, ADMIN_MODULES, ADMIN_ACTIONS, AdminPermissions } from "@/types/admin";
import { useAuthStore } from "@/store/use-auth-store";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api-client";
import TableSkeleton from "@/components/shared/table-skeleton";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ============================================================
// PERMISSION MATRIX EDITOR
// ============================================================
function PermissionMatrix({
  value,
  onChange,
}: {
  value: AdminPermissions;
  onChange: (v: AdminPermissions) => void;
}) {
  const toggle = (moduleKey: string, actionKey: string) => {
    const current = value[moduleKey] || [];
    const has = current.includes(actionKey);
    onChange({
      ...value,
      [moduleKey]: has ? current.filter((a) => a !== actionKey) : [...current, actionKey],
    });
  };

  const toggleAll = (moduleKey: string) => {
    const allActions = ADMIN_ACTIONS.map((a) => a.key);
    const current = value[moduleKey] || [];
    const hasAll = allActions.every((a) => current.includes(a));
    onChange({ ...value, [moduleKey]: hasAll ? [] : [...allActions] });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider w-48">Modul</th>
            {ADMIN_ACTIONS.map((action) => (
              <th key={action.key} className="px-4 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">
                {action.label}
              </th>
            ))}
            <th className="px-4 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Semua</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ADMIN_MODULES.map((mod) => {
            const current = value[mod.key] || [];
            const allActions = ADMIN_ACTIONS.map((a) => a.key);
            const hasAll = allActions.every((a) => current.includes(a));
            return (
              <tr key={mod.key} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-slate-700">{mod.label}</td>
                {ADMIN_ACTIONS.map((action) => {
                  const has = current.includes(action.key);
                  return (
                    <td key={action.key} className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => toggle(mod.key, action.key)}
                        className={`h-6 w-6 rounded flex items-center justify-center mx-auto transition-all border ${
                          has
                            ? "bg-primary border-primary text-white shadow-sm"
                            : "bg-white border-slate-200 text-slate-300 hover:border-primary/50"
                        }`}
                      >
                        {has && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  );
                })}
                <td className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleAll(mod.key)}
                    className={`h-6 w-6 rounded flex items-center justify-center mx-auto transition-all border ${
                      hasAll
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-200 text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {hasAll && <Check className="h-3.5 w-3.5" />}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// ROLE FORM MODAL
// ============================================================
function RoleFormPanel({
  existing,
  onSave,
  onCancel,
}: {
  existing?: AdminRole;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [nama, setNama] = useState(existing?.nama || "");
  const [permissions, setPermissions] = useState<AdminPermissions>(existing?.permissions || {});
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nama.trim()) { toast.error("Nama role harus diisi"); return; }
    setSaving(true);
    try {
      if (existing) {
        await api.put(`/admin-roles/${existing.id}`, { nama, permissions });
        toast.success("Role berhasil diperbarui");
      } else {
        await api.post("/admin-roles", { nama, permissions });
        toast.success("Role berhasil dibuat");
      }
      onSave();
    } catch {
      toast.error("Gagal menyimpan role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-primary/20 bg-white rounded-xl p-6 space-y-5 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{existing ? "Edit Role" : "Buat Role Baru"}</p>
            <p className="text-[10px] text-slate-400">Tentukan nama dan permission yang dimiliki role ini</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8"><X className="h-4 w-4" /></Button>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5">Nama Role</label>
        <Input
          placeholder="Contoh: Finance Manager, CS Supervisor..."
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          className="h-10 text-sm font-medium border-slate-200"
        />
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Permission Matrix</label>
        <PermissionMatrix value={permissions} onChange={setPermissions} />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button variant="outline" onClick={onCancel} size="sm">Batal</Button>
        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold">
          {saving ? "Menyimpan..." : existing ? "Perbarui Role" : "Buat Role"}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function AdminManagementPage() {
  const router = useRouter();
  const { isMaster } = useAuthStore();

  // Redirect jika bukan master admin
  if (!isMaster()) {
    router.replace("/");
    return null;
  }

  return <AdminManagementContent />;
}

function AdminManagementContent() {
  const { data: adminsData, isLoading: adminsLoading, mutate: mutateAdmins } = useSWR<ApiResponse<Admin[]>>(
    "/accounts", apiFetcher, { dedupingInterval: 30_000 }
  );
  const { data: rolesData, isLoading: rolesLoading, mutate: mutateRoles } = useSWR<ApiResponse<AdminRole[]>>(
    "/admin-roles", apiFetcher, { dedupingInterval: 30_000 }
  );

  const admins = adminsData?.data || [];
  const roles = rolesData?.data || [];

  // Create Admin state
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ nama: "", email: "", password: "", role_id: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Role form state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | undefined>();

  const handleCreateAdmin = async () => {
    if (!newAdmin.nama || !newAdmin.email || !newAdmin.password) {
      toast.error("Nama, email, dan password harus diisi");
      return;
    }
    setCreatingAdmin(true);
    try {
      await api.post("/accounts", {
        nama: newAdmin.nama,
        email: newAdmin.email,
        password: newAdmin.password,
        role_id: newAdmin.role_id || null,
      });
      toast.success("Akun admin berhasil dibuat");
      setNewAdmin({ nama: "", email: "", password: "", role_id: "" });
      setShowCreateAdmin(false);
      mutateAdmins();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal membuat akun admin");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Yakin ingin menghapus akun admin ini?")) return;
    try {
      await api.delete(`/accounts/${id}`);
      toast.success("Akun admin dihapus");
      mutateAdmins();
    } catch {
      toast.error("Gagal menghapus akun admin");
    }
  };

  const handleAssignRole = async (adminId: string, roleId: string | null) => {
    try {
      await api.patch(`/accounts/${adminId}/role`, { role_id: roleId });
      toast.success("Role berhasil di-assign");
      mutateAdmins();
    } catch {
      toast.error("Gagal assign role");
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Yakin ingin menghapus role ini?")) return;
    try {
      await api.delete(`/admin-roles/${id}`);
      toast.success("Role dihapus");
      mutateRoles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menghapus role");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-heading">
            <ShieldAlert className="h-5 w-5 text-primary" />
            Admin Management
          </h1>
          <p className="text-xs font-medium text-slate-500">
            Kelola akun admin panel dan permission role mereka.
          </p>
        </div>
        <Badge variant="outline" className="h-8 px-3 rounded-md font-bold text-[10px] uppercase tracking-wider text-slate-500 border-slate-200 bg-white w-fit">
          Master Admin Only
        </Badge>
      </div>

      <Tabs defaultValue="accounts">
        <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200 w-full md:w-fit">
          <TabsTrigger value="accounts" className="rounded-lg px-5 font-bold text-[11px] uppercase gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow">
            <Users className="h-3.5 w-3.5" /> Akun Admin
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg px-5 font-bold text-[11px] uppercase gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow">
            <Key className="h-3.5 w-3.5" /> Roles & Permissions
          </TabsTrigger>
        </TabsList>

        {/* ---- TAB: AKUN ADMIN ---- */}
        <TabsContent value="accounts" className="mt-5 space-y-4">
          {/* Create Admin Form */}
          {showCreateAdmin && (
            <Card className="border border-primary/20 bg-white rounded-xl p-6 space-y-4 shadow-lg shadow-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-900">Buat Akun Admin Baru</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowCreateAdmin(false)} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Nama Lengkap</label>
                  <Input placeholder="Budi Santoso" value={newAdmin.nama} onChange={(e) => setNewAdmin({ ...newAdmin, nama: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Email</label>
                  <Input type="email" placeholder="budi@ayocuci.com" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Password</label>
                  <Input type="password" placeholder="Min. 6 karakter" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Role (Opsional)</label>
                <select
                  value={newAdmin.role_id}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role_id: e.target.value })}
                  className="w-full md:w-64 h-9 text-sm border border-slate-200 rounded-md px-3 text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">— Tanpa Role (Akses Terbatas) —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={() => setShowCreateAdmin(false)}>Batal</Button>
                <Button size="sm" disabled={creatingAdmin} onClick={handleCreateAdmin} className="bg-primary hover:bg-primary/90 text-white font-bold">
                  {creatingAdmin ? "Membuat..." : "Buat Akun Admin"}
                </Button>
              </div>
            </Card>
          )}

          <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{admins.length} Akun Admin Terdaftar</p>
              {!showCreateAdmin && (
                <Button size="sm" onClick={() => setShowCreateAdmin(true)} className="h-7 px-3 text-[10px] font-bold uppercase bg-primary hover:bg-primary/90 text-white gap-1.5">
                  <Plus className="h-3 w-3" /> Tambah Admin
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Admin</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Role</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Bergabung</th>
                    <th className="px-5 py-3 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {adminsLoading ? (
                    <TableSkeleton columns={4} rows={5} />
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center">
                        <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada akun admin</p>
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.adm_id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                              {admin.adm_nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{admin.adm_nama}</p>
                              <p className="text-[9px] font-medium text-slate-400">{admin.adm_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <select
                            value={admin.adm_role || ""}
                            onChange={(e) => handleAssignRole(admin.adm_id, e.target.value || null)}
                            className="text-[10px] font-bold border border-slate-200 rounded-md px-2 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-primary/20"
                          >
                            <option value="">— Tanpa Role —</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>{r.nama}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <p className="text-[10px] font-bold text-slate-500">
                            {format(new Date(admin.adm_created), "dd MMM yyyy", { locale: localeId })}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAdmin(admin.adm_id)}
                            className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ---- TAB: ROLES & PERMISSIONS ---- */}
        <TabsContent value="roles" className="mt-5 space-y-4">
          {/* Role Form */}
          {showRoleForm && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <RoleFormPanel
                existing={editingRole}
                onSave={() => { setShowRoleForm(false); setEditingRole(undefined); mutateRoles(); }}
                onCancel={() => { setShowRoleForm(false); setEditingRole(undefined); }}
              />
            </div>
          )}

          <Card className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/30">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{roles.length} Role Terdaftar</p>
              {!showRoleForm && (
                <Button size="sm" onClick={() => { setEditingRole(undefined); setShowRoleForm(true); }} className="h-7 px-3 text-[10px] font-bold uppercase bg-primary hover:bg-primary/90 text-white gap-1.5">
                  <Plus className="h-3 w-3" /> Buat Role
                </Button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {rolesLoading ? (
                <div className="p-8 text-center">
                  <Shield className="h-6 w-6 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Memuat...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="py-16 text-center">
                  <Shield className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada role</p>
                </div>
              ) : (
                roles.map((role) => {
                  const moduleCount = Object.keys(role.permissions || {}).filter(
                    (k) => (role.permissions[k]?.length || 0) > 0
                  ).length;
                  return (
                    <div key={role.id} className="px-5 py-4 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Shield className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{role.nama}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            Akses ke {moduleCount} modul
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingRole(role); setShowRoleForm(true); }}
                          className="h-7 w-7 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRole(role.id)}
                          className="h-7 w-7 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
