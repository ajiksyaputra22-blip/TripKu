"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nik, setNik] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name || "");
          setPhone(data.user.phone || "");
          setNik(data.user.nik || "");
          if (data.user.avatarUrl) {
            setAvatarPreview(data.user.avatarUrl);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran foto profil maks 3MB.");
      return;
    }
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
    if (!name) {
      setError("Nama lengkap wajib diisi.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      let avatarUrl = profile?.avatarUrl;

      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, "avatars");
      }

      const res = await fetch("/api/profile/customer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, nik, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan profil");

      setSuccess(true);
      // Automatically hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
      
      // Update local profile state
      setProfile((prev: any) => ({ ...prev, ...data.user }));
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
            <span>Pengaturan Akun</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Profil Saya
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola informasi pribadi dan identitas Anda.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">Profil Anda berhasil diperbarui!</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-medium mt-0.5">{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Foto Profil Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-sm font-bold text-slate-900 mb-4">
              Foto Profil
            </h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative shrink-0 group cursor-pointer">
                <div className="w-24 h-24 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 sm:w-8 sm:h-8 text-emerald-300" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                  <Upload className="w-5 h-5" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <div className="text-center sm:text-left">
                <label className="cursor-pointer inline-flex items-center justify-center sm:justify-start gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors w-full sm:w-auto">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Ubah Foto Profil</span>
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">Format: JPG, PNG, atau WEBP. Ukuran maksimal 3MB.</p>
              </div>
            </div>
          </div>

          {/* Informasi Dasar Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Informasi Pribadi
            </h2>
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Alamat Email <span className="text-slate-400 font-normal">(Tidak dapat diubah)</span>
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ""}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap Anda"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 transition-shadow"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Induk Kependudukan (NIK KTP)
              </label>
              <input
                type="text"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ""))}
                placeholder="16 Digit NIK KTP Anda"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono transition-shadow"
              />
              <p className="text-[10px] text-slate-400 mt-1.5">
                Berguna jika paket wisata membutuhkan identitas resmi untuk keperluan asuransi atau tiket masuk khusus.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan Profil</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
