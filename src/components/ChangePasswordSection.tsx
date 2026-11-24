"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck, AlertCircle, CheckCircle2, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/Toast";

interface ChangePasswordSectionProps {
  onSuccess?: () => void;
}

export default function ChangePasswordSection({ onSuccess }: ChangePasswordSectionProps) {
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingRule, setCheckingRule] = useState(true);
  const [canChange, setCanChange] = useState(true);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(null);
  const [nextAllowedDate, setNextAllowedDate] = useState<string | null>(null);
  const [daysRemaining, setDaysRemaining] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch status izin perubahan password (batas 2 bulan)
  const fetchStatus = async () => {
    setCheckingRule(true);
    try {
      const res = await fetch("/api/profile/change-password");
      const data = await res.json();
      if (res.ok) {
        setCanChange(data.canChange);
        setLastChangedAt(data.lastChangedAt);
        setNextAllowedDate(data.nextAllowedDate);
        setDaysRemaining(data.daysRemaining || 0);
      }
    } catch {
      // fallback
    } finally {
      setCheckingRule(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Seluruh kolom kata sandi wajib diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi baru tidak sesuai.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Kata sandi baru tidak boleh sama dengan kata sandi saat ini.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah kata sandi.");
      }

      setSuccess(data.message || "Kata sandi berhasil diubah!");
      toast.success(data.message || "Kata sandi berhasil diubah!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchStatus();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  const formatLocalDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Ubah Kata Sandi Akun</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Jaga keamanan akun Anda. Pengubahan kata sandi dibatasi maksimal <strong>2 bulan sekali</strong>.
          </p>
        </div>

        {lastChangedAt && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">
            Terakhir diubah: {formatLocalDate(lastChangedAt)}
          </span>
        )}
      </div>

      {/* Jika masih dalam masa tenggang 2 bulan */}
      {!canChange && nextAllowedDate && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Pengubahan Kata Sandi Sedang Dibatasi (Aturan 2 Bulan)</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Anda baru saja memperbarui kata sandi akun pada{" "}
              <strong>{lastChangedAt ? formatLocalDate(lastChangedAt) : "-"}</strong>. Demi keamanan, Anda baru dapat
              mengubah kata sandi kembali pada <strong>{formatLocalDate(nextAllowedDate)}</strong> (sekitar{" "}
              <strong>{daysRemaining} hari lagi</strong>).
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Kata Sandi Saat Ini *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type={showCurrent ? "text" : "password"}
              required
              disabled={!canChange || loading || checkingRule}
              placeholder="Masukkan kata sandi saat ini"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              disabled={!canChange}
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 disabled:opacity-40"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kata Sandi Baru *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showNew ? "text" : "password"}
                required
                minLength={6}
                disabled={!canChange || loading || checkingRule}
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={!canChange}
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 disabled:opacity-40"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ulangi Sandi Baru *
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showConfirm ? "text" : "password"}
                required
                minLength={6}
                disabled={!canChange || loading || checkingRule}
                placeholder="Konfirmasi kata sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={!canChange}
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 disabled:opacity-40"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={!canChange || loading || checkingRule}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading && <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />}
            <span>{loading ? "Menyimpan Perubahan..." : "Simpan Kata Sandi"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
