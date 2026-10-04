"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, AlertCircle, CheckCircle2, MapPin, Phone } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function TravelProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [bankName, setBankName] = useState("Bank BCA");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");

  // Surat Izin Usaha (SIUP/NIB/TDUP) — Dokumen legalitas utama
  const [siupFile, setSiupFile] = useState<File | null>(null);
  const [siupPreview, setSiupPreview] = useState<string | null>(null);
  const [siupError, setSiupError] = useState<string | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile/travel");
        const data = await res.json();
        if (data.travel) {
          setProfile(data.travel);
          setBusinessName(data.travel.businessName || "");
          setAddress(data.travel.address || "");
          setPhone(data.travel.phone || "");
          setWhatsapp(data.travel.whatsapp || "");
          let rawDesc = data.travel.description || "";
          let siupFromDesc = null;
          if (rawDesc.includes("[IZIN_USAHA_URL]:")) {
            siupFromDesc = rawDesc.split("[IZIN_USAHA_URL]:")[1]?.trim();
            rawDesc = rawDesc.replace(/\[IZIN_USAHA_URL\]:[^\s\n\r]+/gi, "").trim();
          }

          setDescription(rawDesc);
          setBankName(data.travel.bankName || "Bank BCA");
          setBankAccount(data.travel.bankAccount || "");
          setBankHolder(data.travel.bankHolder || "");
          
          if (data.travel.logoUrl) setLogoPreview(data.travel.logoUrl);
          if (data.travel.siupUrl || siupFromDesc) setSiupPreview(data.travel.siupUrl || siupFromDesc);
        }
      } catch { } finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>, type: "SIUP") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { 
      setSiupError("Maksimal ukuran file 5 MB.");
      return; 
    }
    setSiupError(null);
    setSiupFile(file);
    setSiupPreview(URL.createObjectURL(file));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Format tidak valid. Gunakan JPG/PNG/WEBP."); return; }
    if (file.size > 3 * 1024 * 1024) { toast.error("Ukuran foto logo maks 3MB."); return; }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
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
    if (!siupFile && !siupPreview) { setError("Dokumen Surat Izin Usaha (SIUP/NIB) wajib diupload."); return; }
    setSaving(true); setError(null);
    try {
      let logoUrl = logoPreview;
      let siupUrl = siupPreview;

      if (logoFile) logoUrl = await uploadFile(logoFile, "logos");
      if (siupFile) siupUrl = await uploadFile(siupFile, "documents");

      const res = await fetch("/api/profile/travel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          businessName, address, phone, whatsapp, description,
          bankName, bankAccount, bankHolder,
          logoUrl, siupUrl
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(true);
      setTimeout(() => router.push("/travel/dashboard"), 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan profil.");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
    </div>
  );

  const isApproved = profile?.verificationStatus === "APPROVED";
  const isPending = profile?.verificationStatus === "PENDING";
  const isRejected = profile?.verificationStatus === "REJECTED";

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <span>Travel Provider Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Profil Perusahaan
          </h1>
          
          {isPending && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Menunggu Verifikasi Admin</span>
                Silakan lengkapi dokumen Surat Izin Usaha perusahaan agar akun Anda dapat diverifikasi.
              </div>
            </div>
          )}
          {isApproved && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-bold">Akun Terverifikasi. Anda dapat menggunakan seluruh fitur agen travel.</span>
            </div>
          )}
          {isRejected && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm">Verifikasi Ditolak</span>
                Silakan perbaiki dokumen legalitas atau hubungi admin.
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            Profil berhasil disimpan! Mengarahkan ke dashboard...
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo & Info Dasar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Informasi Dasar Perusahaan
            </h2>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="shrink-0 text-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 mx-auto mb-2 overflow-hidden bg-slate-50 relative group flex items-center justify-center">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">Upload Logo<br/>(Maks 3MB)</div>
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Perusahaan (Brand)</label>
                  <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Contoh: PT Wisata Terpadu" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">Deskripsi Singkat</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Ceritakan singkat tentang layanan travel Anda..."></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Kontak & Alamat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Alamat Lengkap Operasional</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)} required rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Jl. Contoh No. 123..."></textarea>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> No. Telepon Kantor</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="021-..." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> WhatsApp CS</label>
              <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="08..." />
            </div>
          </div>

          {/* Dokumen Legalitas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
              <FileText className="w-4 h-4 text-emerald-600" /> Dokumen Legalitas Perusahaan (Wajib)
            </h2>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">
                Surat Izin Usaha (SIUP / NIB / TDUP) <span className="text-rose-500">*</span>{" "}
                <span className="text-slate-400 font-normal">— Dokumen Legalitas Resmi Travel</span>
              </label>
              {!siupPreview ? (
                <div className="relative border-2 border-dashed border-emerald-300 rounded-2xl p-6 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors group text-center cursor-pointer">
                  <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => handleDocumentChange(e, "SIUP")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-emerald-100 transition-colors">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 block">Upload Surat Izin Usaha (SIUP / NIB)</span>
                  <span className="text-xs text-slate-500 mt-1 block">Format: JPG, PNG, WEBP, atau PDF — Maks. 5MB</span>
                  {siupError && <p className="text-rose-500 text-xs font-semibold mt-2">{siupError}</p>}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-700">Surat Izin Usaha Terupload ✓</div>
                      <a href={siupPreview} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-700 font-semibold hover:underline">Lihat Dokumen</a>
                    </div>
                  </div>
                  <label className="cursor-pointer text-xs font-bold text-emerald-700 hover:underline">
                    Ganti File
                    <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => handleDocumentChange(e, "SIUP")} className="hidden" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Rekening */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Rekening Pencairan & Pembayaran
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Bank</label>
                <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm">
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank BRI">Bank BRI</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="Gopay">GoPay</option>
                  <option value="OVO">OVO</option>
                  <option value="Dana">DANA</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nomor Rekening / E-Wallet</label>
                <input type="text" value={bankAccount} onChange={e => setBankAccount(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Contoh: 1234567890" />
              </div>
              <div className="sm:col-span-3">
                <label className="text-xs font-bold text-slate-700 mb-1 block">Nama Pemilik Rekening</label>
                <input type="text" value={bankHolder} onChange={e => setBankHolder(e.target.value)} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="Nama sesuai buku tabungan" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/travel/dashboard" className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">
              Batal
            </Link>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md disabled:bg-slate-400">
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
