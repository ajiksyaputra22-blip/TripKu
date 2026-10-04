"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, getStatusBadge, formatWhatsAppUrl } from "@/lib/utils";
import {
  Check,
  X,
  Eye,
  ArrowLeft,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Users
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function TravelPaymentsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [actionProcessing, setActionProcessing] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerifyAction = async (paymentId: string, action: "VERIFY" | "REJECT") => {
    setActionProcessing(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action,
          verificationNote,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedBooking(null);
        setSelectedPayment(null);
        setVerificationNote("");
        fetchPayments();
        if (action === "VERIFY") {
          toast.success(data.message || "Pembayaran berhasil disetujui.");
        } else {
          toast.info(data.message || "Pembayaran ditolak.");
        }
      } else {
        toast.error(data.error || "Gagal memproses verifikasi.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat memproses verifikasi.");
    } finally {
      setActionProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link
            href="/travel/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>

          {/* Download Report Link Button */}
          <Link
            href="/travel/reports"
            className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-xs font-bold shadow-xs transition-all"
          >
            <span>Tarik &amp; Unduh Laporan Keuangan</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verifikasi Bukti Pembayaran Customer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Periksa keabsahan bukti transfer (DP atau Pelunasan). Verifikasi DP akan langsung mengaktifkan jadwal perjalanan dan membuka penugasan kru.
          </p>
        </div>

        {/* Payments Table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Kode Booking</th>
                  <th className="p-4">Pemesan &amp; Peserta</th>
                  <th className="p-4">Paket Wisata</th>
                  <th className="p-4">Skema &amp; Tagihan</th>
                  <th className="p-4">Status Booking</th>
                  <th className="p-4">Bukti Transfer</th>
                  <th className="p-4 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const badge = getStatusBadge(b.status);
                  // Find pending payment or latest payment from array
                  const pendingPayment = b.payments?.find((p: any) => p.status === "PENDING");
                  const latestPayment = pendingPayment || (b.payments && b.payments.length > 0 ? b.payments[b.payments.length - 1] : b.payment);
                  const hasPayment = Boolean(latestPayment);
                  const isWaitingVerification = Boolean(pendingPayment);

                  // Extract actual primary participant / booking person data
                  const primaryParticipant = b.participants?.[0];
                  const bookerName = primaryParticipant?.name || b.customer?.name || "Customer";
                  const bookerPhone = primaryParticipant?.phone || b.customer?.phone;
                  const paxCount = b.participants?.length || b.participantCount || 1;
                  const isDifferentAccount = b.customer?.name && b.customer.name.toLowerCase() !== bookerName.toLowerCase();

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/80 transition-colors ${isWaitingVerification ? "bg-amber-50/40" : ""
                        }`}
                    >
                      <td className="p-4 font-mono font-bold text-slate-900">
                        {b.bookingCode}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{bookerName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {paxCount} Orang
                          </span>
                        </div>

                        {b.participants && b.participants.length > 1 && (
                          <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5" title={b.participants.map((p: any) => p.name).join(", ")}>
                            👥 <span className="font-medium">{b.participants.map((p: any) => p.name).join(", ")}</span>
                          </div>
                        )}

                        {isDifferentAccount ? (
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Akun: <span className="font-semibold text-slate-700">{b.customer?.name}</span> ({b.customer?.email})
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-0.5">{b.customer?.email}</div>
                        )}

                        {bookerPhone && (
                          <a
                            href={formatWhatsAppUrl(bookerPhone, `Halo ${bookerName}, saya dari admin travel mengenai pembayaran pemesanan kode ${b.bookingCode}.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 transition-colors"
                            title="Chat WhatsApp Pemesan"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WA: {bookerPhone}</span>
                          </a>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-800 max-w-xs truncate">
                        {b.package?.name}
                      </td>
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{formatRupiah(b.totalPrice)}</div>
                        {b.dpAmount > 0 ? (
                          <div className="text-[10px] text-blue-700 font-medium mt-0.5">
                            DP: {formatRupiah(b.dpAmount)} {b.dpPaid ? "(✅ Terbayar)" : "(⏳ Belum)"}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Bayar Penuh (100%)</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="p-4">
                        {latestPayment?.proofUrl ? (
                          <div className="space-y-1">
                            <a
                              href={latestPayment.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat Foto Bukti</span>
                            </a>
                            <div className="text-[10px] font-bold text-slate-600">
                              {latestPayment.paymentType === "DP" ? "💳 Bukti DP" : latestPayment.paymentType === "PELUNASAN" ? "💳 Pelunasan" : "💳 Pembayaran Penuh"} ({formatRupiah(latestPayment.amount)})
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum upload</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {hasPayment ? (
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setSelectedPayment(latestPayment);
                              setVerificationNote(latestPayment?.verificationNote || "");
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${isWaitingVerification
                                ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                          >
                            {isWaitingVerification ? "Verifikasi Sekarang" : "Tinjau Bukti"}
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Menunggu transfer</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-500">Belum ada data transaksi pemesanan.</p>
          </div>
        )}

      </div>

      {/* Verification Modal Dialog */}
      {selectedBooking && selectedPayment && (() => {
        const modalPrimaryParticipant = selectedBooking.participants?.[0];
        const modalBookerName = modalPrimaryParticipant?.name || selectedBooking.customer?.name || "Customer";
        const modalBookerPhone = modalPrimaryParticipant?.phone || selectedBooking.customer?.phone;
        const modalPaxCount = selectedBooking.participants?.length || selectedBooking.participantCount || 1;
        const modalIsDifferent = selectedBooking.customer?.name && selectedBooking.customer.name.toLowerCase() !== modalBookerName.toLowerCase();

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Verifikasi {selectedPayment.paymentType === "DP" ? "Uang Muka (DP)" : selectedPayment.paymentType === "PELUNASAN" ? "Pelunasan H-2" : "Pembayaran Penuh"} - {selectedBooking.bookingCode}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-600">
                      Pemesan: <strong className="text-slate-900">{modalBookerName}</strong> ({modalPaxCount} Orang)
                    </span>
                    {modalIsDifferent && (
                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                        Akun: {selectedBooking.customer?.name} ({selectedBooking.customer?.email})
                      </span>
                    )}
                    {modalBookerPhone && (
                      <a
                        href={formatWhatsAppUrl(modalBookerPhone, `Halo ${modalBookerName}, saya dari admin travel TripKu mengenai verifikasi pembayaran pesanan ${selectedBooking.bookingCode}.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Chat WA ({modalBookerPhone})</span>
                      </a>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setSelectedPayment(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="space-y-4 text-xs overflow-y-auto pr-1 py-4 flex-1">
                {/* Package & Destination Info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Paket Wisata</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedBooking.package?.name}</span>
                  </div>
                  {selectedBooking.package?.destination && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      📍 {selectedBooking.package.destination}
                    </span>
                  )}
                </div>

                {/* Data Lengkap Peserta / Manifest Rombongan */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>Data Lengkap Peserta / Rombongan ({modalPaxCount} Orang)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Sesuai Data Pemesanan
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedBooking.participants && selectedBooking.participants.length > 0 ? (
                      selectedBooking.participants.map((p: any, idx: number) => (
                        <div
                          key={p.id || idx}
                          className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs">{p.name}</span>
                              {idx === 0 && (
                                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                                  Koordinator / Pemesan
                                </span>
                              )}
                            </div>
                            {p.phone && (
                              <a
                                href={formatWhatsAppUrl(p.phone, `Halo ${p.name}, saya dari admin travel mengenai pemesanan paket ${selectedBooking.package?.name}.`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WA: {p.phone}</span>
                              </a>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">NIK / Identitas:</span>
                              <span className="font-mono font-bold text-slate-800">{p.identityNumber || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Tgl Lahir:</span>
                              <span className="font-medium text-slate-800">{p.birthDate ? formatDate(p.birthDate) : "—"}</span>
                            </div>
                            {p.emergencyContact && (
                              <div className="col-span-full flex items-center gap-1.5">
                                <span className="text-slate-400">Kontak Darurat:</span>
                                <span className="font-medium text-slate-800">{p.emergencyContact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-500 text-center text-xs">
                        Data pemesan utama: <strong>{selectedBooking.customer?.name}</strong> (1 Orang)
                      </div>
                    )}
                  </div>
                </div>

                {/* Proof Image */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-700">Bukti Transfer Fisik / Gambar:</span>
                    {selectedPayment.proofUrl && (
                      <a
                        href={selectedPayment.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Ukuran Penuh</span>
                      </a>
                    )}
                  </div>
                  <div className="h-56 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
                    <img
                      src={selectedPayment.proofUrl}
                      alt="Bukti Transfer"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Tagihan Paket ({modalPaxCount} Pax):</span>
                    <span className="font-bold text-slate-900">{formatRupiah(selectedBooking.totalPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jenis Pembayaran:</span>
                    <span className="font-bold text-blue-700">
                      {selectedPayment.paymentType === "DP" ? "Uang Muka (DP)" : selectedPayment.paymentType === "PELUNASAN" ? "Pelunasan Sisa (H-2)" : "Pelunasan Penuh (100%)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nominal Bukti Transfer:</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(selectedPayment.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode:</span>
                    <span className="font-semibold text-slate-800">{selectedPayment.method}</span>
                  </div>
                </div>

                {selectedPayment.paymentType === "DP" && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-snug">
                    ✨ <strong>Catatan Sistem:</strong> Menyetujui DP akan menandai DP lunas dan <strong>otomatis mengaktifkan Trip &amp; Trip Room</strong> serta membuka jendela penugasan kru Driver &amp; Guide.
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Catatan Verifikasi (Opsional untuk konfirmasi / Wajib jika menolak):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Dana telah masuk di rekening BCA. Pembayaran valid."
                    value={verificationNote}
                    onChange={(e) => setVerificationNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  disabled={actionProcessing}
                  onClick={() => handleVerifyAction(selectedPayment.id, "REJECT")}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Tolak Pembayaran</span>
                </button>
                <button
                  type="button"
                  disabled={actionProcessing}
                  onClick={() => handleVerifyAction(selectedPayment.id, "VERIFY")}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui Pembayaran</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
