import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      admin: null,
      permissions: null,
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
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
        const allPerms = permissions?.["all"];
        return Array.isArray(allPerms) && allPerms.includes("*");
      },
      hasPermission: (module: string, action: string) => {
        const { isMaster, permissions } = get();
        if (isMaster()) return true;
        if (!permissions) return false;

        const globalPerms = permissions["all"];
        if (Array.isArray(globalPerms) && (globalPerms.includes("*") || globalPerms.includes("all"))) {
          return true;
        }

        const modulePerms = permissions[module];
        if (!Array.isArray(modulePerms)) return false;

        return modulePerms.includes(action) || modulePerms.includes("*") || modulePerms.includes("all");
      },
    }),
    {
      name: "ayocuci-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
