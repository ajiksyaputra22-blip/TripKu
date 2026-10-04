"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, getStatusBadge } from "@/lib/utils";
import { Calendar, ArrowRight, MapPin, MessageSquare, CheckCircle2 } from "lucide-react";

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  // Map tripId -> hasReviewed boolean
  const [reviewedTrips, setReviewedTrips] = useState<Record<string, boolean>>({});

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const url = statusFilter !== "ALL" ? `/api/bookings?status=${statusFilter}` : "/api/bookings";
      const res = await fetch(url);
      const data = await res.json();
      const fetchedBookings = data.bookings || [];
      setBookings(fetchedBookings);

      // Cek status review untuk semua booking COMPLETED
      const completedTrips = fetchedBookings
        .filter((b: any) => b.status === "COMPLETED" && b.trips?.[0])
        .map((b: any) => b.trips[0].id);

      if (completedTrips.length > 0) {
        const checks = await Promise.all(
          completedTrips.map((tripId: string) =>
            fetch(`/api/reviews?tripId=${tripId}`)
              .then((r) => r.json())
              .then((d) => ({ tripId, hasReviewed: d.hasReviewed ?? false }))
              .catch(() => ({ tripId, hasReviewed: false }))
          )
        );
        const reviewMap: Record<string, boolean> = {};
        checks.forEach(({ tripId, hasReviewed }) => {
          reviewMap[tripId] = hasReviewed;
        });
        setReviewedTrips(reviewMap);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Riwayat Pemesanan Wisata Saya
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau status pembayaran, data peserta, dan koordinasi Trip Room untuk setiap perjalanan Anda.
            </p>
          </div>

          <Link
            href="/explore"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start"
          >
            <span>Pesan Paket Baru</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["ALL", "WAITING_PAYMENT", "WAITING_VERIFICATION", "CONFIRMED", "COMPLETED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              {st === "ALL" ? "Semua Status" :
               st === "WAITING_PAYMENT" ? "Menunggu Bayar" :
               st === "WAITING_VERIFICATION" ? "Menunggu Verifikasi" :
               st === "CONFIRMED" ? "Terkonfirmasi" : "Selesai"}
            </button>
          ))}
        </div>

        {/* Booking Cards List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((b) => {
              const badge = getStatusBadge(b.status);
              const trip = b.trips?.[0];

              return (
                <div
                  key={b.id}
                  className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-4">
                    <img
                      src={b.package.coverImage}
                      alt={b.package.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-400">
                          {b.bookingCode}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                        {b.package.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.package.destination}</span>
                        <span>•</span>
                        <span>{b.participantCount} Peserta</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Penyelenggara: <span className="font-medium text-slate-700">{b.package.travel.businessName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <span className="text-xs text-slate-400 font-medium">Total Biaya</span>
                    <span className="text-base font-extrabold text-emerald-600">
                      {formatRupiah(b.totalPrice)}
                    </span>

                    <div className="flex items-center gap-2 mt-3">
                      {trip && (
                        <Link
                          href={`/customer/trip-room/${trip.id}`}
                          className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Trip Room</span>
                        </Link>
                      )}
                      {/* After paying, button changes to Detail only */}
                      {b.status === "COMPLETED" && trip ? (
                        reviewedTrips[trip.id] ? (
                          // Sudah direview — tombol disabled
                          <span
                            className="px-4 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                            title="Anda sudah memberikan ulasan untuk perjalanan ini"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Sudah Direview</span>
                          </span>
                        ) : (
                          // Belum direview — tombol aktif
                          <Link
                            href={`/customer/review/${trip.id}`}
                            className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <span>⭐ Beri Ulasan</span>
                          </Link>
                        )
                      ) : (
                        <Link
                          href={`/customer/bookings/${b.id}`}
                          className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <span>{b.status === "WAITING_PAYMENT" || b.status === "PENDING" ? "Detail & Bayar" : "Detail"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Belum Ada Pemesanan</h3>
            <p className="text-xs text-slate-500 mt-1">
              Anda belum melakukan booking perjalanan wisata.
            </p>
            <Link
              href="/explore"
              className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
            >
              Jelajahi Paket Wisata
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
