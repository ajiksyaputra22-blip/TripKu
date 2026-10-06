"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  Image,
  Upload,
  Loader2,
  Archive,
  LayoutDashboard,
  Calendar,
  Users,
  Grid,
  List,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function TravelPackagesPage() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE">("CARDS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  // Form states
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("3");
  const [capacity, setCapacity] = useState("12");
  const [vehicle, setVehicle] = useState("HiAce Commuter / Bus Pariwisata AC");
  const [accommodation, setAccommodation] = useState("Hotel Bintang 3/4");
  const [facilities, setFacilities] = useState("Transportasi AC, Tiket Wisata, Makan 3x, Dokumentasi");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [checkpointRouteStr, setCheckpointRouteStr] = useState("");
  const [dpPercentage, setDpPercentage] = useState("0");
  const [category, setCategory] = useState("WISATA ALAM");
  const [departureDate, setDepartureDate] = useState("");
  const [bookingDeadline, setBookingDeadline] = useState("");
  const [pkgStatus, setPkgStatus] = useState("PUBLISHED");
  const [submitting, setSubmitting] = useState(false);
  const [coverImageUploading, setCoverImageUploading] = useState(false);

  // Helper: is booking closed for a package?
  const isBookingClosed = (pkg: any) => {
    const now = Date.now();
    if (pkg.status !== "PUBLISHED" && pkg.status !== "INACTIVE") return true;
    if (pkg.bookingDeadline && new Date(pkg.bookingDeadline).getTime() < now) return true;
    if (!pkg.bookingDeadline && pkg.departureDate) {
      return new Date(pkg.departureDate).getTime() - now <= 1 * 86400000;
    }
    return false;
  };

  // Helper: cek apakah paket punya pesanan yang masih berlangsung
  const hasActiveBookings = (pkg: any) => {
    if (!pkg.bookings || !Array.isArray(pkg.bookings)) return false;
    return pkg.bookings.some((b: any) =>
      ["CONFIRMED", "PAID", "DP_PAID", "WAITING_PAYMENT", "WAITING_DP_PAYMENT"].includes(b.status)
    );
  };

  // Status badge for package: AKTIF -> NONAKTIF / PEMESANAN DITUTUP -> SELESAI
  const pkgStatusBadge = (pkg: any) => {
    const isCompleted = pkg.status === "COMPLETED" || (pkg.quotaLeft !== undefined && pkg.quotaLeft !== null && pkg.quotaLeft <= 0);
    if (isCompleted) return { label: "SELESAI", cls: "bg-slate-100 text-slate-600 border-slate-300" };
    const closed = isBookingClosed(pkg);
    if (pkg.status === "INACTIVE" || closed) return { label: "PEMESANAN DITUTUP", cls: "bg-rose-50 text-rose-600 border-rose-200" };
    if (pkg.status === "PUBLISHED") return { label: "AKTIF", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return { label: pkg.status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  };

  // Sort packages: ACTIVE (top) -> INACTIVE (middle) -> SELESAI (bottom)
  const sortedPackages = useMemo(() => {
    return [...packages].sort((a: any, b: any) => {
      const getRank = (pkg: any) => {
        const isCompleted = pkg.status === "COMPLETED" || (pkg.quotaLeft !== undefined && pkg.quotaLeft !== null && pkg.quotaLeft <= 0);
        if (isCompleted) return 3; // SELESAI (paling bawah)
        if (pkg.status === "INACTIVE" || isBookingClosed(pkg)) return 2; // INACTIVE / DITUTUP (tengah)
        return 1; // ACTIVE / PUBLISHED (paling atas)
      };
      const rankA = getRank(a);
      const rankB = getRank(b);
      if (rankA !== rankB) return rankA - rankB;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [packages]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/packages?status=ALL&myOnly=true&includeBookings=true");
      const data = await res.json();
      setPackages(data.packages || []);
    } catch {
      setPackages([]);
      toast.error("Gagal memuat paket wisata.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setName("");
    setDestination("");
    setOriginCity("");
    setPrice("");
    setDurationDays("3");
    setCapacity("12");
    setVehicle("HiAce Commuter / Bus Pariwisata AC");
    setAccommodation("Hotel Bintang 3/4");
    setFacilities("Transportasi AC, Tiket Wisata, Makan 3x, Dokumentasi");
    setDescription("");
    setCoverImage("");
    setCheckpointRouteStr("");
    setDpPercentage("0");
    setCategory("WISATA ALAM");
    setPkgStatus("PUBLISHED");
    // Default departure: 14 days from now, deadline: H-1
    const dep = new Date(Date.now() + 14 * 86400000);
    setDepartureDate(dep.toISOString().substring(0, 10));
    const dl = new Date(Date.now() + 13 * 86400000);
    setBookingDeadline(dl.toISOString().substring(0, 10));
    setModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    if (hasActiveBookings(pkg)) {
      toast.warning("Paket ini tidak bisa diedit karena masih ada pesanan yang berlangsung.");
      return;
    }
    setEditingPkg(pkg);
    setName(pkg.name);
    setDestination(pkg.destination);
    setOriginCity(pkg.originCity || "");
    setPrice(pkg.price.toString());
    setDurationDays(pkg.durationDays.toString());
    setCapacity(pkg.capacity.toString());
    setVehicle(pkg.vehicle);
    setAccommodation(pkg.accommodation);
    try {
      const facArr = JSON.parse(pkg.facilities);
      setFacilities(Array.isArray(facArr) ? facArr.join(", ") : pkg.facilities);
    } catch {
      setFacilities(pkg.facilities);
    }
    setDescription(pkg.description);
    setCoverImage(pkg.coverImage);
    try {
      const cpArr = pkg.checkpointRoute ? JSON.parse(pkg.checkpointRoute) : [];
      setCheckpointRouteStr(Array.isArray(cpArr) ? cpArr.join(", ") : "");
    } catch { setCheckpointRouteStr(""); }
    setDpPercentage(pkg.dpPercentage?.toString() || "0");
    setCategory(pkg.category || "WISATA ALAM");
    if (pkg.departureDate) {
      setDepartureDate(new Date(pkg.departureDate).toISOString().substring(0, 10));
    }
    if (pkg.bookingDeadline) {
      setBookingDeadline(new Date(pkg.bookingDeadline).toISOString().substring(0, 10));
    } else if (pkg.departureDate) {
      const dl = new Date(new Date(pkg.departureDate).getTime() - 1 * 86400000);
      setBookingDeadline(dl.toISOString().substring(0, 10));
    }
    // Load current status so edit can change it
    setPkgStatus(pkg.status || "PUBLISHED");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const facList = facilities.split(",").map((s) => s.trim()).filter(Boolean);

    // Validate: booking deadline must be before departure
    if (bookingDeadline && departureDate && bookingDeadline >= departureDate) {
      toast.warning("Batas waktu pemesanan harus sebelum tanggal keberangkatan.");
      setSubmitting(false);
      return;
    }

    try {
      const url = editingPkg ? `/api/packages/${editingPkg.id}` : "/api/packages";
      const method = editingPkg ? "PUT" : "POST";

      const checkpointRoute = checkpointRouteStr
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destination,
          originCity: originCity || null,
          price: parseFloat(price),
          durationDays: parseInt(durationDays),
          capacity: parseInt(capacity),
          vehicle,
          accommodation,
          facilities: facList,
          description,
          coverImage,
          checkpointRoute: checkpointRoute.length > 0 ? checkpointRoute : null,
          dpPercentage: parseInt(dpPercentage) || 0,
          category,
          departureDate: departureDate || undefined,
          bookingDeadline: bookingDeadline || undefined,
          // Sertakan status agar perubahan INACTIVE → PUBLISHED tersimpan
          status: pkgStatus,
        }),
      });

      if (res.ok) {
        toast.success(editingPkg ? "Paket wisata berhasil diperbarui!" : "Paket wisata baru berhasil dibuat!");
        setModalOpen(false);
        fetchPackages();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menyimpan paket wisata.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat menyimpan paket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    const pkg = packages.find((p: any) => p.id === id);
    if (pkg && hasActiveBookings(pkg)) {
      toast.warning("Paket ini tidak bisa diarsipkan karena masih ada pesanan yang berlangsung.");
      return;
    }
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" })
      });
      if (res.ok) {
        toast.success(`Paket "${name}" berhasil diarsipkan.`);
        fetchPackages();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal mengarsipkan paket.");
      }
    } catch {
      toast.error("Gagal mengarsipkan paket.");
    }
  };

  // Toggle status PUBLISHED ↔ INACTIVE langsung dari daftar
  const handleToggleStatus = async (id: string, currentStatus: string, name: string) => {
    const newStatus = currentStatus === "PUBLISHED" ? "INACTIVE" : "PUBLISHED";
    const label = newStatus === "PUBLISHED" ? "diaktifkan" : "dinonaktifkan";
    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Paket "${name}" berhasil ${label}.`);
        fetchPackages();
      } else {
        toast.error("Gagal mengubah status paket.");
      }
    } catch {
      toast.error("Gagal mengubah status paket.");
    }
  };

  // Hapus permanen paket
  const handleDelete = async (id: string, name: string) => {
    const pkg = packages.find((p: any) => p.id === id);
    if (pkg && hasActiveBookings(pkg)) {
      toast.warning("Paket ini tidak bisa dihapus karena masih ada pesanan yang berlangsung.");
      return;
    }
    try {
      const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Paket "${name}" berhasil dihapus.`);
        fetchPackages();
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal menghapus paket.");
      }
    } catch {
      toast.error("Gagal menghapus paket.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        <Link
          href="/travel/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard Utama</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Katalog & Rombongan Paket Destinasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Kelola paket destinasi: atur jadwal, batas pemesanan, kuota rombongan, dan koordinasi kru.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("CARDS")}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === "CARDS"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                title="Tampilan Kartu Paket Destinasi"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === "TABLE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                title="Tampilan Tabel"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
            </div>

            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket Baru</span>
            </button>
          </div>
        </div>

        {/* Content Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white rounded-3xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : packages.length > 0 ? (
          viewMode === "CARDS" ? (
            /* ================= VIEW MODE: CARDS (KARTU DESTINASI) ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPackages.map((pkg) => {
                const paxFilled = Math.max(0, pkg.capacity - (pkg.quotaLeft || 0));
                const fillPercent = Math.min(100, Math.round((paxFilled / pkg.capacity) * 100));

                return (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col overflow-hidden group"
                  >
                    {/* Card Cover Header */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      {pkg.coverImage ? (
                        <img
                          src={pkg.coverImage}
                          alt={pkg.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-slate-800 backdrop-blur-xs shadow-xs">
                          {pkg.category || "WISATA ALAM"}
                        </span>
                        {(() => {
                          const badge = pkgStatusBadge(pkg);
                          return (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Bottom Title on Image */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1 mb-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{pkg.destination}</span>
                          {pkg.originCity && <span className="opacity-80">• Dari {pkg.originCity}</span>}
                        </div>
                        <h3 className="text-base font-extrabold text-white leading-snug line-clamp-1">
                          {pkg.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      {/* Meta Information */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{pkg.durationDays} Hari Trip</span>
                        </div>
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Kapasitas {pkg.capacity} Pax</span>
                        </div>
                      </div>

                      {/* Date Info */}
                      <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-emerald-500" /> Keberangkatan:</span>
                          <span className="font-bold text-slate-700">{pkg.departureDate ? formatDate(pkg.departureDate) : "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-rose-400" /> Batas Pesan:</span>
                          <span className={`font-bold ${isBookingClosed(pkg) ? "text-rose-600" : "text-slate-700"}`}>
                            {pkg.bookingDeadline ? formatDate(pkg.bookingDeadline) : (pkg.departureDate ? `H-3` : "—")}
                          </span>
                        </div>
                      </div>


                      {/* Price & Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Harga / Orang</span>
                          <span className="text-base font-extrabold text-emerald-700">
                            {formatRupiah(pkg.price)}
                          </span>
                        </div>

                        {/* Quick edit, toggle, archive, delete */}
                        <div className="flex items-center gap-1">
                          {hasActiveBookings(pkg) && (
                            <span className="text-[9px] text-amber-600 font-bold bg-amber-50 border border-amber-200 rounded-lg px-1.5 py-0.5 mr-1" title="Ada pesanan aktif">
                              <AlertTriangle className="w-3 h-3 inline -mt-px" /> Pesanan Aktif
                            </span>
                          )}
                          <button
                            onClick={() => openEditModal(pkg)}
                            className={`p-2 rounded-xl transition-colors ${hasActiveBookings(pkg) ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-emerald-700 hover:bg-slate-100"}`}
                            title={hasActiveBookings(pkg) ? "Tidak bisa diedit, ada pesanan aktif" : "Edit Paket"}
                            disabled={hasActiveBookings(pkg)}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchive(pkg.id, pkg.name)}
                            className={`p-2 rounded-xl transition-colors ${hasActiveBookings(pkg) ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-amber-700 hover:bg-amber-50"}`}
                            title={hasActiveBookings(pkg) ? "Tidak bisa diarsipkan, ada pesanan aktif" : "Arsipkan Paket (Selesai)"}
                            disabled={hasActiveBookings(pkg)}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id, pkg.name)}
                            className={`p-2 rounded-xl transition-colors ${hasActiveBookings(pkg) ? "text-slate-300 cursor-not-allowed" : "text-slate-500 hover:text-red-600 hover:bg-red-50"}`}
                            title={hasActiveBookings(pkg) ? "Tidak bisa dihapus, ada pesanan aktif" : "Hapus Permanen"}
                            disabled={hasActiveBookings(pkg)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ================= VIEW MODE: TABLE ================= */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Paket Wisata</th>
                      <th className="p-4">Destinasi</th>
                      <th className="p-4">Harga / Orang</th>
                      <th className="p-4">Durasi</th>
                      <th className="p-4">Jadwal & Batas Pesan</th>
                      <th className="p-4">Kuota Rombongan</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Kelola</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedPackages.map((pkg) => {
                      const paxFilled = Math.max(0, pkg.capacity - (pkg.quotaLeft || 0));
                      return (
                        <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={pkg.coverImage || "/placeholder.jpg"}
                                alt={pkg.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0"
                              />
                              <div>
                                <div className="font-bold text-slate-900 line-clamp-1 max-w-xs">{pkg.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold">{pkg.category || "WISATA ALAM"}</span>
                                  <span className="text-[10px] text-slate-400">• {pkg.vehicle}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-700">{pkg.destination}</td>
                          <td className="p-4 font-extrabold text-emerald-700">{formatRupiah(pkg.price)}</td>
                          <td className="p-4 font-semibold text-slate-800">{pkg.durationDays} Hari</td>
                          <td className="p-4">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Calendar className="w-3 h-3 text-emerald-500" />
                                <span className="font-bold text-slate-700">{pkg.departureDate ? formatDate(pkg.departureDate) : "—"}</span>
                              </div>
                              <div className={`flex items-center gap-1 text-[11px] ${isBookingClosed(pkg) ? "text-rose-600 font-bold" : "text-slate-500"}`}>
                                <Clock className="w-3 h-3" />
                                <span>Batas: {pkg.bookingDeadline ? formatDate(pkg.bookingDeadline) : "H-3"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-emerald-700">{paxFilled}</span> / {pkg.capacity} Pax
                            <div className="text-[10px] text-slate-400">Sisa {pkg.quotaLeft} kursi</div>
                          </td>
                          <td className="p-4">
                            {(() => {
                              const badge = pkgStatusBadge(pkg);
                              return (
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openEditModal(pkg)}
                                className={`p-1.5 rounded-lg transition-colors ${hasActiveBookings(pkg) ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"}`}
                                title={hasActiveBookings(pkg) ? "Tidak bisa diedit, ada pesanan aktif" : "Edit Paket"}
                                disabled={hasActiveBookings(pkg)}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              {/* Toggle aktif/nonaktif */}
                              {pkg.status !== "COMPLETED" && (
                                <button
                                  onClick={() => handleToggleStatus(pkg.id, pkg.status, pkg.name)}
                                  className={`p-1.5 rounded-lg transition-colors ${pkg.status === "PUBLISHED"
                                    ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                                    }`}
                                  title={pkg.status === "PUBLISHED" ? "Nonaktifkan" : "Aktifkan"}
                                >
                                  {pkg.status === "PUBLISHED" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                </button>
                              )}
                              <button
                                onClick={() => handleArchive(pkg.id, pkg.name)}
                                className={`p-1.5 rounded-lg transition-colors ${hasActiveBookings(pkg) ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-amber-600 hover:bg-amber-50"}`}
                                title={hasActiveBookings(pkg) ? "Tidak bisa diarsipkan, ada pesanan aktif" : "Arsipkan (Selesai)"}
                                disabled={hasActiveBookings(pkg)}
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(pkg.id, pkg.name)}
                                className={`p-1.5 rounded-lg transition-colors ${hasActiveBookings(pkg) ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:text-red-600 hover:bg-red-50"}`}
                                title={hasActiveBookings(pkg) ? "Tidak bisa dihapus, ada pesanan aktif" : "Hapus Permanen"}
                                disabled={hasActiveBookings(pkg)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-xs max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Plus className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Katalog Paket Wisata Masih Kosong</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Buat paket destinasi wisata pertama Anda untuk membuka pendaftaran customer dan koordinasi perjalanan terpadu.
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Paket Wisata Baru</span>
            </button>
          </div>
        )}

      </div>

      {/* Modal Form Tambah / Edit Paket */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                {editingPkg ? "Edit Paket Wisata" : "Buat Paket Wisata Baru"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Paket Wisata *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Eksotisme Bromo Sunrise & Rafting Songa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Destinasi Utama *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bromo, Probolinggo"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kota Keberangkatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Surabaya / Malang"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* ─── Jadwal & Batas Waktu ─── */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Jadwal & Batas Waktu Pemesanan
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Trip (Keberangkatan) *</label>
                    <input
                      type="date"
                      required
                      value={departureDate}
                      onChange={(e) => {
                        setDepartureDate(e.target.value);
                        if (e.target.value) {
                          const dl = new Date(new Date(e.target.value).getTime() - 1 * 86400000);
                          setBookingDeadline(dl.toISOString().substring(0, 10));
                        }
                      }}
                      min={new Date().toISOString().substring(0, 10)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Trip akan dimulai pada tanggal ini.</p>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batas Waktu Pemesanan *</label>
                    <input
                      type="date"
                      required
                      value={bookingDeadline}
                      onChange={(e) => setBookingDeadline(e.target.value)}
                      max={departureDate ? new Date(new Date(departureDate).getTime() - 1 * 86400000).toISOString().substring(0, 10) : undefined}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                      Minimal 1 hari sebelum keberangkatan. Setelah tanggal ini, customer tidak bisa memesan.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga per Orang (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="10000"
                    placeholder="Contoh: 750000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Durasi (Hari) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kapasitas Maksimal (Pax) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Wisata</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="WISATA ALAM">Wisata Alam</option>
                    <option value="WISATA BUDAYA">Wisata Budaya & Sejarah</option>
                    <option value="WISATA KULINER">Wisata Kuliner</option>
                    <option value="WISATA BAHARI">Wisata Bahari & Pantai</option>
                    <option value="ADVENTURE">Petualangan & Trekking</option>
                    <option value="FAMILY">Family & Edukasi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kendaraan / Armada</label>
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Fasilitas Termasuk (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={facilities}
                  onChange={(e) => setFacilities(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Foto Sampul (Cover Image) *</label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${coverImage ? "border-emerald-400 bg-emerald-50" : "border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/30"
                    }`}>
                    {coverImageUploading ? (
                      <><Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" /><span className="text-xs text-slate-600">Mengupload foto...</span></>
                    ) : coverImage ? (
                      <><Image className="w-4 h-4 text-emerald-600 shrink-0" /><span className="text-xs font-semibold text-emerald-800 truncate flex-1">Foto berhasil diupload ✓</span><Upload className="w-3.5 h-3.5 text-emerald-500" /></>
                    ) : (
                      <><Upload className="w-4 h-4 text-slate-400 shrink-0" /><span className="text-xs text-slate-600">Klik untuk upload foto paket (JPG/PNG, maks 5MB)</span></>
                    )}
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) { toast.error("Ukuran foto maks 5MB."); return; }
                        setCoverImageUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          fd.append("folder", "packages");
                          const res = await fetch("/api/upload", { method: "POST", body: fd });
                          const data = await res.json();
                          if (res.ok) {
                            setCoverImage(data.url);
                            toast.success("Foto sampul berhasil diunggah!");
                          } else {
                            toast.error(data.error || "Gagal upload foto.");
                          }
                        } catch {
                          toast.error("Gagal mengupload foto sampul.");
                        } finally { setCoverImageUploading(false); }
                      }}
                    />
                  </label>
                  {coverImage && (
                    <img src={coverImage} alt="Preview" className="w-full h-28 object-cover rounded-xl border border-slate-200" />
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Lengkap & Itinerary *</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Rute Titik Checkpoint */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Destinasi Perjalanan (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="Contoh: Bandara Juanda, Pos Cemoro Lawang, Penanjakan 1, Kawah Bromo, Pasir Berbisik"
                  value={checkpointRouteStr}
                  onChange={(e) => setCheckpointRouteStr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Daftar titik yang akan diklik driver/guide saat melaporkan lokasi rombongan.</p>
              </div>

              {/* DP Percentage */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Persentase DP Customer (%)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0" max="100"
                    value={dpPercentage}
                    onChange={(e) => setDpPercentage(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500">
                    {parseInt(dpPercentage) > 0 ? `Customer bisa bayar DP ${dpPercentage}% dari total harga. Pelunasan H-2 keberangkatan.` : "0 = tidak ada DP, customer bayar full."}
                  </span>
                </div>
              </div>

              {/* Status Paket — hanya tampil saat edit */}
              {editingPkg && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Status Publikasi Paket
                  </p>
                  <select
                    value={pkgStatus}
                    onChange={(e) => setPkgStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-900 focus:outline-none focus:border-amber-500 text-xs font-semibold"
                  >
                    <option value="PUBLISHED">AKTIF</option>
                    <option value="INACTIVE">NONAKTIF</option>
                    <option value="COMPLETED">SELESAI</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition-all"
                >
                  {submitting ? "Menyimpan..." : "Simpan Paket Wisata"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
