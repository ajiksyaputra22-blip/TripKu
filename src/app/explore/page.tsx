"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PackageCard, { PackageData } from "@/components/PackageCard";
import {
  Search,
  Filter,
  RefreshCw,
  Layers,
  ArrowRight,
  MapPin,
  Compass,
  Map,
  Clock,
  X,
  ChevronDown,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import { useToast } from "@/components/Toast";

// 38 Provinsi Resmi di Indonesia
const INDONESIA_PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Bengkulu",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Banten",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
];

// Opsi Kategori Wisata
const CATEGORY_OPTIONS = [
  { value: "WISATA_ALAM", label: "🌿 Wisata Alam", badge: "Populer" },
  { value: "PANTAI", label: "🏖️ Wisata Pantai & Bahari", badge: "Favorit" },
  { value: "GUNUNG", label: "⛰️ Gunung & Hiking" },
  { value: "KOTA", label: "🏙️ Wisata Kota" },
  { value: "MUSEUM_BUDAYA", label: "🏛️ Museum & Budaya" },
  { value: "RELIGI", label: "🕌 Religi & Sejarah" },
  { value: "KULINER", label: "🍜 Kuliner Nusantara" },
  { value: "ADVENTURE", label: "🧗 Petualangan (Adventure)" },
];

// Opsi Durasi Wisata
const DURATION_OPTIONS = [
  { value: "1", label: "1 Hari (One Day Tour)" },
  { value: "2", label: "2 Hari 1 Malam (2D1N)" },
  { value: "3", label: "3 Hari 2 Malam (3D2N)" },
  { value: "4", label: "4 Hari 3 Malam (4D3N)" },
  { value: "5", label: "5+ Hari (Wisata Panjang)" },
];

interface SearchableFilterInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string; badge?: string }[];
  placeholder: string;
  allLabel: string;
  icon: any;
}

