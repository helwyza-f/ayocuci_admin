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
    label: "Direktori Outlet",
    description: "Lihat, ubah, nonaktifkan, hapus, dan reset data outlet.",
    actions: ["read", "update", "delete", "suspend", "activate", "reset_data"],
  },
  {
    key: "staff-accounts",
    label: "Akun Karyawan Outlet",
    description: "Kelola akun pegawai per outlet, status login, role, dan reset password.",
    actions: ["read", "create", "update", "delete"],
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
    description: "Akses data pelanggan lintas outlet untuk kebutuhan monitoring dan bantuan.",
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
    label: "Aktivasi Lisensi",
    description: "Pantau aktivasi lisensi PRO dan add-on per item. Aksi validasi mengikuti izin Top Up & Penagihan.",
    actions: ["read", "export"],
  },
  {
    key: "packages",
    label: "Paket Koin (SKU) dan Addon",
    description: "Kelola paket koin, katalog add-on, dan penyesuaian harga pusat.",
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
    description: "Pantau komisi referral, pencairan, dan konversi saldo terkait.",
    actions: ["read", "approve", "reject", "export"],
  },
  {
    key: "economy",
    label: "Pengaturan Ekonomi",
    description: "Konfigurasi ekonomi koin, biaya, bonus, dan aturan harga pusat.",
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
    description: "Kelola pengaturan umum, integrasi, dan konfigurasi sistem admin.",
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
    description: "Kelola akun admin internal, role, dan pembagian akses panel.",
    actions: ["read", "create", "update", "delete", "assign_role", "manage"],
    masterOnly: true,
  },
  {
    key: "account-deletions",
    label: "Histori Hapus Akun",
    description: "Audit penghapusan akun owner atau admin beserta snapshot data pentingnya.",
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

const BASELINE_READ_PERMISSIONS: AdminPermissions = {
  dashboard: ["read"],
  analytics: ["read"],
  tenants: ["read"],
  "staff-accounts": ["read"],
  users: ["read"],
  customers: ["read"],
  topups: ["read"],
  subscriptions: ["read"],
  packages: ["read"],
  vouchers: ["read"],
  notifications: ["read"],
  content: ["read"],
  tutorials: ["read"],
  referrals: ["read"],
  economy: ["read"],
  legal: ["read"],
  settings: ["read"],
  fixer: ["read"],
  "account-deletions": ["read"],
};

export const ADMIN_ROLE_PRESETS: AdminPermissionPreset[] = [
  {
    key: "cs",
    label: "CS / Support",
    description: "Untuk tim yang menangani outlet, owner, top up, dan bantuan operasional harian.",
    permissions: {
      ...BASELINE_READ_PERMISSIONS,
      tenants: ["read", "update"],
      "staff-accounts": ["read", "update"],
      users: ["read", "update"],
      topups: ["read", "confirm", "cancel"],
    },
  },
  {
    key: "ops",
    label: "Operations",
    description: "Untuk tim operasional yang memantau outlet, status layanan, akun pegawai, dan penanganan insiden.",
    permissions: {
      ...BASELINE_READ_PERMISSIONS,
      tenants: ["read", "update", "suspend", "activate", "reset_data"],
      "staff-accounts": ["read", "create", "update", "delete"],
      users: ["read", "update"],
      topups: ["read", "confirm", "cancel"],
    },
  },
  {
    key: "growth",
    label: "Growth / Marketing",
    description: "Untuk tim growth yang memantau kampanye, konten, promo, aktivasi, dan referral.",
    permissions: {
      ...BASELINE_READ_PERMISSIONS,
      dashboard: ["read", "export"],
      analytics: ["read", "export"],
      customers: ["read", "export"],
      subscriptions: ["read", "export"],
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
    description: "Untuk tim finance yang memverifikasi top up, memantau billing, dan mengontrol risiko pencairan.",
    permissions: {
      ...BASELINE_READ_PERMISSIONS,
      dashboard: ["read", "export"],
      analytics: ["read", "export"],
      topups: ["read", "confirm", "cancel", "export"],
      subscriptions: ["read", "export"],
      economy: ["read", "update"],
      fixer: ["read", "reset_data"],
      referrals: ["read", "approve", "reject", "export"],
    },
  },
];
