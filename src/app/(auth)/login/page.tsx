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
import { Loader2, AlertCircle, LayoutGrid } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        setAuth(res.data.user, res.data.access_token);
        router.push("/");
        router.refresh();
      } else {
        setError(res.message || "Invalid credentials");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to connect to the authentication server.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F8F9FB]">
      {/* Background Gradient: #ff6249 to a lighter vibrant orange */}
      <div className="absolute top-0 h-[45vh] w-full bg-gradient-to-b from-[#FF2200] to-[#FF6249]" />

      {/* Soft Glow Elements */}
      <div className="absolute top-[5%] right-[2%] h-80 w-80 rounded-full bg-white/10 blur-[80px]" />
      <div className="absolute top-[15%] left-[2%] h-64 w-64 rounded-full bg-[#FF4500]/20 blur-[60px]" />

      <div className="z-10 w-full max-w-md px-6">
        <div className="mb-10 text-center text-whi  te">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/20 backdrop-blur-xl shadow-2xl border border-white/30">
            <LayoutGrid className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">
            AyoCuci
          </h1>
          <p className="mt-2 text-white/90 font-bold text-sm tracking-widest uppercase">
            Admin Control
          </p>
        </div>

        <Card className="border-none shadow-[0_20px_50px_rgba(255,69,0,0.15)] rounded-[3rem] bg-white/95 backdrop-blur-md p-2">
          <CardHeader className="space-y-1 pt-10 text-center">
            <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">
              LOGIN
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">
              Authorized Personnel Only
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-10 px-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-slate-500 ml-1 text-xs font-black uppercase tracking-wider"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ayocuci.id"
                  className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl focus-visible:ring-[#FF4500] font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-slate-500 ml-1 text-xs font-black uppercase tracking-wider"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-14 border-slate-100 bg-slate-50/50 rounded-2xl focus-visible:ring-[#FF4500]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-none text-red-600 rounded-2xl animate-in fade-in zoom-in duration-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="font-bold text-xs uppercase italic">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-16 bg-gradient-to-r from-[#FF4500] to-[#FF6347] hover:brightness-110 text-white font-black text-xl rounded-2xl shadow-xl shadow-orange-500/30 transition-all active:scale-[0.97] uppercase tracking-tighter italic"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <footer className="mt-10 text-center">
          <div className="h-1 w-12 bg-slate-200 mx-auto rounded-full mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            System.AyoCuci.v1.6
          </p>
        </footer>
      </div>
    </div>
  );
}
