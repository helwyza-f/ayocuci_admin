import {
  LayoutGrid,
  Users,
  Store,
  Bell,
  Ticket,
  Coins,
  UserCircle,
  Settings,
  Repeat,
  FileText,
  Wrench,
  Wallet2,
  Package,
  History,
  ShieldCheck,
  Megaphone,
} from "lucide-react";

export const adminMenus = [
  {
    group: "Monitoring",
    items: [
      { label: "Pusat Kontrol", href: "/", icon: LayoutGrid },
    ],
  },
  {
    group: "Business Ecosystem",
    items: [
      { label: "Outlet / Tenant", href: "/tenants", icon: Store },
      { label: "Owner (Pemilik)", href: "/users", icon: UserCircle },
      { label: "Database Pelanggan", href: "/customers", icon: Users },
    ],
  },
  {
    group: "Finance & Revenue",
    items: [
      { label: "Riwayat Langganan", href: "/subscriptions", icon: ShieldCheck },
      { label: "Topup & Penagihan", href: "/topups", icon: Wallet2 },
      { label: "Paket Koin (SKU)", href: "/packages", icon: Package },
    ],
  },
  {
    group: "Growth & Marketing",
    items: [
      { label: "Voucher & Promo", href: "/vouchers", icon: Ticket },
      { label: "Siaran Notifikasi", href: "/notifications", icon: Megaphone },
      { label: "Konten & Banner", href: "/content", icon: Repeat },
      { label: "Referral Owner", href: "/referrals", icon: Wallet2 },
    ],
  },
  {
    group: "Configuration",
    items: [
      { label: "Ekonomi (Global)", href: "/economy", icon: Coins },
      { label: "Terms & Privacy", href: "/legal", icon: FileText },
      { label: "Pengaturan Global", href: "/settings", icon: Settings },
      { label: "Sistem Fixer", href: "/fixer", icon: Wrench },
    ],
  },
];
