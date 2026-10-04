"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PackageCard, { PackageData } from "@/components/PackageCard";
import { Search, Filter, RefreshCw, Layers, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import { useToast } from "@/components/Toast";

function ExploreContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialDuration = searchParams.get("duration") || "ALL";

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [destination, setDestination] = useState("ALL");
  const [originCity, setOriginCity] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [duration, setDuration] = useState(initialDuration);
  const [maxPrice, setMaxPrice] = useState<number>(10000000);
  const [sortBy, setSortBy] = useState<"POPULAR" | "RATING" | "PRICE_ASC" | "PRICE_DESC" | "NEWEST">("POPULAR");

  // Best Seller packages
  const [bestSellers, setBestSellers] = useState<PackageData[]>([]);

  // Comparison State
  const [compareList, setCompareList] = useState<PackageData[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("compare_packages");
      if (saved) setCompareList(JSON.parse(saved));
    } catch { }
  }, []);

  const handleToggleCompare = (pkg: PackageData) => {
    const exists = compareList.some((p) => p.id === pkg.id);
    if (exists) {
      const updated = compareList.filter((p) => p.id !== pkg.id);
      setCompareList(updated);
      try { localStorage.setItem("compare_packages", JSON.stringify(updated)); } catch { }
      toast.info(`Paket "${pkg.name}" dihapus dari perbandingan.`);
    } else {
      if (compareList.length >= 4) {
        toast.warning("Maksimal 4 paket dapat dibandingkan sekaligus.");
        return;
      }
      const updated = [...compareList, pkg];
      setCompareList(updated);
      try { localStorage.setItem("compare_packages", JSON.stringify(updated)); } catch { }
      toast.success(`Paket "${pkg.name}" ditambahkan ke perbandingan.`);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.set("search", search);
      if (destination && destination !== "ALL") query.set("destination", destination);
      if (originCity && originCity !== "ALL") query.set("originCity", originCity);
      if (category && category !== "ALL") query.set("category", category);
      if (duration && duration !== "ALL") query.set("duration", duration);
      if (maxPrice < 10000000) query.set("maxPrice", maxPrice.toString());

      const res = await fetch(`/api/packages?${query.toString()}`);
      const data = await res.json();
      const pkgs = data.packages || [];
      setPackages(pkgs);

      // Determine best sellers: urutkan dari total orang yang memesan (kumulatif) terbanyak ke paling sedikit, lalu ulasan terbanyak & rating
      const sorted = [...pkgs].sort((a: any, b: any) => {
        const aCount = a.totalBookedPax ?? a.totalBookings ?? a._count?.bookings ?? 0;
        const bCount = b.totalBookedPax ?? b.totalBookings ?? b._count?.bookings ?? 0;
        if (bCount !== aCount) return bCount - aCount;
        const aRev = a.reviewCount || 0;
        const bRev = b.reviewCount || 0;
        if (bRev !== aRev) return bRev - aRev;
        return (b.rating || 0) - (a.rating || 0);
      });
      setBestSellers(sorted.filter((p: any) => (p.totalBookedPax ?? p.totalBookings ?? p._count?.bookings ?? 0) > 0).slice(0, 4));
    } catch (e) {
      console.error(e);
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const sortedPackages = useMemo(() => {
    const list = [...packages];
    if (sortBy === "POPULAR") {
      list.sort((a: any, b: any) => {
        const aCount = a.totalBookedPax ?? a.totalBookings ?? a._count?.bookings ?? 0;
        const bCount = b.totalBookedPax ?? b.totalBookings ?? b._count?.bookings ?? 0;
        if (bCount !== aCount) return bCount - aCount;
        const aRev = a.reviewCount || 0;
        const bRev = b.reviewCount || 0;
        if (bRev !== aRev) return bRev - aRev;
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (sortBy === "RATING") {
      list.sort((a: any, b: any) => {
        const rDiff = (b.rating || 0) - (a.rating || 0);
        if (rDiff !== 0) return rDiff;
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      });
    } else if (sortBy === "PRICE_ASC") {
      list.sort((a: any, b: any) => a.price - b.price);
    } else if (sortBy === "PRICE_DESC") {
      list.sort((a: any, b: any) => b.price - a.price);
    } else if (sortBy === "NEWEST") {
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [packages, sortBy]);

  useEffect(() => {
    fetchPackages();
  }, [destination, originCity, category, duration, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPackages();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Katalog Paket Perjalanan Wisata
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Telusuri dan saring berbagai pilihan tur wisata resmi dari agensi travel terpercaya di seluruh Indonesia.
          </p>
        </div>

        {/* Search & Filter Bar */}
        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-8">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

            {/* Search Input */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Kata Kunci
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama/tujuan..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Kategori Wisata
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="WISATA_ALAM">🌿 Wisata Alam</option>
                <option value="PANTAI">🏖️ Wisata Pantai</option>
                <option value="GUNUNG">⛰️ Gunung & Hiking</option>
                <option value="KOTA">🏙️ Wisata Kota</option>
                <option value="MUSEUM_BUDAYA">🏛️ Museum & Budaya</option>
                <option value="RELIGI">🕌 Religi & Sejarah</option>
                <option value="KULINER">🍜 Kuliner Nusantara</option>
              </select>
            </div>

            {/* Origin City Filter (Domisili Keberangkatan) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Kota Asal
              </label>
              <select
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              >
                <option value="ALL">Semua Kota</option>
                <option value="Jakarta">Jakarta</option>
                <option value="Bandung">Bandung</option>
                <option value="Surabaya">Surabaya</option>
                <option value="Semarang">Semarang</option>
                <option value="Yogyakarta">Yogyakarta</option>
                <option value="Palembang">Palembang</option>
                <option value="Makassar">Makassar</option>
                <option value="Medan">Medan</option>
                <option value="Denpasar">Denpasar / Bali</option>
                <option value="Malang">Malang</option>
              </select>
            </div>

            {/* Destination Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Destinasi
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              >
                <option value="ALL">Semua Destinasi</option>
                <option value="Labuan Bajo">Labuan Bajo (NTT)</option>
                <option value="Bromo">Bromo & Ijen (Jatim)</option>
                <option value="Raja Ampat">Raja Ampat (Papua)</option>
                <option value="Nusa Penida">Nusa Penida / Bali</option>
                <option value="Yogyakarta">Yogyakarta</option>
              </select>
            </div>

            {/* Duration Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Durasi Wisata
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              >
                <option value="ALL">Semua Durasi</option>
                <option value="1">1 Hari (One Day)</option>
                <option value="2">2 Hari 1 Malam</option>
                <option value="3">3 Hari 2 Malam</option>
                <option value="4">4+ Hari</option>
              </select>
            </div>

            {/* Max Budget Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Maks. Budget
                </label>
                <span className="text-xs font-bold text-emerald-700">
                  {maxPrice >= 10000000 ? "Bebas" : formatRupiah(maxPrice)}
                </span>
              </div>
              <input
                type="range"
                min="500000"
                max="10000000"
                step="250000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </form>
        </div>

        {/* ===== BEST SELLER / REKOMENDASI SECTION ===== */}
        {bestSellers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Best Seller & Rekomendasi</h2>
                <p className="text-[11px] text-slate-500">Paket terpopuler berdasarkan pemesanan wisatawan</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {bestSellers.map((pkg: any, idx: number) => (
                <div key={pkg.id} className="relative pt-2">
                  <PackageCard
                    pkg={pkg}
                    onCompareToggle={handleToggleCompare}
                    isComparing={compareList.some((p) => p.id === pkg.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== ALL PACKAGES SECTION ===== */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Semua Paket Wisata ({sortedPackages.length})
            </h2>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : sortedPackages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sortedPackages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onCompareToggle={handleToggleCompare}
                isComparing={compareList.some((p) => p.id === pkg.id)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada paket yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Coba atur ulang kata kunci atau filter durasi dan budget Anda untuk menemukan paket yang tersedia.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setDestination("ALL");
                setOriginCity("ALL");
                setDuration("ALL");
                setMaxPrice(10000000);
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          </div>
        )}

      </div>

      {/* Floating Comparison Drawer */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-3xl mx-auto z-40 bg-slate-950 text-white rounded-2xl p-3 sm:p-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>{compareList.length} Paket Dipilih</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-normal">
                  Maks. 4
                </span>
              </div>
              <div className="text-[11px] text-slate-400 hidden sm:block truncate max-w-md">
                {compareList.map((p) => p.name).join(" vs ")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCompareList([]);
                localStorage.removeItem("compare_packages");
              }}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Batal
            </button>
            <Link
              href="/compare"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-colors"
            >
              <span>Bandingkan Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500">Memuat katalog wisata...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
