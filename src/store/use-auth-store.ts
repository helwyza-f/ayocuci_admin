import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Admin } from "@/types/admin";
import { logoutAdmin } from "@/app/(auth)/login/actions";

interface AuthState {
  admin: Admin | null;
  token: string | null;
  setAuth: (admin: Admin | null, token: string | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      setAuth: (admin, token) => set({ admin, token }),
      logout: async () => {
        await logoutAdmin();
        set({ admin: null, token: null });
        localStorage.removeItem("admin-storage"); // Bersihkan storage
        window.location.href = "/login";
      },
    }),
    {
      name: "admin-storage", // Nama key di localStorage
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
