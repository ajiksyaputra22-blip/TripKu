"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, AlertCircle } from "lucide-react";

const ROLE_REDIRECT: Record<string, string> = {
  CUSTOMER: "/explore",
  TRAVEL: "/travel/dashboard",
  GUIDE: "/guide/dashboard",
  DRIVER: "/driver/dashboard",
  ADMIN: "/admin/dashboard",
};

function UnifiedLoginForm() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Email atau password salah.");
      }

      const role: string = data.user?.role;
      if (!role || !ROLE_REDIRECT[role]) {
        throw new Error("Akun tidak dikenali. Silakan hubungi Admin Sistem.");
      }

      // Jika Driver atau Tour Guide belum melengkapi profil, wajib diarahkan ke halaman lengkapi profil
      if ((role === "DRIVER" || role === "GUIDE") && !data.user?.profileCompleted) {
        window.location.href = role === "DRIVER" ? "/driver/profile?incomplete=1" : "/guide/profile?incomplete=1";
        return;
      }

      // Gunakan redirect param jika ada, atau arahkan sesuai role
      const destination = redirectParam || ROLE_REDIRECT[role];
      window.location.href = destination;
    } catch (err: any) {
      setError(err.message || "Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity mb-4">
            <img 
              src="/logo.png" 
              alt="TripKu Logo" 
              className="h-14 sm:h-16 w-auto object-contain mx-auto"
            />
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Masuk ke TripKu
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Selamat Datang di TripKu, Teman Perjalanan Terbaikmu
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Akun"}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-100">
            Belum punya akun?{" "}
            <Link href="/auth" className="font-bold text-emerald-700 hover:underline">
              Daftar akun baru
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Memuat...</div>}>
      <UnifiedLoginForm />
    </Suspense>
  );
}
