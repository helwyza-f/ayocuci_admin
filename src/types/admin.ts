// Format permissions: { "users": ["read", "update"], "economy": ["read"] }
export type AdminPermissions = Record<string, string[]>;

export interface AdminRole {
  id: string;
  nama: string;
  permissions: AdminPermissions;
  created_by: string;
  created_at: string;
}

export interface Admin {
  adm_id: string;
  adm_nama: string;
  adm_email: string;
  adm_is_master: boolean;
  adm_role: string | null;
  adm_created: string;
  role?: AdminRole;
}

export interface LoginResponse {
  status: boolean;
  message: string;
  data: {
    access_token: string;
    actor_type: "admin";
    user: Admin;
  };
}

export interface AdminCredentials {
  email: string;
  password: string;
}

// Konstanta modul yang tersedia di admin panel
export const ADMIN_MODULES = [
  { key: "dashboard",     label: "Dashboard" },
  { key: "analytics",     label: "Analytics & Laporan" },
  { key: "users",         label: "Owner (Pemilik)" },
  { key: "customers",     label: "Database Pelanggan" },
  { key: "tenants",       label: "Outlet / Tenant" },
  { key: "subscriptions", label: "Riwayat Langganan" },
  { key: "topups",        label: "Topup & Penagihan" },
  { key: "packages",      label: "Paket Koin (SKU)" },
  { key: "vouchers",      label: "Voucher & Promo" },
  { key: "notifications", label: "Siaran Notifikasi" },
  { key: "content",       label: "Konten & Banner" },
  { key: "referrals",     label: "Referral Owner" },
  { key: "economy",       label: "Ekonomi (Global)" },
  { key: "legal",         label: "Terms & Privacy" },
  { key: "settings",      label: "Pengaturan Global" },
  { key: "fixer",         label: "Sistem Fixer" },
] as const;

export const ADMIN_ACTIONS = [
  { key: "read",   label: "Lihat" },
  { key: "create", label: "Buat" },
  { key: "update", label: "Ubah" },
  { key: "delete", label: "Hapus" },
] as const;

