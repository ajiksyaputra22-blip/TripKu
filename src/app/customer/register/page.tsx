"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

function CustomerRegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role: "CUSTOMER",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Pendaftaran akun gagal.");
      }

      router.push("/explore");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat pendaftaran akun.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        
        <div className="text-center">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity mb-3">
            <img 
              src="/logo.png" 
              alt="TripKu Logo" 
              className="h-12 w-auto object-contain mx-auto"
            />
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daftar sebagai Customer
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Buat akun untuk memesan paket liburan favorit Anda di TripKu.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            isi data akun Anda
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Pratama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Email
            </label>
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 08123456789"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi (Password)
            </label>
            <input
              type="password"
              required
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              type="password"
              required
              placeholder="Masukkan ulang password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Mendaftarkan..." : "Daftar Akun Sekarang"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function CustomerRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">Memuat...</div>}>
      <CustomerRegisterForm />
    </Suspense>
  );
}
