"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function GuideProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [domicile, setDomicile] = useState("");

  const [bio, setBio] = useState("");
  const [experienceYears, setExperienceYears] = useState("1");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [bankName, setBankName] = useState("Bank BCA");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  const [ktpFile, setKtpFile] = useState<File | null>(null);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [ktpError, setKtpError] = useState<string | null>(null);

  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [certFileName, setCertFileName] = useState<string | null>(null);
  const [certError, setCertError] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/worker");
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name || "");
          setNik(data.user.nik || "");
          setPhone(data.user.phone || "");
          setDomicile(data.user.workerProfile?.domicile || "");
          let rawBio = data.user.workerProfile?.bio || "";
          let certFromBio = null;
          if (rawBio.includes("[CERTIFICATE_PDF_URL]:")) {
            certFromBio = rawBio.split("[CERTIFICATE_PDF_URL]:")[1]?.split("|")[0]?.trim();
            rawBio = rawBio
              .replace(/\[CERTIFICATE_PDF_URL\]:[^\s\n\r|]+/gi, "")
              .replace(/\|\s*\|/g, "|")
              .replace(/^\s*\|\s*/, "")
              .replace(/\s*\|\s*$/, "")
              .trim();
          }
          setBio(rawBio);
          setExperienceYears(String(data.user.workerProfile?.experienceYears || 1));
          setBankName(data.user.workerProfile?.bankName || "Bank BCA");
          setBankAccount(data.user.workerProfile?.bankAccount || "");
          setBankHolder(data.user.workerProfile?.bankHolder || data.user.name || "");
          setAddress(data.user.workerProfile?.address || "");
          if (data.user.workerProfile?.birthDate) {
            setBirthDate(new Date(data.user.workerProfile.birthDate).toISOString().split("T")[0]);
          }
          if (data.user.workerProfile?.ktpImageUrl) setKtpPreview(data.user.workerProfile.ktpImageUrl);
          const resolvedCert = data.user.workerProfile?.certificateUrl || certFromBio;
          if (resolvedCert) {
            setCertPreview(resolvedCert);
            setCertFileName("Sertifikat_Lisensi_Tour_Guide.pdf");
          }
          if (data.user.avatarUrl) setAvatarPreview(data.user.avatarUrl);
        }
      } catch { } finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const parseNikToBirthDate = (nikStr: string): string => {
    if (!nikStr || nikStr.length < 12) return "";
    try {
      const dayRaw = parseInt(nikStr.substring(6, 8), 10);
      const monthRaw = parseInt(nikStr.substring(8, 10), 10);
      const yearRaw = parseInt(nikStr.substring(10, 12), 10);
      const day = dayRaw > 40 ? dayRaw - 40 : dayRaw;
      const currentYearTwoDigits = new Date().getFullYear() % 100;
      const fullYear = yearRaw > currentYearTwoDigits ? 1900 + yearRaw : 2000 + yearRaw;
      const dd = String(day).padStart(2, "0");
      const mm = String(monthRaw).padStart(2, "0");
      return `${fullYear}-${mm}-${dd}`;
    } catch {
      return "";
    }
  };

  const handleKtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKtpError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setKtpError("Format tidak valid. Gunakan JPG/PNG/WEBP."); return; }
    if (file.size > 5 * 1024 * 1024) { setKtpError("Ukuran foto KTP melebihi 5 MB."); return; }
    setKtpFile(file);
    setKtpPreview(URL.createObjectURL(file));
  };

  const handleCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      setCertError("Format file harus PDF atau Gambar.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCertError("Ukuran file sertifikat maksimal 5 MB.");
      return;
    }
    setCertFile(file);
    setCertFileName(file.name);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Ukuran foto profil maks 3MB."); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload gagal");
    return data.url;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktpFile && !ktpPreview) { setError("Foto KTP wajib diupload untuk melengkapi profil."); return; }
    setSaving(true); setError(null);
    try {
      let ktpImageUrl = ktpPreview;
      let avatarUrl = avatarPreview;
      let certificateUrl = certPreview;

      if (ktpFile) ktpImageUrl = await uploadFile(ktpFile, "ktp");
      if (avatarFile) avatarUrl = await uploadFile(avatarFile, "avatars");
      if (certFile) certificateUrl = await uploadFile(certFile, "certificates");

      const res = await fetch("/api/profile/worker", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          nik,
          phone,
          domicile,
          bio,
          experienceYears,
          bankName,
          bankAccount,
          bankHolder,
          ktpImageUrl,
          certificateUrl,
          avatarUrl,
          address,
          birthDate: birthDate || undefined
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => router.push("/guide/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan profil.");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
    </div>
  );

  const isCompleted = profile?.workerProfile?.profileCompleted;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700 mb-1">
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isCompleted ? "Edit Profil Tour Guide" : "Lengkapi Profil Tour Guide Anda"}
          </h1>
          {!isCompleted ? (
            <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-950 mb-0.5">Wajib Lengkapi Profil Sebelum Mengakses Akun</span>
                <span>
                  Akun Tour Guide Anda telah aktif. Sebelum dapat mengakses dashboard, menerima penugasan dari agen travel, atau melamar perjalanan, Anda wajib melengkapi data profil dan dokumen (KTP) di bawah ini terlebih dahulu.
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profil Anda sudah lengkap & aktif. Anda dapat memperbarui data kapan saja jika ada perubahan.</span>
            </div>
          )}
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profil berhasil disimpan! Mengalihkan ke dashboard...</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">

          {/* Foto Profil */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Foto Profil
            </h2>
            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 overflow-hidden flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-teal-300">👤</span>
                  )}
                </div>
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto Profil</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">JPG/PNG/WEBP, maks 3MB. Foto ini ditampilkan saat customer mereview Anda.</p>
              </div>
            </div>
          </div>

          {/* Biodata */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Biodata Profesional
            </h2>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio Singkat / Deskripsi Diri</label>
              <textarea
                rows={3}
                placeholder="Ceritakan pengalaman Anda sebagai tour guide, destinasi yang dikuasai, dll..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pengalaman (Tahun)</label>
              <input
                type="number" min="0" max="50"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-32 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>
          </div>

          {/* Upload KTP */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-600" />
              Foto KTP (Wajib) *
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Upload foto KTP Anda sebagai verifikasi identitas.
            </p>

            {ktpError && (
              <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{ktpError}</span>
              </div>
            )}

            {!ktpPreview ? (
              <label className="border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-2xl p-6 flex flex-col items-center cursor-pointer bg-slate-50 hover:bg-teal-50/30 transition-all text-center">
                <FileText className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-700">Klik untuk upload foto KTP</span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPG/PNG/WEBP, maks 5 MB</span>
                <input type="file" accept="image/*" onChange={handleKtpChange} className="hidden" />
              </label>
            ) : (
              <div className="space-y-4">
                <img src={ktpPreview} alt="KTP Preview" className="w-full h-48 object-contain rounded-xl border border-slate-200 bg-slate-100" />
                <label className="cursor-pointer text-[11px] text-teal-700 hover:underline font-semibold flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Ganti foto KTP
                  <input type="file" accept="image/*" onChange={handleKtpChange} className="hidden" />
                </label>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-bold text-slate-900">
                Sertifikat Lisensi / Keahlian Tour Guide (Opsional)
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Opsional
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Upload sertifikat pemandu wisata dari BNSP/HPI dalam format file PDF atau Gambar asli. Memperbesar peluang Anda dipilih oleh Agensi Travel.
            </p>

            {certError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{certError}</span>
              </div>
            )}

            <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${certFileName || certPreview ? "border-teal-400 bg-teal-50" : "border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/30"}`}>
              {certFileName || certPreview ? (
                <>
                  <FileText className="w-5 h-5 text-teal-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-teal-900 block truncate">
                      {certFileName || "Sertifikat_Lisensi_Guide.pdf"}
                    </span>
                    <span className="text-[11px] text-teal-600">Dokumen tersimpan ✓</span>
                  </div>
                  <Upload className="w-4 h-4 text-teal-400" />
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Klik untuk pilih file Sertifikat (PDF)</span>
                    <span className="text-[11px] text-slate-400">PDF atau Gambar — maks 5 MB</span>
                  </div>
                </>
              )}
              <input type="file" accept="application/pdf,image/*" onChange={handleCertChange} className="hidden" />
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Biodata Lengkap Guide (Sesuai KTP)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai KTP) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={nik}
                  onChange={(e) => {
                    setNik(e.target.value.replace(/\D/g, "").slice(0, 16));
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Tepat 16 digit NIK. Bisa diedit manual atau auto-fill dari KTP.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp / HP Aktif <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kota / Wilayah Domisili<span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bandung, Yogyakarta, dsb."
                  value={domicile}
                  onChange={(e) => setDomicile(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Digunakan untuk pencocokan pelamaran paket sesuai domisili.</span>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Lahir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Otomatis terisi dari 16 digit NIK Anda atau tentukan manual.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Lengkap Domisili (Sesuai KTP) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="Contoh: Jl. Mangga Dua No. 12, RT 02/RW 04, Kel. Sukajadi, Kec. Sukasari, Kota Bandung, Jawa Barat"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900 leading-relaxed"
              />
            </div>
          </div>

          {/* Rekening Bank */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              Rekening Bank (Penerimaan Fee)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Bank *</label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                >
                  {["Bank BCA", "Bank Mandiri", "Bank BNI", "Bank BRI", "Bank BSI", "Bank Jago", "Bank CIMB Niaga"].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">No. Rekening *</label>
                <input
                  type="text" required placeholder="Contoh: 8820192834"
                  value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Atas Nama *</label>
                <input
                  type="text" required placeholder="Nama di buku tabungan"
                  value={bankHolder} onChange={(e) => setBankHolder(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              {saving ? "Menyimpan..." : "Simpan & Lengkapi Profil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
