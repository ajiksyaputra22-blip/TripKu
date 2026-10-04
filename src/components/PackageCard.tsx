"use client";

import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Users, ShieldCheck, ArrowRight, Layers, Star } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

export interface PackageData {
  id: string;
  name: string;
  slug: string;
  destination: string;
  price: number;
  durationDays: number;
  capacity: number;
  quotaLeft: number;
  coverImage: string;
  vehicle: string;
  accommodation: string;
  category?: string;
  dpPercentage?: number;
  facilities?: string;
  description?: string;
  rating?: number | null;
  reviewCount?: number;
  totalBookedPax?: number;
  totalBookings?: number;
  _count?: { bookings: number };
  travel?: {
    id: string;
    businessName: string;
    verificationStatus: string;
    logoUrl?: string | null;
  };
}

interface PackageCardProps {
  pkg: PackageData;
  onCompareToggle?: (pkg: PackageData) => void;
  isComparing?: boolean;
}

export default function PackageCard({ pkg, onCompareToggle, isComparing }: PackageCardProps) {
  const totalTerpesan = pkg.totalBookedPax ?? pkg.totalBookings ?? pkg._count?.bookings ?? 0;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-emerald-500/40 transition-all duration-300 overflow-hidden flex flex-col">
      {/* Image & Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={pkg.coverImage || "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800"}
          alt={pkg.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-800 shadow-sm backdrop-blur-xs">
            <Clock className="w-3 h-3 text-emerald-600" />
            {pkg.durationDays} Hari
          </span>
          {pkg.category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white shadow-sm backdrop-blur-xs">
              {pkg.category === "PANTAI" ? "🏖️ Pantai" :
                pkg.category === "GUNUNG" ? "⛰️ Gunung" :
                  pkg.category === "KOTA" ? "🏙️ Kota" :
                    pkg.category === "MUSEUM_BUDAYA" ? "🏛️ Budaya" :
                      pkg.category === "KULINER" ? "🍜 Kuliner" :
                        pkg.category === "RELIGI" ? "🕌 Religi" :
                          "🌿 Alam"}
            </span>
          )}
          {totalTerpesan > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700/90 text-white shadow-sm backdrop-blur-xs">
              <Users className="w-2.5 h-2.5" />
              {totalTerpesan} Terpesan
            </span>
          )}
          {pkg.quotaLeft <= 5 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/90 text-white shadow-sm backdrop-blur-xs animate-pulse">
              Sisa {pkg.quotaLeft} Kuota!
            </span>
          )}
        </div>

        {/* Compare Toggle Button */}
        {onCompareToggle && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onCompareToggle(pkg);
            }}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all shadow-sm ${isComparing
                ? "bg-emerald-600 text-white shadow-emerald-500/30 ring-2 ring-white"
                : "bg-black/40 hover:bg-black/60 text-white"
              }`}
            title={isComparing ? "Hapus dari perbandingan" : "Bandingkan paket ini"}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}

        {/* Bottom Destination */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center text-white text-xs font-medium drop-shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 mr-1 shrink-0" />
          <span className="truncate">{pkg.destination}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Provider & Rating Header */}
          <div className="flex items-center justify-between gap-1.5 text-xs text-slate-500 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-medium text-slate-700 truncate max-w-[140px]">
                {pkg.travel?.businessName || "Mitra Wisata Terpadu"}
              </span>
              {pkg.travel?.verificationStatus === "APPROVED" && (
                <span title="Terverifikasi Resmi">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </span>
              )}
            </div>

            {/* Rating Paket Berdasarkan Ulasan Review Asli */}
            {typeof pkg.reviewCount === "number" && pkg.reviewCount > 0 && pkg.rating ? (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{Number(pkg.rating).toFixed(1)}</span>
                <span className="text-[10px] text-slate-500 font-normal">({pkg.reviewCount})</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>5.0</span>
              </div>
            )}
          </div>

          {/* Package Title */}
          <Link href={`/packages/${pkg.slug || pkg.id}`}>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
              {pkg.name}
            </h3>
          </Link>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between gap-2">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">Mulai dari</span>
            <span className="text-lg font-extrabold text-emerald-600 tracking-tight leading-none block">
              {formatRupiah(pkg.price)}
            </span>
            <span className="text-[10px] text-slate-400">/ orang</span>
          </div>

          <Link
            href={`/packages/${pkg.slug || pkg.id}`}
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white group-hover:bg-emerald-600 transition-all shadow-xs"
          >
            <span>Detail</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
