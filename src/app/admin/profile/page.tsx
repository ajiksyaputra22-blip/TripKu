"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, User, Mail } from "lucide-react";
import { useToast } from "@/components/Toast";
import ChangePasswordSection from "@/components/ChangePasswordSection";

export default function AdminProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.user || data.user.role !== "ADMIN") {
          router.replace("/login");
          return;
        }
        setProfile(data.user);
      } catch {
        toast.error("Gagal memuat data profil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Memuat profil…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/dashboard"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-700" />
              Profil Administrator
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola keamanan akun administrator sistem.
            </p>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{profile.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5" />
                <span>{profile.email}</span>
              </div>
              <span className="inline-block mt-1.5 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-800 text-white">
                ADMINISTRATOR
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <ChangePasswordSection />
      </div>
    </div>
  );
}
