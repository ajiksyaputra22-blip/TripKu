"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Users,
  ArrowRight,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface ParticipantInput {
  name: string;
  identityNumber: string;
  birthDate: string;
  emergencyContact: string;
  phone: string;
}

export default function BookingPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const packageId = params.id as string;

  const [pkg, setPkg] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [autoFilled, setAutoFilled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>("");
  const [paymentPlan, setPaymentPlan] = useState<"DP" | "FULL">("DP");
  const [participants, setParticipants] = useState<ParticipantInput[]>([
    { name: "", identityNumber: "", birthDate: "", emergencyContact: "", phone: "" },
  ]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [checkingAvailability, setCheckingAvailability] = useState<boolean>(false);
  const [dateAvailabilityInfo, setDateAvailabilityInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPackageAndUser = async () => {
      try {
        const [pkgRes, userRes] = await Promise.all([
          fetch(`/api/packages/${packageId}`),
          fetch("/api/auth/me"),
        ]);

        if (!pkgRes.ok) throw new Error("Paket tidak ditemukan");
        const pkgData = await pkgRes.json();
        const userData = await userRes.json();

        setPkg(pkgData.package);
        if (userData?.user) {
          setCurrentUser(userData.user);
        }
      } catch (err: any) {
        setError(err.message || "Gagal memuat paket wisata.");
      } finally {
        setLoading(false);
      }
    };
    fetchPackageAndUser();
  }, [packageId]);

  const handleAutoFillProfile = () => {
    if (!currentUser) {
      toast.warning("Silakan login terlebih dahulu untuk menggunakan data profil Anda.");
      return;
    }

    setParticipants((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = {
          ...updated[0],
          name: currentUser.name || updated[0].name,
          identityNumber: currentUser.nik || updated[0].identityNumber,
          phone: currentUser.phone || updated[0].phone || "",
          emergencyContact: currentUser.phone || currentUser.email || updated[0].emergencyContact,
        };
      }
      return updated;
    });
    setAutoFilled(true);
    toast.success("Data profil Anda berhasil diisikan ke data pemesan!");
  };

  // Adjust participants array when participant count changes
  const handleCountChange = (newCount: number) => {
    if (newCount < 1) return;
    const maxLimit = pkg?.tripType === "PRIVATE" ? (pkg.dailyQuota || 50) : (pkg?.quotaLeft || 50);
    if (pkg && newCount > maxLimit) {
      toast.warning(`Maksimal kuota per rombongan adalah ${maxLimit} peserta.`);
      return;
    }
    setParticipantCount(newCount);
    setParticipants((prev) => {
      const updated = [...prev];
      if (newCount > updated.length) {
        for (let i = updated.length; i < newCount; i++) {
          updated.push({ name: "", identityNumber: "", birthDate: "", emergencyContact: "", phone: "" });
        }
      } else {
        return updated.slice(0, newCount);
      }
      return updated;
    });
  };

  // Check date availability for Private Trip
  const handleDateSelect = async (dateVal: string) => {
    setSelectedDate(dateVal);
    setDateAvailabilityInfo(null);
    if (!dateVal || !pkg || pkg.tripType !== "PRIVATE") return;

    setCheckingAvailability(true);
    try {
      const res = await fetch(`/api/packages/availability?packageId=${pkg.id}&date=${dateVal}&pax=${participantCount}`);
      const data = await res.json();
      setDateAvailabilityInfo(data);
      if (!data.canFit) {
        if (data.categoryBlocked) {
          toast.error(data.message || "Tanggal tidak sesuai kategori hari paket.");
        } else {
          toast.warning(`Kuota untuk rentang tanggal ini tidak cukup (Sisa: ${data.remaining} peserta). Silakan pilih tanggal lain.`);
        }
      }
    } catch {
      toast.error("Gagal memeriksa ketersediaan tanggal.");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleParticipantChange = (index: number, field: keyof ParticipantInput, value: string) => {
    setParticipants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all participants
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.name.trim() || !p.identityNumber.trim()) {
        setError(`Data Peserta #${i + 1} belum lengkap. Nama dan No. Identitas wajib diisi sesuai KTP/Paspor.`);
        return;
      }
    }

    if (pkg?.tripType === "PRIVATE") {
      if (!selectedDate) {
        setError("Silakan pilih tanggal keberangkatan terlebih dahulu.");
        return;
      }
      if (dateAvailabilityInfo && !dateAvailabilityInfo.canFit) {
        setError(dateAvailabilityInfo.message || "Tanggal yang dipilih kuotanya tidak mencukupi atau tidak sesuai kategori hari.");
        return;
      }
    }

    if (tierError) {
      setError(tierError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: pkg.id,
          participantCount,
          participants,
          notes,
          paymentPlan,
          selectedDate: pkg.tripType === "PRIVATE" ? selectedDate : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses pemesanan.");
      }

      // Redirect to booking payment page
      router.push(`/customer/bookings/${data.booking.id}`);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem saat pemesanan.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <h2 className="text-lg font-bold text-slate-900">Paket Wisata Tidak Ditemukan</h2>
        <Link href="/explore" className="mt-4 text-xs font-semibold text-emerald-600">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  // Tier matching & Pricing Calculation
  const isCustomPricing = pkg.pricingType === "CUSTOM";
  const tiers: any[] = pkg.priceTiers || [];
  let unitPrice = pkg.price || 0;
  let matchedTier: any = null;
  let tierError: string | null = null;

  if (isCustomPricing) {
    matchedTier = tiers.find(
      (t: any) => participantCount >= t.minPax && participantCount <= t.maxPax
    );
    if (matchedTier) {
      unitPrice = matchedTier.price;
    } else {
      unitPrice = 0;
      tierError = `Jumlah ${participantCount} peserta tidak memenuhi rentang variasi harga yang disediakan oleh agensi travel. Silakan sesuaikan jumlah peserta Anda dengan pilihan rentang harga di bawah.`;
    }
  }

  const packageSubtotal = unitPrice * participantCount;
  const adminFeePerPerson = 5000;
  const adminFeeTotal = adminFeePerPerson * participantCount;
  const totalPrice = packageSubtotal + adminFeeTotal;

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href={`/packages/${pkg.slug || pkg.id}`} className="hover:text-slate-900">
            Detail Paket
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">Formulir Pemesanan Wisata</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                Data Pemesanan & Peserta
              </h1>
              <p className="text-xs text-slate-500 mb-6">
                Lengkapi identitas seluruh peserta perjalanan untuk keperluan manifest asuransi dan pendaftaran TN/Kawasan Wisata.
              </p>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* 1. Jumlah Peserta */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-900">
                      Jumlah Peserta (Pax)
                    </label>
                    {isCustomPricing && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 self-start sm:self-auto">
                        Skema Harga Custom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleCountChange(participantCount - 1)}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-extrabold text-slate-900 text-base">
                      {participantCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCountChange(participantCount + 1)}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <span className="text-xs text-slate-500 ml-2">
                      {pkg.tripType === "PRIVATE"
                        ? `(Maks. kuota: ${pkg.dailyQuota || pkg.capacity} orang/hari)`
                        : `(Sisa kuota: ${pkg.quotaLeft} orang)`}
                    </span>
                  </div>

                  {/* Tier status notice */}
                  {isCustomPricing && (
                    <div className="pt-2 border-t border-slate-200/60">
                      {matchedTier ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div>
                            <span className="font-bold">Rentang Aktif: </span>
                            <span>
                              {matchedTier.minPax === matchedTier.maxPax
                                ? `${matchedTier.minPax} Peserta`
                                : `${matchedTier.minPax} - ${matchedTier.maxPax} Peserta`}{" "}
                              — <strong>{formatRupiah(matchedTier.price)} / orang</strong>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">Jumlah peserta tidak didukung!</span>
                            <span>{tierError}</span>
                          </div>
                        </div>
                      )}

                      {/* Supported tiers quick selector / pills */}
                      {tiers.length > 0 && (
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-600">Pilihan rentang harga:</span>
                          {tiers.map((t: any, i: number) => {
                            const isCurrent = participantCount >= t.minPax && participantCount <= t.maxPax;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => handleCountChange(t.minPax)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                                  isCurrent
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                                }`}
                                title={`Pilih ${t.minPax} peserta`}
                              >
                                {t.minPax === t.maxPax ? `${t.minPax} pax` : `${t.minPax}-${t.maxPax} pax`}: {formatRupiah(t.price)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Pemilihan Tanggal Keberangkatan (Khusus PRIVATE TRIP) */}
                {pkg.tripType === "PRIVATE" && (
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="block text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        Pilih Tanggal Mulai Perjalanan (Private Trip) *
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 self-start sm:self-auto">
                        Durasi: {pkg.durationDays} Hari
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <span>Kategori Hari Dibuka: </span>
                      <strong className="text-indigo-900">
                        {pkg.availableDays === "WEEKDAY"
                          ? "Week Day (Senin – Jumat)"
                          : pkg.availableDays === "WEEKEND"
                          ? "Week End (Sabtu – Minggu)"
                          : "Setiap Hari (Senin – Minggu)"}
                      </strong>
                    </div>

                    <div>
                      <input
                        type="date"
                        required={pkg.tripType === "PRIVATE"}
                        value={selectedDate}
                        min={new Date().toISOString().substring(0, 10)}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) {
                            handleDateSelect("");
                            return;
                          }
                          // Cek kecocokan kategori hari sebelum set
                          const chosen = new Date(val + "T00:00:00.000Z");
                          const day = chosen.getUTCDay(); // 0: Min, 6: Sab
                          const isWeekend = day === 0 || day === 6;

                          if (pkg.availableDays === "WEEKDAY" && isWeekend) {
                            toast.error("Paket ini hanya membuka jadwal Week Day (Senin - Jumat). Tanggal akhir pekan tidak dapat dipilih.");
                            return;
                          }
                          if (pkg.availableDays === "WEEKEND" && !isWeekend) {
                            toast.error("Paket ini hanya membuka jadwal Week End (Sabtu - Minggu). Tanggal hari kerja tidak dapat dipilih.");
                            return;
                          }

                          handleDateSelect(val);
                        }}
                        className="w-full sm:w-64 px-3 py-2 text-xs rounded-xl bg-white border border-indigo-300 font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>

                    {checkingAvailability && (
                      <p className="text-[11px] text-indigo-600 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Memeriksa ketersediaan kuota harian...
                      </p>
                    )}

                    {dateAvailabilityInfo && (
                      <div className={`p-3 rounded-xl border text-xs ${
                        dateAvailabilityInfo.canFit
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-rose-50 border-rose-200 text-rose-900"
                      }`}>
                        {dateAvailabilityInfo.canFit ? (
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Tanggal Tersedia!</p>
                              <p className="text-[11px] text-emerald-700 mt-0.5">
                                Perjalanan Anda: {dateAvailabilityInfo.coveredDates?.join(" s/d ")} ({dateAvailabilityInfo.durationDays} hari). Sisa kuota harian: {dateAvailabilityInfo.remaining} peserta.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">Tanggal Tidak Dapat Dipilih</p>
                              <p className="text-[11px] text-rose-700 mt-0.5">
                                {dateAvailabilityInfo.message || `Sisa kuota pada tanggal ini hanya ${Math.max(0, dateAvailabilityInfo.remaining)} orang, tidak mencukupi untuk rombongan ${participantCount} orang Anda. Silakan pilih tanggal lain.`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Daftar Peserta Dinamis */}
                <div className="space-y-4">
                  {participants.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2.5 gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          Peserta #{idx + 1} {idx === 0 && "(Kontak Utama Pemesan)"}
                        </span>
                      </div>

                      {/* Auto-fill button for first participant only */}
                      {idx === 0 && currentUser && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-emerald-800 font-semibold">
                              Isi data diri secara otomatis dari profil akun Anda
                            </p>
                            <p className="text-[10px] text-emerald-600 mt-0.5">
                              Nama &amp; NIK akan diisi sesuai data registrasi akun
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAutoFillProfile}
                            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xs transition-all cursor-pointer ${autoFilled
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-white hover:bg-emerald-100 text-emerald-800 border-emerald-300 hover:border-emerald-400"
                              }`}
                          >
                            <span>{autoFilled ? "Berhasil Diisikan" : "Tambahkan sebagai customer"}</span>
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Nama Lengkap (sesuai KTP) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Budi Pratama"
                            value={p.name}
                            onChange={(e) => handleParticipantChange(idx, "name", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Nomor HP Pribadi / WhatsApp {idx === 0 ? "(Customer Utama) *" : "(Opsional)"}
                          </label>
                          <input
                            type="tel"
                            required={idx === 0}
                            placeholder="Contoh: 081234567890"
                            value={p.phone || ""}
                            onChange={(e) => handleParticipantChange(idx, "phone", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Nomor KTP / Paspor *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={16}
                            placeholder="Tepat 16 digit NIK KTP"
                            value={p.identityNumber}
                            onChange={(e) => handleParticipantChange(idx, "identityNumber", e.target.value.replace(/\D/g, "").slice(0, 16))}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono"
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                            {p.identityNumber.length}/16 digit
                          </span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Tanggal Lahir
                          </label>
                          <input
                            type="date"
                            value={p.birthDate}
                            onChange={(e) => handleParticipantChange(idx, "birthDate", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Kontak Darurat (HP & Hubungan)
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 081233445566 (Ibu)"
                            value={p.emergencyContact}
                            onChange={(e) => handleParticipantChange(idx, "emergencyContact", e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. Pilihan Wajib Skema Pembayaran (DP vs Pelunasan Penuh) */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>Metode Pembayaran (Wajib Dipilih) *</span>
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      Pilih salah satu
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-4">
                    Tentukan apakah Anda ingin membayar uang muka (DP) terlebih dahulu atau langsung pelunasan penuh 100%.
                  </p>

                  {pkg.dpPercentage > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Opsi DP */}
                      <div
                        onClick={() => setPaymentPlan("DP")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${paymentPlan === "DP"
                          ? "border-emerald-600 bg-white shadow-md shadow-emerald-600/10 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 opacity-80"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="paymentPlan"
                              checked={paymentPlan === "DP"}
                              onChange={() => setPaymentPlan("DP")}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-bold text-xs text-slate-900">
                              Bayar DP Dulu ({pkg.dpPercentage}%)
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-500 text-[11px]">DP Dibayar Sekarang:</span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              {formatRupiah(Math.ceil(totalPrice * pkg.dpPercentage / 100))}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                            <span className="text-slate-500 text-[11px]">Sisa Pelunasan:</span>
                            <span className="font-semibold text-slate-700">
                              {formatRupiah(totalPrice - Math.ceil(totalPrice * pkg.dpPercentage / 100))}
                            </span>
                          </div>
                        </div>

                        {/* H-2 Notice */}
                        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[10px] text-amber-900 leading-snug flex items-start gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>
                            <strong>Wajib Lunas H-2:</strong> Sisa pelunasan wajib dibayarkan maksimal 2 hari sebelum tanggal keberangkatan{pkg.departureDate && ` (${formatDate(new Date(new Date(pkg.departureDate).getTime() - 2 * 24 * 60 * 60 * 1000))})`}. Sistem tetap memproses verifikasi dan kru dapat dipersiapkan.
                          </span>
                        </div>
                      </div>

                      {/* Opsi Full Payment */}
                      <div
                        onClick={() => setPaymentPlan("FULL")}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${paymentPlan === "FULL"
                          ? "border-emerald-600 bg-white shadow-md shadow-emerald-600/10 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300 opacity-80"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="paymentPlan"
                              checked={paymentPlan === "FULL"}
                              onChange={() => setPaymentPlan("FULL")}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-bold text-xs text-slate-900">
                              Langsung Pelunasan (100%)
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Lunas Langsung
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-500 text-[11px]">Total Bayar Sekarang:</span>
                            <span className="font-extrabold text-emerald-700 text-sm">
                              {formatRupiah(totalPrice)}
                            </span>
                          </div>
                          <div className="flex justify-between items-baseline pt-1 border-t border-slate-100">
                            <span className="text-slate-500 text-[11px]">Sisa Tagihan Nanti:</span>
                            <span className="font-semibold text-emerald-600">Rp 0 (Lunas Bebas Tagihan)</span>
                          </div>
                        </div>

                        <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[10px] text-emerald-900 leading-snug flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <span>
                            <strong>Langsung Selesai:</strong> Tidak perlu mengingat jadwal pelunasan berikutnya. Pembayaran langsung lunas 100% saat transfer.
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">Pelunasan Penuh Langsung (100%)</span>
                        <span className="text-slate-500 text-[11px]">Paket wisata ini menggunakan skema pembayaran langsung lunas.</span>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700">
                        {formatRupiah(totalPrice)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Catatan Khusus */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Catatan Tambahan untuk Agensi Travel (Opsional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Permintaan makanan halal/vegetarian, titik penjemputan spesifik di bandara, alergi obat..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting || Boolean(tierError)}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  {submitting
                    ? "Memproses Pemesanan..."
                    : tierError
                    ? "Jumlah Peserta Tidak Sesuai Rentang Harga"
                    : "Konfirmasi & Lanjut Pembayaran"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Summary Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Ringkasan Paket
              </h2>

              <div className="flex gap-3 mb-4">
                <img
                  src={pkg.coverImage}
                  alt={pkg.name}
                  className="w-20 h-20 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h3 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug">
                    {pkg.name}
                  </h3>
                  <span className="text-[11px] text-slate-500 block mt-1">
                    {pkg.destination}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 inline-block">
                      {pkg.durationDays} Hari
                    </span>
                    {pkg.category && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 inline-block">
                        {pkg.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rute Titik Checkpoint Ringkasan */}
              <div className="border-t border-slate-100 py-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Jenis Layanan</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    pkg.tripType === "PRIVATE" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {pkg.tripType === "PRIVATE" ? "Private Trip" : "Open Trip"}
                  </span>
                </div>
                {pkg.tripType === "PRIVATE" ? (
                  <div className="flex justify-between items-center">
                    <span>Tanggal Pilihan</span>
                    <span className="font-bold text-indigo-900">
                      {selectedDate ? formatDate(selectedDate) : "Belum dipilih"}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span>Jadwal Keberangkatan</span>
                    <span className="font-bold text-slate-900">
                      {pkg.departureDate ? formatDate(pkg.departureDate) : "—"}
                    </span>
                  </div>
                )}
              </div>

              {pkg.checkpointRoute && (
                <div className="border-t border-slate-100 py-3">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                    Rute Titik Perjalanan:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(() => {
                      try {
                        const parsed = JSON.parse(pkg.checkpointRoute);
                        const arr = Array.isArray(parsed) ? parsed : [];
                        return arr.map((pt: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {idx + 1}. {pt}
                          </span>
                        ));
                      } catch {
                        const arr = typeof pkg.checkpointRoute === "string" ? pkg.checkpointRoute.split(",") : [];
                        return arr.map((pt: string, idx: number) => (
                          <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            {idx + 1}. {pt.trim()}
                          </span>
                        ));
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Price Calculation */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Metode Penentuan Harga</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isCustomPricing
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-700"
                  }`}>
                    {isCustomPricing ? "Harga Custom" : "Harga Tetap"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Harga Paket per Orang</span>
                  <span className={`font-semibold ${tierError ? "text-rose-600 italic" : "text-slate-900"}`}>
                    {tierError ? "Di luar rentang" : formatRupiah(unitPrice)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Peserta</span>
                  <span className="font-medium text-slate-900">{participantCount} Orang</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal Harga Paket</span>
                  <span className="font-semibold text-slate-900">
                    {tierError ? "Rp 0" : formatRupiah(packageSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Admin per Orang</span>
                  <span className="font-medium text-slate-900">{formatRupiah(adminFeePerPerson)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Biaya Admin</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(adminFeeTotal)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900 text-xs">Total Pembayaran</span>
                  <span className={`text-sm font-extrabold ${tierError ? "text-slate-400" : "text-emerald-600"}`}>
                    {tierError ? "—" : formatRupiah(totalPrice)}
                  </span>
                </div>

                {tierError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] leading-snug">
                    Jumlah peserta saat ini ({participantCount} orang) belum dapat dipesan. Mohon sesuaikan jumlah peserta agar sesuai rentang harga yang berlaku.
                  </div>
                )}

                {/* Selected Payment Plan Breakdown */}
                {pkg.dpPercentage > 0 && paymentPlan === "DP" ? (
                  <div className="mt-3 p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-xs space-y-2">
                    <div className="flex items-center justify-between font-extrabold text-blue-950">
                      <span>Tagihan DP Hari Ini ({pkg.dpPercentage}%)</span>
                      <span className="text-emerald-700 text-sm">{formatRupiah(Math.ceil(totalPrice * pkg.dpPercentage / 100))}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-blue-800">
                      <span>Sisa Pelunasan Wajib (H-2)</span>
                      <span className="font-semibold">{formatRupiah(totalPrice - Math.ceil(totalPrice * pkg.dpPercentage / 100))}</span>
                    </div>
                    <div className="text-[10px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-snug">
                      ⚠️ Sisa pelunasan wajib dibayar paling lambat H-2 keberangkatan.
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-extrabold text-emerald-950">
                      <span>Tagihan Pembayaran Penuh</span>
                      <span className="text-emerald-700 text-sm">{formatRupiah(totalPrice)}</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 leading-snug">
                      Pembayaran 100% langsung lunas, bebas tagihan lanjutan.
                    </p>
                  </div>
                )}
              </div>

              {/* Info notice */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                Setelah konfirmasi, Anda akan diarahkan ke halaman instruksi transfer bank dan upload bukti foto pembayaran.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
