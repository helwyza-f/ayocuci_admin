import axios from "axios";
import { logoutAdmin } from "@/app/(auth)/login/actions";
import { useAuthStore } from "@/store/use-auth-store";

const api = axios.create({
  baseURL: "/api/admin",
  headers: {
    "Content-Type": "application/json",
  },
});

let isRedirectingToLogin = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (
      (status === 401 || status === 403) &&
      typeof window !== "undefined" &&
      !isRedirectingToLogin &&
      window.location.pathname !== "/login"
    ) {
      isRedirectingToLogin = true;
      useAuthStore.getState().clearAuth();

      try {
        await logoutAdmin();
      } finally {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
