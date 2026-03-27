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
} from "lucide-react";

export const adminMenus = [
  {
    group: "Ringkasan",
    items: [{ label: "Pusat Kontrol", href: "/", icon: LayoutGrid }],
  },
  {
    group: "Manajemen Utama",
    items: [
      { label: "Outlet / Tenant", href: "/tenants", icon: Store },
      { label: "Owner (Pemilik)", href: "/users", icon: UserCircle },
      { label: "Database Pelanggan", href: "/customers", icon: Users },
    ],
  },
  {
    group: "Konfigurasi Platform",
    items: [
      { label: "Siaran Notifikasi", href: "/notifications", icon: Bell },
      { label: "Ekonomi (Koin & Reff)", href: "/economy", icon: Coins },
      { label: "Voucher & Promo", href: "/vouchers", icon: Ticket }, // Tambahkan ini
      { label: "Konten & Banner", href: "/content", icon: Repeat },
    ],
  },
  // Tambahkan di adminMenus lo
  {
    group: "SaaS & Penagihan",
    items: [
      { label: "Paket Koin", href: "/packages", icon: Ticket },
      { label: "Topup & Tagihan", href: "/topups", icon: Wallet2 }, // Tambahkan ini
      { label: "Riwayat Langganan", href: "/subscriptions", icon: FileText },
    ],
  },
  {
    group: "Sistem",
    items: [
      { label: "Perbaikan Transaksi", href: "/fixer", icon: Wrench },
      { label: "Pengaturan Global", href: "/settings", icon: Settings },
    ],
  },
];
