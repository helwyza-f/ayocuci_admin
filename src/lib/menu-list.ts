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
    group: "Monitoring",
    items: [
      { label: "Pusat Kontrol",     href: "/",          icon: LayoutGrid, module: "dashboard" },
      { label: "Analytics & Laporan", href: "/analytics", icon: BarChart2,  module: "analytics" },
    ],
  },
  {
    group: "Business Ecosystem",
    items: [
      { label: "Outlet / Tenant",    href: "/tenants",   icon: Store,       module: "tenants" },
      { label: "Owner (Pemilik)",    href: "/users",     icon: UserCircle,  module: "users" },
      { label: "Database Pelanggan", href: "/customers", icon: Users,       module: "customers" },
    ],
  },
  {
    group: "Finance & Revenue",
    items: [
      { label: "Riwayat Langganan",  href: "/subscriptions", icon: ShieldCheck, module: "subscriptions" },
      { label: "Topup & Penagihan",  href: "/topups",        icon: Wallet2,     module: "topups" },
      { label: "Paket Koin (SKU)",   href: "/packages",      icon: Package,     module: "packages" },
    ],
  },
  {
    group: "Growth & Marketing",
    items: [
      { label: "Voucher & Promo",    href: "/vouchers",      icon: Ticket,    module: "vouchers" },
      { label: "Siaran Notifikasi",  href: "/notifications", icon: Megaphone, module: "notifications" },
      { label: "Konten & Banner",    href: "/content",       icon: Repeat,    module: "content" },
      { label: "Referral Owner",     href: "/referrals",     icon: Wallet2,   module: "referrals" },
    ],
  },
  {
    group: "Configuration",
    items: [
      { label: "Ekonomi (Global)",   href: "/economy",  icon: Coins,    module: "economy" },
      { label: "Terms & Privacy",    href: "/legal",    icon: FileText, module: "legal" },
      { label: "Pengaturan Global",  href: "/settings", icon: Settings, module: "settings" },
      { label: "Sistem Fixer",       href: "/fixer",    icon: Wrench,   module: "fixer" },
    ],
  },
  {
    group: "Access Control",
    items: [
      {
        label: "Admin Management",
        href: "/admin-management",
        icon: ShieldAlert,
        module: "admin-management",
        masterOnly: true,
      },
    ],
  },
];

