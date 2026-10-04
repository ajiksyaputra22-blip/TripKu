"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah, formatDate, getStatusBadge } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  Upload,
  MessageSquare,
  Star,
  AlertCircle,
  ArrowLeft,
  Users,
  Copy,
  Check,
  ImageIcon,
  X
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function CustomerBookingDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Payment form state
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Review modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Gagal memuat detail booking.");
      const data = await res.json();
      setBooking(data.booking);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("Format berkas tidak valid. Harap pilih file foto gambar (JPG, PNG, WEBP).");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    // Max 3 MB validation
    if (file.size > 3 * 1024 * 1024) {
      setFileError(`Ukuran foto melebihi batas maksimal 3 MB (terdeteksi: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Silakan gunakan foto yang lebih kecil atau kompres terlebih dahulu.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadProof = async (e: React.FormEvent, paymentType: string = "FULL") => {
    e.preventDefault();
    if (!selectedFile) {
      setFileError("Silakan pilih file foto bukti transfer terlebih dahulu.");
      return;
    }

    setUploading(true);
    try {
      const isDP = paymentType === "DP";
      const dpAmount = booking.dpAmount || 0;
      const pelunasanAmount = booking.totalPrice - dpAmount;
      const amount = isDP ? dpAmount : paymentType === "PELUNASAN" ? pelunasanAmount : booking.totalPrice;

      const formData = new FormData();
      formData.append("bookingId", booking.id);
      formData.append("method", method);
      formData.append("amount", amount.toString());
      formData.append("paymentType", paymentType);
      formData.append("file", selectedFile);

      const res = await fetch("/api/payments/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const label = isDP ? "DP" : paymentType === "PELUNASAN" ? "Pelunasan" : "Pembayaran";
      toast.success(`Foto bukti ${label} berhasil diunggah! Pihak travel akan segera memverifikasi transaksi Anda.`);
      setSelectedFile(null);
      setPreviewUrl(null);
      fetchBooking();
    } catch (err: any) {
      toast.error(err.message || "Gagal mengunggah bukti pembayaran.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trip = booking.trips?.[0];
    if (!trip) return;

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: trip.id,
          rating,
          comment,
        }),
      });
      if (res.ok) {
        toast.success("Terima kasih atas ulasan dan penilaian Anda!");
        setReviewOpen(false);
        fetchBooking();
      } else {
        const data = await res.json();
        toast.error(data.error || "Gagal mengirim ulasan.");
      }
    } catch {
      toast.error("Gagal mengirim ulasan. Silakan periksa koneksi Anda.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <h2 className="text-lg font-bold text-slate-900">Pemesanan Tidak Ditemukan</h2>
        <Link href="/customer/bookings" className="mt-4 text-xs font-semibold text-emerald-600">
          Kembali ke Riwayat Pemesanan
        </Link>
      </div>
    );
  }

  const badge = getStatusBadge(booking.status);
  const activeTrip = booking.trips?.[0];
  // Multiple payments: find DP and PELUNASAN/FULL
  const dpPayment = booking.payments?.find((p: any) => p.paymentType === "DP");
  const pelunasanPayment = booking.payments?.find((p: any) => p.paymentType === "PELUNASAN" || p.paymentType === "FULL");
  const hasDP = booking.dpAmount > 0;
  const dpAmount = booking.dpAmount || 0;
  const pelunasanAmount = booking.totalPrice - dpAmount;
  const needsDP = booking.status === "WAITING_DP_PAYMENT" || (hasDP && !dpPayment);
  const needsPelunasan = booking.status === "NEEDS_PELUNASAN" || (hasDP && dpPayment?.status === "VERIFIED" && !pelunasanPayment);
  const showPaymentForm = booking.status === "WAITING_PAYMENT" || booking.status === "WAITING_DP_PAYMENT" || booking.status === "NEEDS_PELUNASAN" || pelunasanPayment?.status === "REJECTED" || dpPayment?.status === "REJECTED";

  // Checkpoint route from package
  let checkpointRoute: string[] = [];
  try {
    if (booking.package?.checkpointRoute) {
      checkpointRoute = JSON.parse(booking.package.checkpointRoute);
    }
  } catch { checkpointRoute = []; }

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Riwayat Pemesanan</span>
        </Link>

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Kode Booking
              </span>
              <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
                {booking.bookingCode}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
              {booking.package.name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Dipesan pada {formatDate(booking.createdAt)} oleh {booking.customer.name}
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
              {badge.label}
            </span>
            <span className="text-lg font-extrabold text-emerald-600 mt-2">
              {formatRupiah(booking.totalPrice)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Details & Manifest */}
          <div className="lg:col-span-2 space-y-6">

            {/* Trip Room Action Card (If Confirmed) */}
            {activeTrip && (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider mb-2">
                    <MessageSquare className="w-3 h-3 text-emerald-300" />
                    <span>Trip Room Aktif</span>
                  </div>
                  <h3 className="font-bold text-base text-white">
                    Ruang Koordinasi Perjalanan
                  </h3>
                  <p className="text-xs text-emerald-100 mt-0.5 max-w-md leading-relaxed">
                    Pantau informasi titik kumpul, arahan perlengkapan, dan pengumuman dari agen travel dan pemandu wisata di sini.
                  </p>
                </div>

                <Link
                  href={`/customer/trip-room/${activeTrip.id}`}
                  className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shrink-0 text-center shadow-xs transition-all"
                >
                  Buka Trip Room
                </Link>
              </div>
            )}

            {/* Review Button if completed */}
            {booking.status === "COMPLETED" && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Perjalanan Telah Selesai</h4>
                  <p className="text-[11px] text-amber-700">Bagikan pengalaman berharga Anda dengan memberikan ulasan.</p>
                </div>
                <button
                  onClick={() => setReviewOpen(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs"
                >
                  Beri Ulasan
                </button>
              </div>
            )}

            {/* Participant Manifest */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Manifest Data Peserta ({booking.participants.length} Orang)</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {booking.participants.map((p: any, i: number) => (
                  <div key={p.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {i + 1}. {p.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        No. Identitas: <span className="font-mono text-slate-600">{p.identityNumber}</span>
                      </div>
                    </div>
                    {p.emergencyContact && (
                      <span className="text-[11px] text-slate-500">
                        Kontak: {p.emergencyContact}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Package Summary with Checkpoint Route */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Detail Paket Wisata</h3>
              <div className="flex gap-4 mb-4">
                <img
                  src={booking.package.coverImage}
                  alt={booking.package.name}
                  className="w-24 h-24 rounded-xl object-cover shrink-0"
                />
                <div className="text-xs space-y-1 text-slate-600">
                  <div className="font-bold text-sm text-slate-900">{booking.package.name}</div>
                  <div>Destinasi: <span className="font-medium text-slate-800">{booking.package.destination}</span></div>
                  <div>Penyelenggara: <span className="font-medium text-slate-800">{booking.package.travel.businessName}</span></div>
                  <div>Durasi: <span className="font-medium text-slate-800">{booking.package.durationDays} Hari</span></div>
                  <div>Transportasi: <span className="font-medium text-slate-800">{booking.package.vehicle}</span></div>
                </div>
              </div>

              {/* Checkpoint Route */}
              {checkpointRoute.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Destinasi Perjalanan</h4>
                  <div className="relative">
                    <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-slate-200" />
                    {checkpointRoute.map((point: string, idx: number) => {
                      const isReached = activeTrip?.checkpoints?.some((cp: any) =>
                        cp.location.toLowerCase().includes(point.toLowerCase())
                      );
                      const isCurrent = activeTrip?.currentLocation?.toLowerCase().includes(point.toLowerCase());
                      return (
                        <div key={idx} className="relative flex items-start gap-3 mb-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 text-[10px] font-bold border-2 ${isCurrent ? "bg-emerald-600 border-emerald-600 text-white" :
                              isReached ? "bg-emerald-100 border-emerald-400 text-emerald-700" :
                                "bg-white border-slate-300 text-slate-400"
                            }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-xs pt-0.5 ${isCurrent ? "font-bold text-emerald-700" :
                              isReached ? "font-medium text-slate-700" :
                                "text-slate-500"
                            }`}>
                            {point}
                            {isCurrent && <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">📍 Di sini</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Payment Info - Right Column */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Informasi Pembayaran
              </h3>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${hasDP ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                {hasDP ? `Skema DP (${Math.round(dpAmount / booking.totalPrice * 100)}%)` : "Skema Bayar Penuh"}
              </span>
            </div>

            {/* H-2 Mandatory Pelunasan Warning (if customer chose DP) */}
            {hasDP && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Ketentuan Pelunasan (Wajib H-2)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sesuai pilihan skema DP, sisa tagihan <strong>{formatRupiah(pelunasanAmount)}</strong> wajib dilunasi paling lambat <strong>H-2 sebelum tanggal keberangkatan</strong>{booking.package.departureDate && ` (${formatDate(new Date(new Date(booking.package.departureDate).getTime() - 2 * 24 * 60 * 60 * 1000))})`}.
                </p>
                <div className="text-[10px] text-amber-700 bg-white/70 p-2 rounded-lg border border-amber-200/60 mt-1">
                  Sistem agensi travel tetap memproses verifikasi DP dan mempersiapkan kru (Driver &amp; Guide) untuk perjalanan Anda.
                </div>
              </div>
            )}

            {/* DP Progress Bar (if package has DP) */}
            {hasDP && (
              <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-bold text-blue-900">Status Pembayaran Bertahap</span>
                  <span className="text-blue-700 font-semibold">{Math.round(dpAmount / booking.totalPrice * 100)}% DP</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className={`p-2.5 rounded-xl border ${dpPayment?.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : dpPayment ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="font-bold">Uang Muka (DP)</div>
                    <div className="font-extrabold text-sm">{formatRupiah(dpAmount)}</div>
                    <div className="text-[10px] mt-0.5">{dpPayment?.status === 'VERIFIED' ? '✅ Lunas Terverifikasi' : dpPayment ? '⏳ Menunggu Verifikasi' : '⭕ Belum Dibayar'}</div>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${pelunasanPayment?.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : pelunasanPayment ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="font-bold">Pelunasan (H-2)</div>
                    <div className="font-extrabold text-sm">{formatRupiah(pelunasanAmount)}</div>
                    <div className="text-[10px] mt-0.5">{pelunasanPayment?.status === 'VERIFIED' ? '✅ Lunas 100%' : pelunasanPayment ? '⏳ Menunggu Verifikasi' : dpPayment?.status === 'VERIFIED' ? '⚠️ Wajib Bayar H-2' : '⭕ Menunggu DP'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Bank Account */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-4">
              <span className="text-[11px] text-slate-500 block mb-1 font-medium">Rekening Tujuan Transfer</span>
              <div className="font-bold text-xs text-slate-800">{booking.package.travel.bankName || "BCA"}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-sm font-extrabold text-slate-900 tracking-wider">
                  {booking.package.travel.bankAccount || "8820192834"}
                </span>
                <button
                  onClick={() => handleCopyAccount(booking.package.travel.bankAccount || "8820192834")}
                  className="p-1 text-slate-500 hover:text-emerald-600"
                  title="Salin Nomor Rekening"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                a.n. {booking.package.travel.bankHolder || booking.package.travel.businessName}
              </div>
            </div>

            {/* Current Payment(s) Status */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="space-y-2 mb-4">
                {booking.payments.map((pmt: any) => (
                  <div key={pmt.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-700">{pmt.paymentType === 'DP' ? 'Bukti DP' : pmt.paymentType === 'PELUNASAN' ? 'Bukti Pelunasan' : 'Bukti Pembayaran'}</span>
                      <span className={`font-bold ${pmt.status === 'VERIFIED' ? 'text-emerald-700' : pmt.status === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'}`}>
                        {pmt.status === 'VERIFIED' ? '✅ Terverifikasi' : pmt.status === 'REJECTED' ? '❌ Ditolak' : '⏳ Menunggu Verifikasi'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Nominal:</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(pmt.amount)}</span>
                    </div>
                    {pmt.verificationNote && (
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700">
                        <span className="font-semibold block">Catatan Travel:</span>
                        {pmt.verificationNote}
                      </div>
                    )}
                    {pmt.proofUrl && (
                      <div className="mt-2">
                        <img src={pmt.proofUrl} alt="Bukti" className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Upload Proof Form */}
            {showPaymentForm && (
              <form onSubmit={(e) => handleUploadProof(e, needsDP ? "DP" : needsPelunasan ? "PELUNASAN" : "FULL")} className="mt-3 pt-4 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-900">
                  {needsDP ? `Kirim Bukti DP (${formatRupiah(dpAmount)})` : needsPelunasan ? `Kirim Bukti Pelunasan (${formatRupiah(pelunasanAmount)})` : "Kirim Bukti Pembayaran"}
                </h4>
                {needsDP && (
                  <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
                    Bayar DP sebesar <strong>{formatRupiah(dpAmount)}</strong> sekarang. Pelunasan <strong>{formatRupiah(pelunasanAmount)}</strong> dibayar H-2 sebelum keberangkatan.
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Metode Transfer</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  >
                    <option value="BANK_TRANSFER">Transfer Bank (BCA / Mandiri / BNI)</option>
                    <option value="EWALLET">E-Wallet (GoPay / OVO / Dana)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Upload Foto Bukti Transfer (Gambar) *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Maksimal 3 MB
                    </span>
                  </div>

                  {fileError && (
                    <div className="mb-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{fileError}</span>
                    </div>
                  )}

                  {!previewUrl ? (
                    <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/30 transition-all text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Pilih atau Unggah Foto Bukti Transfer</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Format: JPG, PNG, WEBP (Maks 3 MB)</span>
                      <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handleFileChange} className="hidden" required />
                    </label>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{selectedFile?.name}</span>
                        <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); setFileError(null); }} className="p-1 rounded-full hover:bg-slate-200 text-slate-500">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <img src={previewUrl} alt="Preview" className="w-full h-44 object-contain rounded-xl bg-slate-100 border border-slate-200/80" />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? "Mengunggah..." : needsDP ? `Kirim Bukti DP (${formatRupiah(dpAmount)})` : needsPelunasan ? `Kirim Bukti Pelunasan (${formatRupiah(pelunasanAmount)})` : "Kirim Bukti Pembayaran"}</span>
                </button>
              </form>
            )}



          </div>

        </div>

      </div>



      {/* Review Modal */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-1">Beri Ulasan Perjalanan</h3>
            <p className="text-xs text-slate-500 mb-4">Bagikan testimoni dan kepuasan Anda terhadap layanan tour.</p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating Bintang</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ulasan & Testimoni</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ceritakan pengalaman Anda bersama tim tour..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {submittingReview ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
