"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { AlertCircle, Info, Upload, FileText, CheckCircle2, Clock } from "lucide-react";

function TravelRegisterForm() {
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [agencyPhone, setAgencyPhone] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Izin usaha file upload
  const [izinUsahaFile, setIzinUsahaFile] = useState<File | null>(null);
  const [izinUsahaName, setIzinUsahaName] = useState<string | null>(null);
  const [izinUsahaError, setIzinUsahaError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleIzinUsahaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIzinUsahaError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setIzinUsahaError("Format tidak valid. Gunakan JPG, PNG, WEBP, atau PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setIzinUsahaError("Ukuran file maksimal 5 MB.");
      return;
    }
    setIzinUsahaFile(file);
    setIzinUsahaName(file.name);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (!izinUsahaFile) {
      setError("File Izin Usaha wajib diupload.");
      return;
    }

    setLoading(true);

    try {
      // Upload izin usaha terlebih dahulu
      const formData = new FormData();
      formData.append("file", izinUsahaFile);
      formData.append("folder", "izin-usaha");
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengupload Izin Usaha.");
      const izinUsahaUrl = uploadData.url;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nik,
          email,
          phone,
          businessName,
          address,
          agencyPhone,
          siupUrl: izinUsahaUrl,
          description: description?.trim() || null,
          password,
          role: "TRAVEL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Pendaftaran akun gagal.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat pendaftaran akun.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Pendaftaran Berhasil!</h2>
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm text-left space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Data dan dokumen Anda telah berhasil diterima.</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Akun Anda sedang <strong>menunggu verifikasi oleh Admin Sistem</strong>. Proses verifikasi biasanya memakan waktu 1-3 hari kerja.</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Setelah diverifikasi, Anda dapat login ke portal Agen Travel menggunakan email dan password yang telah didaftarkan.</span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-all"
          >
            Ke Halaman Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        
        <div className="text-center">
          <Link href="/" className="inline-block hover:opacity-90 transition-opacity mb-3">
            <img 
              src="/logo.png" 
              alt="TripKu Logo" 
              className="h-12 w-auto object-contain mx-auto"
            />
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Daftar sebagai Agen Travel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bergabung sebagai mitra travel dan kelola paket wisata Anda di TripKu.
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            isi formulir lengkap mitra
          </span>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Pendaftaran ini memerlukan <strong>verifikasi admin</strong> sebelum Anda dapat login. Siapkan file Izin Usaha Anda.</span>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Informasi Penanggung Jawab</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penanggung Jawab *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK KTP *</label>
                <input type="text" required maxLength={16} value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
                <input type="text" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Informasi Agensi Travel</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Agen Travel *</label>
                <input type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Agen Travel *</label>
                <textarea required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 min-h-[80px]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon Agen *</label>
                <input type="text" required value={agencyPhone} onChange={(e) => setAgencyPhone(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Agen</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 min-h-[80px]" />
              </div>
            </div>
          </div>

          {/* Izin Usaha Upload */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Dokumen Izin Usaha *</h3>
            <p className="text-xs text-slate-500">Upload Surat Izin Usaha Perdagangan (SIUP), TDUP, atau dokumen legalitas usaha lainnya. Format: JPG, PNG, atau PDF. Maks 5 MB.</p>
            
            {izinUsahaError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{izinUsahaError}</span>
              </div>
            )}

            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${izinUsahaFile ? "border-orange-400 bg-orange-50" : "border-slate-300 hover:border-orange-400 bg-slate-50 hover:bg-orange-50/30"}`}>
              {izinUsahaFile ? (
                <>
                  <FileText className="w-5 h-5 text-orange-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-orange-900 block truncate">{izinUsahaName}</span>
                    <span className="text-[11px] text-orange-600">File siap diupload ✓</span>
                  </div>
                  <Upload className="w-4 h-4 text-orange-400" />
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Klik untuk pilih file Izin Usaha</span>
                    <span className="text-[11px] text-slate-400">JPG, PNG, WEBP, atau PDF — maks 5 MB</span>
                  </div>
                </>
              )}
              <input type="file" accept="image/*,application/pdf" onChange={handleIzinUsahaChange} className="hidden" />
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Keamanan Akun</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password) *</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Password *</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md shadow-orange-600/30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Mendaftarkan & Mengupload..." : "Daftar sebagai Mitra Travel"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function TravelRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">Memuat...</div>}>
      <TravelRegisterForm />
    </Suspense>
  );
}

