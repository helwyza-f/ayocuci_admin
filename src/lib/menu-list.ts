import {
  LayoutGrid,
  Users,
  Store,
  Ticket,
  Coins,
  UserCircle,
  Settings,
  Repeat,
  FileText,
  Wrench,
  Wallet2,
  Package,
  ShieldCheck,
  Megaphone,
  ShieldAlert,
  BarChart2,
  Zap,
  GitBranch,
  BookOpen,
  MessageSquareWarning,
  Trash2,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Kunci modul untuk permission check (harus cocok dengan key di permissions JSON) */
  module: string;
  /** Jika true, item ini hanya tampil untuk Master Admin */
  masterOnly?: boolean;
}

export interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export const adminMenus: MenuGroup[] = [
  {
    group: "Pemantauan",
    items: [
      { label: "Pusat Kontrol",     href: "/",          icon: LayoutGrid, module: "dashboard" },
      { label: "Analisis & Laporan", href: "/analytics", icon: BarChart2,  module: "analytics" },
    ],
  },
  {
    group: "Ekosistem Bisnis",
    items: [
      { label: "Daftar Tenant",    href: "/tenants",   icon: Store,       module: "tenants" },
      { label: "Pemilik Usaha",    href: "/users",     icon: UserCircle,  module: "users" },
      { label: "Database Pelanggan", href: "/customers", icon: Users,       module: "customers" },
    ],
  },
  {
    group: "Keuangan & Pendapatan",
    items: [
      { label: "Aktivasi Lisensi",  href: "/subscriptions", icon: ShieldCheck, module: "subscriptions" },
      { label: "Top Up & Penagihan",  href: "/topups",        icon: Wallet2,     module: "topups" },
      { label: "Ledger Koin",       href: "/coin-ledger",  icon: Coins,       module: "topups" },
      { label: "Paket Koin (SKU)",   href: "/packages",      icon: Package,     module: "packages" },
      { label: "Katalog Addon", href: "/addons",      icon: Zap,         module: "packages" },
    ],
  },
  {
    group: "Pertumbuhan & Pemasaran",
    items: [
      { label: "Voucher & Promo",    href: "/vouchers",      icon: Ticket,    module: "vouchers" },
      { label: "Siaran Notifikasi",  href: "/notifications", icon: Megaphone, module: "notifications" },
      { label: "Log OTP",            href: "/otp-logs",      icon: MessageSquareWarning, module: "notifications" },
      { label: "Konten & Banner",    href: "/content",       icon: Repeat,    module: "content" },
      { label: "Tutorial",           href: "/tutorials",     icon: BookOpen,  module: "tutorials" },
      { label: "Pencairan Referral", href: "/referrals/payouts", icon: Wallet2,   module: "referrals" },
      { label: "Komisi Referral",    href: "/referrals/rewards", icon: GitBranch, module: "referrals" },
    ],
  },
  {
    group: "Konfigurasi",
    items: [
      { label: "Pengaturan Ekonomi",   href: "/economy",  icon: Coins,    module: "economy" },
      { label: "Syarat & Privasi",    href: "/legal",    icon: FileText, module: "legal" },
      { label: "Pengaturan Umum",  href: "/settings", icon: Settings, module: "settings" },
      { label: "Sistem Pemulihan",       href: "/fixer",    icon: Wrench,   module: "fixer" },
    ],
  },
  {
    group: "Kontrol Akses",
    items: [
      {
        label: "Manajemen Admin",
        href: "/admin-management",
        icon: ShieldAlert,
        module: "admin-management",
        masterOnly: true,
      },
      {
        label: "Histori Hapus Akun",
        href: "/account-deletions",
        icon: Trash2,
        module: "account-deletions",
      },
    ],
  },
];
