"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";
import { setAdminSession } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ShieldCheck, LockKeyhole, Mail, Eye, EyeOff, Sparkles, Shield, ServerCog } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await authService.login({ email, password });

      if (res.status) {
        await setAdminSession(res.data.access_token);
        // Inject admin user + permissions (dari role jika ada) ke store
        const adminUser = res.data.user;
        const permissions = adminUser.role?.permissions ?? (adminUser.adm_is_master ? { all: ["*"] } : null);
        setAuth(adminUser, permissions);
        router.push("/");
        router.refresh();
      } else {
        setError(res.message || "Kredensial tidak valid");
      }
    } catch (err) {
      const error = err as AxiosError<ApiErrorResponse>;
      setError(
        error.response?.data?.message ||
          "Gagal terhubung ke server autentikasi.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F4F7FB] selection:bg-[#FF6A2B]/10">
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#FF6A2B]/12 blur-3xl" />
        <div className="absolute -right-24 top-32 h-80 w-80 rounded-full bg-slate-900/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/60 to-transparent" />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between px-10 py-10 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-soft border border-white/70">
              <ShieldCheck className="h-6 w-6 text-[#FF6A2B]" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">AyoCuci Admin</p>
              <p className="text-xs text-slate-500">Gerbang aman untuk tim admin dan divisi bisnis</p>
            </div>
          </div>

          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/75 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 shadow-soft">
              <Sparkles className="h-3.5 w-3.5 text-[#FF6A2B]" />
              Panel operasional untuk pertumbuhan AyoCuci
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 xl:text-6xl">
              Pertumbuhan bisnis dimulai dari eksekusi yang rapi dan konsisten.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600">
              Masuk untuk memantau outlet, billing, konten, analitik, dan kontrol admin pusat dalam satu dashboard yang ringkas.
            </p>
          </div>

          <div className="grid max-w-2xl grid-cols-3 gap-4">
              {[
              { icon: Shield, label: "Akses aman", desc: "Tetap rapi, terjaga, dan berbasis peran" },
              { icon: ServerCog, label: "Operasional terpusat", desc: "Bantu tim bisnis bergerak lebih cepat" },
              { icon: Sparkles, label: "Tampilan responsif", desc: "Nyaman dipakai tim di desktop maupun mobile" },
            ].map((item) => (
              <div key={item.label} className="surface-panel rounded-2xl p-4">
                <item.icon className="h-5 w-5 text-[#FF6A2B]" />
                <p className="mt-3 text-sm font-bold text-slate-900">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-[460px]">
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/85 shadow-soft border border-white/70">
                <ShieldCheck className="h-6 w-6 text-[#FF6A2B]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">AyoCuci Admin</p>
                <p className="text-xs text-slate-500">Secure gateway</p>
              </div>
            </div>

            <Card className="surface-panel overflow-hidden rounded-[1.75rem]">
              <CardHeader className="space-y-2 border-b border-slate-100/80 px-6 py-6 text-left sm:px-8">
                <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Sign In</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Masuk menggunakan akun admin pusat yang valid.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 py-6 sm:px-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Email Admin
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@ayocuci.id"
                        className="h-12 rounded-2xl border-slate-200 bg-white pl-11 shadow-none focus-visible:border-[#FF6A2B] focus-visible:ring-[#FF6A2B]/20"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">
                      Kata Sandi
                    </Label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-12 rounded-2xl border-slate-200 bg-white pl-11 pr-11 shadow-none focus-visible:border-[#FF6A2B] focus-visible:ring-[#FF6A2B]/20"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="rounded-2xl border-rose-100 bg-rose-50 py-3 text-rose-600">
                      <AlertDescription className="text-center text-xs font-semibold">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-2xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 active:scale-[0.99]"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Masuk ke Dashboard"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
              &copy; 2026 AyoCuci Cloud Infrastructure
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
