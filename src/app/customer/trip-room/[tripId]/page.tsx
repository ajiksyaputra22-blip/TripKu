"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDateTime, formatDate } from "@/lib/utils";
import {
  MessageSquare,
  MapPin,
  Calendar,
  Send,
  User,
  AlertCircle,
  Info,
  Car,
  Clock,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/components/Toast";

export default function TripRoomPage() {
  const { toast } = useToast();
  const params = useParams();
  const tripId = ((params?.tripId as string) || (params?.id as string));

  const [tripRoom, setTripRoom] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [category, setCategory] = useState("ANNOUNCEMENT");
  const [posting, setPosting] = useState(false);

  // Checkpoint Reporting State
  const [showHistory, setShowHistory] = useState(false);
  const [checkpointModal, setCheckpointModal] = useState(false);
  const [cpLocation, setCpLocation] = useState("");
  const [cpNote, setCpNote] = useState("");
  const [submittingCp, setSubmittingCp] = useState(false);

  const fetchTripRoom = async () => {
    try {
      const [roomRes, userRes] = await Promise.all([
        fetch(`/api/trip-room/${tripId}`),
        fetch("/api/auth/me"),
      ]);

      const roomData = await roomRes.json();
      const userData = await userRes.json();

      setTripRoom(roomData.tripRoom);
      setCurrentUser(userData.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripRoom();
  }, [tripId]);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setPosting(true);
    try {
      const res = await fetch(`/api/trip-room/${tripId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newContent,
          category,
        }),
      });
      if (res.ok) {
        setNewContent("");
        fetchTripRoom();
        toast.success("Informasi berhasil diposting ke Trip Room!");
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Gagal memposting informasi.");
      }
    } catch {
      toast.error("Gagal memposting informasi ke Trip Room.");
    } finally {
      setPosting(false);
    }
  };

  const handleReportCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpLocation.trim()) return;

    setSubmittingCp(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/checkpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: cpLocation,
          note: cpNote,
        }),
      });
      if (res.ok) {
        setCpLocation("");
        setCpNote("");
        setCheckpointModal(false);
        fetchTripRoom();
        toast.success(`Titik lokasi "${cpLocation}" berhasil dilaporkan!`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Gagal melaporkan titik perjalanan.");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem saat melaporkan checkpoint.");
    } finally {
      setSubmittingCp(false);
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "GATHERING_POINT":
        return { label: "Titik Kumpul", className: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "SCHEDULE":
        return { label: "Update Jadwal", className: "bg-blue-100 text-blue-800 border-blue-300" };
      case "PREPARATION":
        return { label: "Persiapan Wisatawan", className: "bg-amber-100 text-amber-800 border-amber-300" };
      case "ANNOUNCEMENT":
      default:
        return { label: "Pengumuman", className: "bg-purple-100 text-purple-800 border-purple-300" };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!tripRoom) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <h2 className="text-lg font-bold text-slate-900">Trip Room Tidak Ditemukan</h2>
        <Link href="/customer/bookings" className="mt-4 text-xs font-semibold text-emerald-600">
          Kembali ke Riwayat Pemesanan
        </Link>
      </div>
    );
  }

  const trip = tripRoom.trip;
  const canPost = currentUser && currentUser.role === "GUIDE";

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Navigation */}
        <Link
          href={
            currentUser?.role === "TRAVEL"
              ? "/travel/dashboard"
              : currentUser?.role === "GUIDE"
                ? "/guide/dashboard"
                : currentUser?.role === "DRIVER"
                  ? "/driver/dashboard"
                  : "/customer/bookings"
          }
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </Link>

        {/* Room Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
                <span>Ruang Koordinasi Perjalanan (Trip Room)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {tripRoom.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {trip.destination}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Jadwal: {formatDate(trip.scheduleDate)}
                </span>
                {trip.vehicle && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" />
                      {trip.vehicle}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Crew assigned badge Travel clicking crew directs to crew dashboard */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 min-w-[200px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Kru Perjalanan Ditugaskan:
              </span>
              {(() => {
                const guideAssignment = trip.assignments
                  ?.filter((a: any) => a.role === "GUIDE")
                  ?.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
                const driverAssignment = trip.assignments
                  ?.filter((a: any) => a.role === "DRIVER")
                  ?.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

                const renderCrewSlot = (role: string, label: string, icon: string, assignment: any) => {
                  const isAccepted = assignment?.status === "ACCEPTED";
                  const crewUrl = role === "GUIDE" ? "/guide/dashboard" : "/driver/dashboard";

                  if (isAccepted && assignment?.worker?.name) {
                    if (currentUser?.role === "TRAVEL") {
                      return (
                        <Link
                          key={role}
                          href={crewUrl}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-900 transition-colors"
                          title={`Lihat Dashboard ${label}: ${assignment.worker.name}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs">{icon}</span>
                            <span className="font-bold underline decoration-emerald-400 truncate">{assignment.worker.name}</span>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-600 text-white font-bold flex items-center gap-0.5 shrink-0">
                            {role} ↗
                          </span>
                        </Link>
                      );
                    }
                    return (
                      <div key={role} className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs">{icon}</span>
                          <span className="font-semibold text-slate-900 truncate">{assignment.worker.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold shrink-0">
                          {role}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={role} className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <span>Menunggu Kru</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200/70 font-bold text-amber-800 shrink-0">
                        {role}
                      </span>
                    </div>
                  );
                };

                return (
                  <div className="space-y-1.5">
                    {renderCrewSlot("GUIDE", "Tour Guide", "🧑‍💼", guideAssignment)}
                    {renderCrewSlot("DRIVER", "Driver", "🚘", driverAssignment)}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/70 p-3 rounded-xl">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Catatan Sistem:</strong> Trip Room digunakan secara terarah untuk menyampaikan arahan operasional, titik kumpul, dan pengumuman resmi perjalanan dari pihak agensi travel &amp; pemandu.
            </span>
          </div>
        </div>

        {/* Live Trip Location Tracking Card — REQ-6.4: Monitoring Posisi & Narasi Status Perjalanan */}
        {trip.status !== "ONGOING" && trip.status !== "COMPLETED" ? (
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md mb-8 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Monitoring Lokasi Perjalanan
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Menunggu Keberangkatan
                    </span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-white mt-1">
                    Status: Menunggu Keberangkatan
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Monitoring posisi perjalanan hanya akan aktif setelah perjalanan dimulai oleh kru pada tanggal jadwal keberangkatan ({formatDate(trip.scheduleDate)}).
                  </p>
                </div>
              </div>

              {/* Only Tour Guide can see the disabled / active checkpoint reporting trigger */}
              {currentUser?.role === "GUIDE" && (
                <div className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-center">
                  Update lokasi dapat diinput setelah trip dimulai (status Mulai Trip)
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 shadow-md mb-8 border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPin className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Live Trip Location Tracking
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Real-time Checkpoint
                    </span>
                  </div>
                  <div className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                    {trip.currentLocation || "Rombongan telah memulai perjalanan. Menunggu pembaruan titik dari Tour Guide..."}
                  </div>
                  {trip.checkpoints?.[0] && (
                    <span className="text-[11px] text-emerald-300 font-semibold block mt-0.5">
                      Update terakhir: {formatDateTime(trip.checkpoints[0].reportedAt)} oleh {trip.checkpoints[0].user?.name} ({trip.checkpoints[0].user?.role})
                    </span>
                  )}
                  <p className="text-xs text-slate-300 mt-0.5">
                    Posisi perjalanan dilaporkan secara resmi oleh Tour Guide pendamping.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {/* REQ-6.4: Hanya Tour Guide yang berwenang mengupdate lokasi perjalanan */}
                {(currentUser?.role === "GUIDE" || currentUser?.role === "ADMIN") && (
                  <button
                    type="button"
                    onClick={() => setCheckpointModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Lapor Titik Baru</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/10 transition-all flex items-center gap-1"
                >
                  <span>{showHistory ? "Tutup Riwayat Titik" : `Lihat Riwayat Titik (${trip.checkpoints?.length || 0})`}</span>
                </button>
              </div>
            </div>

            {/* Checkpoint Timeline Dropdown / History */}
            {showHistory && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3">
                  Linimasa Titik Perjalanan Wisatawan:
                </div>
                {trip.checkpoints && trip.checkpoints.length > 0 ? (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {trip.checkpoints.map((cp: any, idx: number) => (
                      <div key={cp.id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                          {trip.checkpoints.length - idx}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{cp.location}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                                {cp.user?.name} ({cp.user?.role})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatDateTime(cp.reportedAt)}
                            </span>
                          </div>
                          {cp.note && (
                            <p className="text-[11px] text-slate-300 mt-1 italic">
                              "{cp.note}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic py-2">
                    Belum ada riwayat titik lokasi yang dilaporkan untuk perjalanan ini.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Post Update Form (For Travel, Guide, Driver, Admin) */}
        {canPost && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-8">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              <span>Sampaikan Informasi / Pengumuman ke Peserta</span>
            </h2>

            <form onSubmit={handlePostUpdate} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "ANNOUNCEMENT", label: "Pengumuman Umum" },
                  { id: "GATHERING_POINT", label: "Titik Kumpul" },
                  { id: "SCHEDULE", label: "Jadwal & Waktu" },
                  { id: "PREPARATION", label: "Persiapan Perlengkapan" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${category === c.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                required
                placeholder="Tuliskan pengumuman, panduan titik kumpul, atau instruksi persiapan perjalanan untuk peserta..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={posting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{posting ? "Memposting..." : "Publikasikan ke Trip Room"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Updates Feed */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Daftar Informasi & Pengumuman Perjalanan
          </h2>

          {tripRoom.updates && tripRoom.updates.length > 0 ? (
            tripRoom.updates.map((update: any) => {
              const cat = getCategoryBadge(update.category);

              return (
                <div
                  key={update.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {update.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{update.user.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                            {update.user.role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatDateTime(update.createdAt)}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.className}`}>
                      {cat.label}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-10">
                    {update.content}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              Belum ada pengumuman perjalanan yang diposting.
            </div>
          )}
        </div>

        {/* Checkpoint Reporting Modal for Guide/Driver */}
        {checkpointModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Lapor Titik Perjalanan Wisatawan</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCheckpointModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Update Titik / Posisi Terkini
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan Anda akan langsung memperbarui live tracking dan dipublikasikan ke seluruh peserta di Trip Room ini.
                </p>
              </div>

              <form onSubmit={handleReportCheckpoint} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Titik Lokasi / Checkpoint *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Tiba di Bandara Komodo / Pulau Padar / Menuju Hotel"
                    value={cpLocation}
                    onChange={(e) => setCpLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                  />
                  {/* Quick Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[
                      "Penjemputan di Bandara",
                      "Tiba di Hotel / Check-in",
                      "Dermaga Wisata / Briefing",
                      "Pulau Padar (Trekking)",
                      "Pantai Pink (Snorkeling)",
                      "Manta Point",
                      "Perjalanan Kembali ke Hotel",
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCpLocation(chip)}
                        className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium transition-all"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Kru / Kondisi Wisatawan (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Contoh: Seluruh rombongan lengkap, cuaca cerah berawan, kapal siap berlayar."
                    value={cpNote}
                    onChange={(e) => setCpNote(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCheckpointModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCp}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{submittingCp ? "Mengirim Laporan..." : "Laporkan Sekarang"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
