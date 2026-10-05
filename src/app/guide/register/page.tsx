"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { AlertCircle, Info, Clock, CheckCircle2, Upload, FileText } from "lucide-react";

function GuideRegisterForm() {
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // KTP upload
  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpFileName, setKtpFileName] = useState<string | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [ktpError, setKtpError] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState("");

  const [languages, setLanguages] = useState("");
  const [region, setRegion] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [specialization, setSpecialization] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // REQ-2.6: Upload sertifikat via file PDF (opsional)
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateFileName, setCertificateFileName] = useState<string | null>(null);
  const [certificateError, setCertificateError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCertificateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setCertificateError("Format harus berupa file PDF (.pdf).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCertificateError("Ukuran file sertifikat maksimal 5 MB.");
      return;
    }
    setCertificateFile(file);
    setCertificateFileName(file.name);
  };

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKtpError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setKtpError("Format tidak valid. Gunakan foto JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setKtpError("Ukuran foto KTP melebihi 5 MB.");
      return;
    }
    setKtpFile(file);
    setKtpFileName(file.name);
    setKtpPreview(URL.createObjectURL(file));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    if (!ktpFile) {
      setError("Foto KTP wajib diupload.");
      return;
    }

    setLoading(true);

    try {
      // Upload KTP (wajib)
      const ktpFd = new FormData();
      ktpFd.append("file", ktpFile);
      ktpFd.append("folder", "ktp-guide");
      const ktpUploadRes = await fetch("/api/upload", { method: "POST", body: ktpFd });
      const ktpUploadData = await ktpUploadRes.json();
      if (!ktpUploadRes.ok) throw new Error(ktpUploadData.error || "Gagal mengupload foto KTP.");
      const ktpUrl = ktpUploadData.url;

      let certUrl = "";
      if (certificateFile) {
        const formData = new FormData();
        formData.append("file", certificateFile);
        formData.append("folder", "certificates-guide");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Gagal mengupload sertifikat.");
        certUrl = uploadData.url;
      }

      // Build a string for bio
      let bioDetails = `Bahasa: ${languages} | Wilayah: ${region} | Spesialisasi: ${specialization}`;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nik,
          email,
          phone,
          domicile: region,
          certificateUrl: certUrl || null,
          ktpImageUrl: ktpUrl,
          birthDate: birthDate || null,
          experienceYears: parseInt(experienceYears) || 1,
          bioDetails,
          password,
          role: "GUIDE",
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
              <span>Data Anda telah berhasil diterima.</span>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Akun Anda sedang <strong>menunggu verifikasi oleh Admin Sistem</strong>. Proses verifikasi biasanya memakan waktu 1-3 hari kerja.</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>Setelah diverifikasi, Anda dapat login ke portal Tour Guide menggunakan email dan password yang telah didaftarkan.</span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm transition-all"
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
            Daftar sebagai Tour Guide
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bergabung sebagai mitra Tour Guide profesional di TripKu.
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
          <span>Pendaftaran ini memerlukan <strong>verifikasi admin</strong> sebelum Anda dapat login. Mohon siapkan data yang lengkap.</span>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Informasi Pribadi & Identitas</span>
            </h3>

            {/* KTP Upload */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-teal-950 mb-0.5">
                    Upload Foto KTP <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Foto KTP wajib diupload sebagai dokumen verifikasi identitas.
                  </p>
                </div>
              </div>

              {ktpError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{ktpError}</span>
                </div>
              )}

              <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${ktpFile ? "border-teal-400 bg-white" : "border-slate-300 hover:border-teal-400 bg-white hover:bg-teal-50/30"}`}>
                <FileText className="w-5 h-5 text-teal-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {ktpFileName || "Klik untuk pilih foto KTP (JPG / PNG)"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {ktpFile ? "KTP siap disimpan ✓" : "Maksimal ukuran 5 MB"}
                  </span>
                </div>
                <Upload className="w-4 h-4 text-teal-500 shrink-0" />
                <input type="file" accept="image/*" onChange={handleKtpChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap (sesuai KTP) *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Budi Pratama" className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">NIK KTP (16 Digit) *</label>
                <input type="text" required maxLength={16} value={nik} onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  setNik(val);
                }} placeholder="3201..." className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 font-mono text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Lahir (KTP)</label>
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp *</label>
                <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="081234567890" className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email *</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="guide@email.com" className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Profil Profesional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bahasa yang Dikuasai *</label>
                <input type="text" required placeholder="Contoh: Indonesia, Inggris" value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah Operasional *</label>
                <input type="text" required placeholder="Contoh: Bali, Lombok" value={region} onChange={(e) => setRegion(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pengalaman (Tahun) *</label>
                <input type="number" min="0" required value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Spesialisasi *</label>
                <input type="text" required placeholder="Contoh: Wisata Alam, Budaya" value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          </div>

          {/* REQ-2.6: Upload Sertifikat via PDF (Opsional) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center justify-between">
              <span>Sertifikat Lisensi / Keahlian Tour Guide</span>
              <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Opsional</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload File Sertifikat (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleCertificateChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Format file wajib PDF (.pdf), ukuran maksimal 5 MB. Dokumen ini dapat dilihat oleh Admin Sistem untuk proses verifikasi.
              </p>
              {certificateFileName && (
                <div className="mt-2 text-xs font-semibold text-teal-700 bg-teal-50 p-2 rounded-lg border border-teal-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>File terpilih: {certificateFileName}</span>
                </div>
              )}
              {certificateError && (
                <div className="mt-2 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {certificateError}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Keamanan Akun</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi (Password) *</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi Password *</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? "Mendaftarkan..." : "Daftar sebagai Tour Guide"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default function GuideRegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center bg-slate-50 text-slate-500">Memuat...</div>}>
      <GuideRegisterForm />
    </Suspense>
  );
}
