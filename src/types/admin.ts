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

export type PermissionKey =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "suspend"
  | "activate"
  | "broadcast"
  | "export"
  | "reset_data"
  | "assign_role"
  | "manage"
  | "confirm"
  | "cancel";

export interface AdminPermissionAction {
  key: PermissionKey;
  label: string;
}

export interface AdminPermissionResource {
  key: string;
  label: string;
  description: string;
  actions: PermissionKey[];
  masterOnly?: boolean;
}

export interface AdminPermissionPreset {
  key: string;
  label: string;
  description: string;
  permissions: AdminPermissions;
}

export const ADMIN_PERMISSIONS: AdminPermissionResource[] = [
  {
    key: "dashboard",
    label: "Pusat Kontrol",
    description: "Ringkasan utama, KPI, dan pemantauan harian.",
    actions: ["read", "export"],
  },
  {
    key: "analytics",
    label: "Analitik & Laporan",
    description: "Pendapatan, pertumbuhan, geografi, dan performa bisnis.",
    actions: ["read", "export"],
  },
  {
    key: "tenants",
    label: "Outlet / Tenant",
    description: "Lihat, suspend, ubah, hapus, dan reset outlet.",
    actions: ["read", "update", "delete", "suspend", "activate", "reset_data"],
  },
  {
    key: "users",
    label: "Owner / Pemilik",
    description: "Kelola data owner lintas outlet dan tindakan sensitif.",
    actions: ["read", "update", "delete"],
  },
  {
    key: "customers",
    label: "Database Pelanggan",
    description: "Akses data pelanggan lintas tenant.",
    actions: ["read", "export"],
  },
  {
    key: "topups",
    label: "Top Up & Penagihan",
    description: "Validasi, batalkan, dan pantau transaksi top up.",
    actions: ["read", "confirm", "cancel", "export"],
  },
  {
    key: "subscriptions",
    label: "Riwayat Langganan",
    description: "Pantau pembayaran paket dan status langganan.",
    actions: ["read", "export"],
  },
  {
    key: "packages",
    label: "Paket Koin (SKU) dan Addon",
    description: "Kelola katalog paket, addon, dan penyesuaian harga.",
    actions: ["read", "create", "update", "delete"],
  },
  {
    key: "vouchers",
    label: "Voucher & Promo",
    description: "Buat, ubah, aktifkan, dan nonaktifkan promo.",
    actions: ["read", "create", "update", "delete", "activate", "suspend"],
  },
  {
    key: "notifications",
    label: "Siaran Notifikasi",
    description: "Broadcast, audit log, dan kontrol push token.",
    actions: ["read", "broadcast", "delete"],
  },
  {
    key: "content",
    label: "Konten & Banner",
    description: "Kelola konten marketing, banner, dan halaman promosi.",
    actions: ["read", "create", "update", "delete"],
  },
  {
    key: "tutorials",
    label: "Tutorial",
    description: "Kelola materi bantuan untuk user dan owner.",
    actions: ["read", "create", "update", "delete"],
  },
  {
    key: "referrals",
    label: "Referral",
    description: "Pantau komisi, payout, dan status referral.",
    actions: ["read", "approve", "reject", "export"],
  },
  {
    key: "economy",
    label: "Pengaturan Ekonomi",
    description: "Konfigurasi ekonomi, biaya, dan paket pusat.",
    actions: ["read", "create", "update", "delete"],
  },
  {
    key: "legal",
    label: "Syarat & Privasi",
    description: "Kelola dokumen hukum dan kebijakan aplikasi.",
    actions: ["read", "update"],
  },
  {
    key: "settings",
    label: "Pengaturan Global",
    description: "Pengaturan umum, integrasi, dan konfigurasi sistem.",
    actions: ["read", "create", "update"],
  },
  {
    key: "fixer",
    label: "Sistem Pemulihan",
    description: "Reset data, recovery, dan prosedur perbaikan.",
    actions: ["read", "reset_data"],
  },
  {
    key: "admin-management",
    label: "Manajemen Admin",
    description: "Kelola akun admin, role, dan akses internal.",
    actions: ["read", "create", "update", "delete", "assign_role", "manage"],
    masterOnly: true,
  },
  {
    key: "account-deletions",
    label: "Histori Hapus Akun",
    description: "Audit penghapusan akun owner/admin dan alasan.",
    actions: ["read", "export"],
  },
] as const;

export const ADMIN_ACTIONS: AdminPermissionAction[] = [
  { key: "read", label: "Lihat" },
  { key: "create", label: "Buat" },
  { key: "update", label: "Ubah" },
  { key: "delete", label: "Hapus" },
  { key: "approve", label: "Setujui" },
  { key: "reject", label: "Tolak" },
  { key: "suspend", label: "Nonaktifkan" },
  { key: "activate", label: "Aktifkan" },
  { key: "broadcast", label: "Broadcast" },
  { key: "export", label: "Ekspor" },
  { key: "reset_data", label: "Reset Data" },
  { key: "assign_role", label: "Assign Role" },
  { key: "manage", label: "Kelola" },
  { key: "confirm", label: "Konfirmasi" },
  { key: "cancel", label: "Batalkan" },
];

export const ADMIN_ROLE_PRESETS: AdminPermissionPreset[] = [
  {
    key: "cs",
    label: "CS / Support",
    description: "Untuk tim yang menangani tenant, owner, topup, dan bantuan harian.",
    permissions: {
      dashboard: ["read"],
      tenants: ["read", "update"],
      users: ["read", "update"],
      customers: ["read"],
      topups: ["read", "confirm", "cancel"],
      subscriptions: ["read"],
      notifications: ["read"],
      "account-deletions": ["read"],
      fixer: ["read"],
    },
  },
  {
    key: "ops",
    label: "Operations",
    description: "Untuk tim operasional yang memantau tenant, status, dan penanganan insiden.",
    permissions: {
      dashboard: ["read"],
      analytics: ["read"],
      tenants: ["read", "update", "suspend", "activate", "reset_data"],
      users: ["read", "update"],
      customers: ["read"],
      topups: ["read", "confirm", "cancel"],
      subscriptions: ["read"],
      notifications: ["read"],
      referrals: ["read"],
      "account-deletions": ["read"],
    },
  },
  {
    key: "growth",
    label: "Growth / Marketing",
    description: "Untuk tim marketing, konten, promo, dan referral.",
    permissions: {
      dashboard: ["read", "export"],
      analytics: ["read", "export"],
      customers: ["read", "export"],
      subscriptions: ["read", "export"],
      packages: ["read"],
      vouchers: ["read", "create", "update", "activate", "suspend"],
      notifications: ["read", "broadcast"],
      content: ["read", "create", "update", "delete"],
      tutorials: ["read", "create", "update", "delete"],
      referrals: ["read", "approve", "reject", "export"],
    },
  },
  {
    key: "finance",
    label: "Finance / Billing",
    description: "Untuk tim finance, billing, approval, dan kontrol risiko.",
    permissions: {
      dashboard: ["read", "export"],
      analytics: ["read", "export"],
      tenants: ["read"],
      users: ["read"],
      topups: ["read", "confirm", "cancel", "export"],
      subscriptions: ["read", "export"],
      economy: ["read", "update"],
      legal: ["read"],
      fixer: ["read", "reset_data"],
      referrals: ["read", "approve", "reject", "export"],
    },
  },
];
