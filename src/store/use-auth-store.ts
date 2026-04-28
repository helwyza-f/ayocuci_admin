import { create } from "zustand";
import { Admin } from "@/types/admin";
import { logoutAdmin } from "@/app/(auth)/login/actions";

interface AuthState {
  admin: Admin | null;
  setAuth: (admin: Admin | null) => void;
  clearAuth: () => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
  admin: null,
  setAuth: (admin) => set({ admin }),
  clearAuth: () => set({ admin: null }),
  logout: async () => {
    await logoutAdmin();
    set({ admin: null });
    window.location.href = "/login";
  },
}));
