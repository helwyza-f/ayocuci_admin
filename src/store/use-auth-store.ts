import { create } from "zustand";
import { Admin, AdminPermissions } from "@/types/admin";
import { logoutAdmin } from "@/app/(auth)/login/actions";

interface AuthState {
  admin: Admin | null;
  permissions: AdminPermissions | null;
  setAuth: (admin: Admin | null, permissions?: AdminPermissions | null) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
  isMaster: () => boolean;
  hasPermission: (module: string, action: string) => boolean;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  admin: null,
  permissions: null,
  setAuth: (admin, permissions = null) => set({ admin, permissions }),
  clearAuth: () => set({ admin: null, permissions: null }),
  logout: async () => {
    await logoutAdmin();
    set({ admin: null, permissions: null });
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  },
  isMaster: () => {
    const { admin, permissions } = get();
    if (!admin) return false;
    if (admin.adm_is_master) return true;
    // Cek dari permissions: master admin punya {"all": ["*"]}
    const allPerms = permissions?.["all"];
    return Array.isArray(allPerms) && allPerms.includes("*");
  },
  hasPermission: (module: string, action: string) => {
    const { isMaster, permissions } = get();
    // Master admin punya akses penuh
    if (isMaster()) return true;
    if (!permissions) return false;

    // Cek wildcard global
    const globalPerms = permissions["all"];
    if (Array.isArray(globalPerms) && (globalPerms.includes("*") || globalPerms.includes("all"))) {
      return true;
    }

    // Cek permission spesifik modul
    const modulePerms = permissions[module];
    if (!Array.isArray(modulePerms)) return false;

    return modulePerms.includes(action) || modulePerms.includes("*") || modulePerms.includes("all");
  },
}));