function SearchableFilterInput({
  label,
  value,
  onChange,
  options,
  placeholder,
  allLabel,
  icon: Icon,
}: SearchableFilterInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = value === "ALL" ? "" : value;
  const isCustomOrActive = Boolean(value && value !== "ALL");

  // Filter options based on user text (case-insensitive)
  const filteredOptions = useMemo(() => {
    const q = displayValue.toLowerCase().trim();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q)
    );
  }, [options, displayValue]);

  // Check if current value matches an existing option exactly
  const exactMatch = options.some(
    (opt) =>
      opt.value.toLowerCase() === value.toLowerCase() ||
      opt.label.toLowerCase() === value.toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </label>
        {isCustomOrActive && (
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-full">
            Aktif
          </span>
        )}
      </div>

      <div className="relative group">
        <Icon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsOpen(false);
            } else if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          className={`w-full pl-8 pr-14 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-all ${
            isCustomOrActive ? "border-emerald-500/70 bg-emerald-50/20" : "border-slate-200"
          }`}
        />

        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {isCustomOrActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("ALL");
                if (inputRef.current) inputRef.current.focus();
              }}
              title="Reset pilihan"
              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            title="Buka daftar pilihan"
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden text-xs py-1 animate-in fade-in zoom-in-95 max-w-[280px] sm:max-w-none">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Pilih opsi atau ketik manual</span>
            <span>{options.length} opsi</span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50">
            {/* Opsi Semua (Reset) */}
            <button
              type="button"
              onClick={() => {
                onChange("ALL");
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                !isCustomOrActive ? "bg-emerald-50/70 text-emerald-800 font-bold" : "text-slate-700"
              }`}
            >
              <span>{allLabel}</span>
              {!isCustomOrActive && <Check className="w-3.5 h-3.5 text-emerald-600" />}
            </button>

            {/* Opsi Terdaftar */}
            {filteredOptions.map((opt) => {
              const isSelected =
                value.toLowerCase() === opt.value.toLowerCase() ||
                value.toLowerCase() === opt.label.toLowerCase();
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isSelected ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700"
                  }`}
                >
                  <span className="truncate pr-2">{opt.label}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {opt.badge && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </div>
                </button>
              );
            })}

            {/* Jika user mengetik manual dan tidak ada yang cocok persis di opsi */}
            {displayValue && !exactMatch && (
              <div className="p-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] hover:bg-emerald-700 transition-colors flex items-center justify-between shadow-xs"
                >
                  <span className="truncate">Cari: &ldquo;{displayValue}&rdquo;</span>
                  <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded shrink-0">Gunakan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ExploreContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialDestination = searchParams.get("destination") || "ALL";
  const initialProvince = searchParams.get("province") || searchParams.get("originCity") || "ALL";
  const initialCategory = searchParams.get("category") || "ALL";
  const initialDuration = searchParams.get("duration") || "ALL";

  const [packages, setPackages] = useState<PackageData[]>([]);
  const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 5 Filter State
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [province, setProvince] = useState(initialProvince);
  const [destination, setDestination] = useState(initialDestination);
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
      try {
        localStorage.setItem("compare_packages", JSON.stringify(updated));
      } catch { }
      toast.info(`Paket "${pkg.name}" dihapus dari perbandingan.`);
    } else {
      if (compareList.length >= 4) {
        toast.warning("Maksimal 4 paket dapat dibandingkan sekaligus.");
        return;
      }
      const updated = [...compareList, pkg];
      setCompareList(updated);
      try {
        localStorage.setItem("compare_packages", JSON.stringify(updated));
      } catch { }
      toast.success(`Paket "${pkg.name}" ditambahkan ke perbandingan.`);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search && search.trim()) query.set("search", search.trim());
      if (destination && destination !== "ALL" && destination.trim()) query.set("destination", destination.trim());
      if (province && province !== "ALL" && province.trim()) query.set("province", province.trim());
      if (category && category !== "ALL" && category.trim()) query.set("category", category.trim());
      if (duration && duration !== "ALL" && duration.trim()) query.set("duration", duration.trim());
      if (maxPrice < 10000000) query.set("maxPrice", maxPrice.toString());

      const res = await fetch(`/api/packages?${query.toString()}`);
      const data = await res.json();
      const pkgs = data.packages || [];
      setPackages(pkgs);

      if (data.destinations && Array.isArray(data.destinations)) {
        setAvailableDestinations(data.destinations);
      }

      // Determine best sellers: urutkan dari total orang yang memesan terbanyak ke paling sedikit
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

  // Debounced auto-fetch saat filter berubah
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPackages();
    }, 350);
    return () => clearTimeout(timer);
  }, [search, destination, province, category, duration, maxPrice]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPackages();
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("ALL");
    setProvince("ALL");
    setDestination("ALL");
    setDuration("ALL");
    setMaxPrice(10000000);
  };

  const destinationOptions = useMemo(() => {
    if (availableDestinations.length > 0) {
      return availableDestinations.map((d) => ({
        label: d,
        value: d,
      }));
    }
    // Fallback awal jika data destinasi API belum termuat
    return [
      { label: "Pulau Lumukutan, Kalimantan Barat", value: "Pulau Lumukutan, Kalimantan Barat" },
      { label: "Labuan Bajo, Nusa Tenggara Timur", value: "Labuan Bajo, Nusa Tenggara Timur" },
      { label: "Bromo", value: "Bromo" },
      { label: "Raja Ampat", value: "Raja Ampat" },
      { label: "Nusa Penida, Bali", value: "Nusa Penida, Bali" },
      { label: "Yogyakarta", value: "Yogyakarta" },
      { label: "Danau Toba", value: "Danau Toba" },
      { label: "Belitung", value: "Belitung" },
      { label: "Dieng", value: "Dieng" },
    ];
  }, [availableDestinations]);

  const provinceOptions = useMemo(() => {
    return INDONESIA_PROVINCES.map((p) => ({
      label: p,
      value: p,
    }));
  }, []);

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

  const hasActiveFilters = Boolean(
    search ||
      (category && category !== "ALL") ||
      (province && province !== "ALL") ||
      (destination && destination !== "ALL") ||
      (duration && duration !== "ALL") ||
      maxPrice < 10000000
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Katalog Paket Perjalanan Wisata
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Telusuri dan saring berbagai pilihan tur wisata resmi dari agensi travel terpercaya di seluruh Indonesia.
          </p>
        </div>

        {/* Search & Filter Bar (5 Filter Utama + Budget) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">

            {/* 1. Kata Kunci */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Kata Kunci
                </label>
                {search && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded-full">
                    Aktif
                  </span>
                )}
              </div>
              <div className="relative group">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama paket, lokasi..."
                  className={`w-full pl-8 pr-8 py-2 bg-slate-50 border rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-all ${
                    search ? "border-emerald-500/70 bg-emerald-50/20" : "border-slate-200"
                  }`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus kata kunci"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Kategori Wisata (Dropdown + Ketik Manual) */}
            <SearchableFilterInput
              label="Kategori Wisata"
              value={category}
              onChange={setCategory}
              options={CATEGORY_OPTIONS}
              placeholder="Semua Kategori..."
              allLabel="Semua Kategori Wisata"
              icon={Compass}
            />

            {/* 3. Provinsi (Semua Provinsi + Ketik Manual) */}
            <SearchableFilterInput
              label="Provinsi"
              value={province}
              onChange={setProvince}
              options={provinceOptions}
              placeholder="Semua Provinsi..."
              allLabel="Semua Provinsi (Seluruh Indonesia)"
              icon={Map}
            />

            {/* 4. Destinasi (Sesuai Paket Terdaftar + Ketik Manual) */}
            <SearchableFilterInput
              label="Destinasi"
              value={destination}
              onChange={setDestination}
              options={destinationOptions}
              placeholder="Semua Destinasi..."
              allLabel="Semua Destinasi Terdaftar"
              icon={MapPin}
            />

            {/* 5. Durasi Wisata (Pilihan + Ketik Manual) */}
            <SearchableFilterInput
              label="Durasi Wisata"
              value={duration}
              onChange={setDuration}
              options={DURATION_OPTIONS}
              placeholder="Semua Durasi..."
              allLabel="Semua Durasi Wisata"
              icon={Clock}
            />

            {/* Maks. Budget Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
                className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer mt-2"
              />
            </div>
          </form>

          {/* Active Filter Chips & Reset Bar */}
          {hasActiveFilters && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-emerald-600" /> Filter Aktif:
                </span>

                {search && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium">
                    Kata Kunci: <strong>&ldquo;{search}&rdquo;</strong>
                    <button type="button" onClick={() => setSearch("")} className="text-slate-400 hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {category && category !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                    Kategori: <strong>{category}</strong>
                    <button type="button" onClick={() => setCategory("ALL")} className="text-emerald-500 hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {province && province !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-medium">
                    Provinsi: <strong>{province}</strong>
                    <button type="button" onClick={() => setProvince("ALL")} className="text-blue-500 hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {destination && destination !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-medium">
                    Destinasi: <strong>{destination}</strong>
                    <button type="button" onClick={() => setDestination("ALL")} className="text-teal-500 hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {duration && duration !== "ALL" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                    Durasi: <strong>{duration.includes("Hari") ? duration : `${duration} Hari`}</strong>
                    <button type="button" onClick={() => setDuration("ALL")} className="text-amber-500 hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {maxPrice < 10000000 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-[11px] font-medium">
                    Budget: &le; <strong>{formatRupiah(maxPrice)}</strong>
                    <button type="button" onClick={() => setMaxPrice(10000000)} className="text-purple-500 hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            </div>
          )}
        </div>

        {/* ===== BEST SELLER / REKOMENDASI SECTION ===== */}
        {bestSellers.length > 0 && !hasActiveFilters && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Best Seller &amp; Rekomendasi</h2>
                <p className="text-[11px] text-slate-500">Paket terpopuler berdasarkan pemesanan wisatawan</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {bestSellers.map((pkg: any) => (
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

        {/* ===== ALL PACKAGES SECTION HEADER & SORT ===== */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900">
              Semua Paket Wisata ({sortedPackages.length})
            </h2>
            {loading && (
              <span className="text-[10px] text-slate-400 animate-pulse">
                Memperbarui katalog...
              </span>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
            >
              <option value="POPULAR">Terpopuler (Paling Banyak Dipesan)</option>
              <option value="RATING">Rating Tertinggi</option>
              <option value="PRICE_ASC">Harga: Termurah &rarr; Termahal</option>
              <option value="PRICE_DESC">Harga: Termahal &rarr; Termurah</option>
              <option value="NEWEST">Terbaru Ditambahkan</option>
            </select>
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
            <h3 className="text-base font-bold text-slate-800">Tidak ada paket wisata yang cocok</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tidak ditemukan paket untuk kriteria pencarian yang Anda masukkan. Coba atur ulang kata kunci, destinasi, atau periksa filter lainnya.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-emerald-600 transition-colors inline-flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Semua Filter
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-slate-500 text-sm font-medium">
          Memuat katalog wisata...
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
