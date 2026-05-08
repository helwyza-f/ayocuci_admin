"use client";

import { useAuthStore } from "@/store/use-auth-store";

interface PermissionGateProps {
  /** Nama modul yang ingin dicek (e.g., "users", "economy") */
  module: string;
  /** Aksi yang ingin dicek (e.g., "read", "create", "update", "delete") */
  action?: string;
  /** Konten yang ditampilkan jika punya permission */
  children: React.ReactNode;
  /** Konten fallback jika tidak punya permission (default: null) */
  fallback?: React.ReactNode;
  /** Jika true, hanya tampilkan untuk Master Admin */
  masterOnly?: boolean;
}

/**
 * PermissionGate — wrapper untuk conditional rendering berdasarkan RBAC permission.
 *
 * Contoh penggunaan:
 * <PermissionGate module="economy" action="update">
 *   <EditEconomyButton />
 * </PermissionGate>
 *
 * <PermissionGate masterOnly>
 *   <AdminManagementPage />
 * </PermissionGate>
 */
export default function PermissionGate({
  module,
  action = "read",
  children,
  fallback = null,
  masterOnly = false,
}: PermissionGateProps) {
  const { isMaster, hasPermission } = useAuthStore();

  // Jika masterOnly: hanya tampilkan untuk master admin
  if (masterOnly) {
    return isMaster() ? <>{children}</> : <>{fallback}</>;
  }

  // Master admin selalu punya akses
  if (isMaster()) return <>{children}</>;

  // Cek permission spesifik
  if (hasPermission(module, action)) return <>{children}</>;

  return <>{fallback}</>;
}
