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
import { Loader2, ShieldCheck, LockKeyhole, Mail } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/types/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="relative flex min-h-screen items-center justify-center bg-[#F9FAFB] selection:bg-[#FF4500]/10">
      {/* Background Aesthetic */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-gradient-to-br from-[#FF4500]/10 to-transparent blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-gradient-to-tl from-slate-200 to-transparent blur-[100px]" />
      </div>

      <div className="z-10 w-full max-w-[420px] px-6 py-12">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 transition-transform hover:rotate-3">
            <ShieldCheck className="h-8 w-8 text-[#FF4500]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            AyoCuci <span className="text-[#FF4500]">Admin</span>
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Silakan masuk untuk mengelola ekosistem
          </p>
        </div>

        <Card className="border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] bg-white/80 backdrop-blur-xl overflow-hidden">
          <CardHeader className="space-y-1 pt-8 pb-6 text-center border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-800">
              Sign In
            </CardTitle>
            <CardDescription className="text-slate-400 font-medium text-xs tracking-wide uppercase">
              Secure Gateway
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-8 pb-10 px-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1"
                >
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF4500] transition-colors">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ayocuci.id"
                    className="h-12 pl-11 border-slate-200 bg-white rounded-xl focus-visible:ring-[#FF4500]/20 focus-visible:border-[#FF4500] transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1"
                >
                  Secret Password
                </Label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF4500] transition-colors">
                    <LockKeyhole className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 pl-11 border-slate-200 bg-white rounded-xl focus-visible:ring-[#FF4500]/20 focus-visible:border-[#FF4500] transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-rose-50 border border-rose-100 text-rose-600 rounded-xl py-3 animate-in slide-in-from-top-2 duration-300"
                >
                  <AlertDescription className="font-semibold text-xs text-center">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-md shadow-slate-200 group mt-2"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Masuk ke Dashboard
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            &copy; 2026 AyoCuci Cloud Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
