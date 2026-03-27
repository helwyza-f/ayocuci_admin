import axios from "axios";
import { useAuthStore } from "@/store/use-auth-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.ayocuci.id/api/v1",
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    // 1. Coba ambil dari Zustand dulu (paling cepat)
    let token = useAuthStore.getState().token;

    // 2. Kalau Zustand kosong (misal pas refresh), coba intip dari Cookie
    // Karena kita set httpOnly: true, Javascript Client TIDAK BISA baca cookie.
    // TAPI, jika lo hit API via Proxy Next.js atau Server Component, ini aman.

    // Karena lo hit langsung ke port 8080, kita harus pastikan
    // token lo tersimpan di Zustand dan PERSISTED.

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default api;
