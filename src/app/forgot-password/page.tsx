"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/Toast";

type Step = "REQUEST_OTP" | "VERIFY_OTP" | "RESET_PASSWORD";

function ForgotPasswordContent() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("REQUEST_OTP");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Detail WhatsApp
  const [targetPhone, setTargetPhone] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  // ==========================================
  // Langkah 1: Kirim Kode OTP ke WhatsApp
  // ==========================================
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setWhatsappUrl(null);
    setOtp("");

    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirimkan kode OTP ke WhatsApp.");
      }

      toast.success(data.message || "Kode OTP telah dikirimkan ke WhatsApp Anda!");

      if (data.targetPhone) {
        setTargetPhone(data.targetPhone);
      }
      if (data.whatsappUrl) {
        setWhatsappUrl(data.whatsappUrl);
        // Buka WhatsApp langsung
        try {
          window.open(data.whatsappUrl, "_blank");
        } catch {
          // Abaikan jika pop-up blocker browser aktif
        }
      }

      // Berpindah ke Langkah 2: Validasi OTP
      setStep("VERIFY_OTP");
    } catch (err: any) {
      const msg = err.message || "Terjadi kesalahan saat memproses permintaan.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Langkah 2: Validasi Kode OTP
  // ==========================================
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      const msg = "Kode OTP harus terdiri dari 6 digit angka.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Kode OTP tidak valid atau sudah kedaluwarsa.");
      }

      toast.success(data.message || "Kode OTP berhasil diverifikasi!");
      // Berpindah ke Langkah 3: Pembuatan Kata Sandi Baru
      setStep("RESET_PASSWORD");
    } catch (err: any) {
      const msg = err.message || "Gagal memverifikasi kode OTP.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Langkah 3: Simpan Kata Sandi Baru
  // ==========================================
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      const msg = "Kata sandi baru minimal 6 karakter.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = "Konfirmasi kata sandi tidak cocok.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui kata sandi.");
      }

      setSuccessMessage(data.message || "Kata sandi Anda berhasil diperbarui!");
      toast.success("Kata sandi berhasil diperbarui! Mengalihkan ke dashboard...");

      // Update auth status in current browser session
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-change"));
      }

      const targetUrl = data.redirectUrl || "/";
      setTimeout(() => {
        window.location.href = targetUrl;
      }, 1200);
    } catch (err: any) {
      const msg = err.message || "Gagal mengatur kata sandi baru.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity mb-3">
            <img
              src="/logo.png"
              alt="TripKu Logo"
              className="h-14 sm:h-16 w-auto object-contain mx-auto"
            />
          </Link>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {step === "RESET_PASSWORD" && "Buat kata sandi baru yang aman untuk akun Anda"}
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200 shadow-xl space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAHAP 1: INPUT NOMOR WHATSAPP & KIRIM OTP             */}
          {/* ==================================================== */}
          {step === "REQUEST_OTP" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP Terdaftar *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : null}
                <span>{loading ? "Mengirimkan ke WhatsApp..." : "Kirim Kode OTP ke WhatsApp"}</span>
              </button>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAHAP 2: VALIDASI KODE OTP DARI WHATSAPP             */}
          {/* ==================================================== */}
          {step === "VERIFY_OTP" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              {/* WhatsApp Delivery Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="space-y-0.5 flex-1">
                    <p className="font-bold text-emerald-900 text-sm">Kode OTP Telah Dikirim</p>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Kami telah mengirimkan 6 digit kode verifikasi ke nomor WhatsApp:{" "}
                      <strong className="text-emerald-950 font-bold">{targetPhone || phone}</strong>.
                    </p>
                  </div>
                </div>

                {whatsappUrl && (
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-xs"
                    >
                      <span>Buka Pesan di WhatsApp</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan Kode OTP dari WhatsApp (6 Digit) *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Contoh: 123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold tracking-widest rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Kode verifikasi berlaku selama 15 menit. Masukkan kodenya lalu klik tombol verifikasi di bawah.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.trim().length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{loading ? "Memvalidasi OTP..." : "Verifikasi Kode OTP"}</span>
              </button>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAHAP 3: PEMBUATAN KATA SANDI BARU                   */}
          {/* ==================================================== */}
          {step === "RESET_PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in">

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kata Sandi Baru *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                <span>{loading ? "Menyimpan Kata Sandi..." : "Simpan Kata Sandi Baru"}</span>
              </button>
            </form>
          )}

          <div className="text-center pt-3 border-t border-slate-100">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">
          Memuat...
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}
