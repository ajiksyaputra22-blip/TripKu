"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle2, ArrowRight, Briefcase, Award, Car, MapPin, AlertCircle, Lock } from "lucide-react";

interface CrewMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  rating?: number;
  totalWorkDays?: number;
}

type Step = "confirm" | "destination" | "guide" | "driver" | "done";

export default function CustomerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.tripId as string;

  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<any>(null);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [step, setStep] = useState<Step>("confirm");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Review state
  const [destinationRating, setDestinationRating] = useState(5);
  const [destinationComment, setDestinationComment] = useState("");
  const [guideRating, setGuideRating] = useState(5);
  const [guideComment, setGuideComment] = useState("");
  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState("");

  const guide = crew.find(c => c.role === "GUIDE");
  const driver = crew.find(c => c.role === "DRIVER");

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        // Cek apakah sudah pernah review
        const reviewCheckRes = await fetch(`/api/reviews?tripId=${tripId}`);
        if (reviewCheckRes.ok) {
          const reviewCheckData = await reviewCheckRes.json();
          if (reviewCheckData.hasReviewed) {
            setAlreadyReviewed(true);
            setLoading(false);
            return;
          }
        }

        // Load assignments/crew
        const aRes = await fetch(`/api/assignments?tripId=${tripId}`);
        if (aRes.ok) {
          const aData = await aRes.json();
          const crewData: CrewMember[] = (aData.assignments || []).map((a: any) => ({
            id: a.workerId,
            name: a.worker?.name || "Kru",
            role: a.role,
            avatarUrl: a.worker?.avatarUrl,
            rating: a.worker?.workerProfile?.rating,
            totalWorkDays: a.worker?.workerProfile?.totalWorkDays,
          }));
          setCrew(crewData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [tripId]);

  const handleConfirmTrip = async () => {
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCrew(data.crew || crew);
      setStep("destination");
    } catch (err: any) {
      setError(err.message || "Gagal mengkonfirmasi penyelesaian perjalanan.");
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitDestinationReview = async () => {
    setSubmitting(true);
    try {
      // Get travelId from trip
      await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, rating: destinationRating, comment: destinationComment }),
      });
      // Determine next step
      if (guide) setStep("guide");
      else if (driver) setStep("driver");
      else setStep("done");
    } catch { } finally { setSubmitting(false); }
  };

  const handleSubmitWorkerReview = async (workerId: string, workerRole: string, rating: number, comment: string) => {
    setSubmitting(true);
    try {
      await fetch("/api/worker-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, workerId, workerRole, rating, comment }),
      });
      if (workerRole === "GUIDE" && driver) setStep("driver");
      else setStep("done");
    } catch { } finally { setSubmitting(false); }
  };

  const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <div className="flex gap-1.5">
      {[1,2,3,4,5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)} className="p-0.5 transition-transform hover:scale-110">
          <Star className={`w-8 h-8 transition-colors ${star <= value ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
        </button>
      ))}
    </div>
  );

  const WorkerCard = ({ member }: { member: CrewMember }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-5">
      <div className="w-16 h-16 rounded-2xl bg-emerald-100 overflow-hidden flex items-center justify-center shrink-0 border-2 border-emerald-200">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          member.role === "GUIDE" ? <Award className="w-7 h-7 text-emerald-400" /> : <Car className="w-7 h-7 text-blue-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="font-bold text-slate-900 text-sm">{member.name}</div>
        <div className="text-xs text-slate-500">{member.role === "GUIDE" ? "Tour Guide" : "Driver Wisata"}</div>
        <div className="flex items-center gap-3 mt-1">
          {member.rating !== undefined && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {member.rating.toFixed(1)}
            </span>
          )}
          {member.totalWorkDays !== undefined && (
            <span className="text-[11px] text-slate-400">
              <Briefcase className="w-3 h-3 inline mr-0.5" />
              {member.totalWorkDays} hari kerja
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
    </div>
  );

  // Tampilan jika sudah pernah mereview
  if (alreadyReviewed) return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center">
          <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-9 h-9 text-slate-400" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Ulasan Sudah Dikirim</h2>
          <p className="text-sm text-slate-500 mb-1">
            Anda sudah memberikan ulasan untuk perjalanan wisata ini.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Setiap perjalanan hanya dapat diulas satu kali. Terima kasih atas ulasan Anda! 🙏
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs mb-6 flex items-center gap-2 justify-center">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
            <span>Ulasan Anda membantu wisatawan lain memilih paket terbaik.</span>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/explore"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
            >
              Jelajahi Paket Wisata Lainnya
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/customer/bookings" className="text-xs text-slate-500 hover:text-slate-700 font-semibold">
              Kembali ke Riwayat Pemesanan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const stepProgress = { confirm: 0, destination: 25, guide: 50, driver: 75, done: 100 };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-lg mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Star className="w-7 h-7 fill-amber-400" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Review Perjalanan Wisata</h1>
          <p className="text-xs text-slate-500 mt-1">Bagikan pengalaman berharga Anda untuk membantu wisatawan lain.</p>
        </div>

        {/* Progress Bar */}
        {step !== "confirm" && step !== "done" && (
          <div className="mb-6">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1.5">
              <span className={step === "destination" ? "text-emerald-700" : ""}>Destinasi</span>
              {guide && <span className={step === "guide" ? "text-emerald-700" : ""}>Guide</span>}
              {driver && <span className={step === "driver" ? "text-emerald-700" : ""}>Driver</span>}
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stepProgress[step]}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Confirm Trip Complete */}
        {step === "confirm" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-slate-900 mb-1">Konfirmasi Perjalanan Selesai</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Apakah perjalanan wisata Anda sudah benar-benar selesai? Konfirmasi ini akan mengunci Trip Room dan memulai proses ulasan.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs mb-5 text-center">
              ⚠️ Setelah dikonfirmasi, status perjalanan tidak dapat dikembalikan.
            </div>
            <button
              onClick={handleConfirmTrip}
              disabled={confirming}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              {confirming ? "Memproses..." : "Ya, Perjalanan Sudah Selesai"}
              <CheckCircle2 className="w-4 h-4" />
            </button>
            <Link href="/customer/bookings" className="block text-center text-xs text-slate-500 hover:text-slate-700 mt-3 font-semibold">
              Kembali ke Riwayat Pemesanan
            </Link>
          </div>
        )}

        {/* STEP 2: Review Destinasi */}
        {step === "destination" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Review Paket Wisata & Destinasi</h2>
                <p className="text-[11px] text-slate-500">Bagaimana pengalaman perjalanan wisata Anda secara keseluruhan?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Rating Keseluruhan</label>
                <StarRating value={destinationRating} onChange={setDestinationRating} />
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  {["", "Sangat Buruk", "Kurang Memuaskan", "Cukup Baik", "Bagus", "Sangat Luar Biasa!"][destinationRating]}
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ulasan & Cerita Perjalanan</label>
                <textarea
                  rows={4}
                  placeholder="Ceritakan pengalaman Anda: destinasi, fasilitas, itinerary, akomodasi, dll..."
                  value={destinationComment}
                  onChange={e => setDestinationComment(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
              <button
                onClick={handleSubmitDestinationReview}
                disabled={submitting || !destinationComment.trim()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? "Menyimpan..." : "Simpan & Lanjut"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review Guide */}
        {step === "guide" && guide && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Review Tour Guide</h2>
                <p className="text-[11px] text-slate-500">Berikan penilaian untuk pemandu wisata Anda.</p>
              </div>
            </div>

            <WorkerCard member={guide} />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Rating Tour Guide</label>
                <StarRating value={guideRating} onChange={setGuideRating} />
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  {["", "Sangat Buruk", "Kurang Memuaskan", "Cukup Baik", "Bagus", "Sangat Profesional!"][guideRating]}
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ulasan untuk Tour Guide (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Bagaimana penjelasan, keramahan, dan profesionalisme guide Anda?..."
                  value={guideComment}
                  onChange={e => setGuideComment(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-teal-500 text-slate-900"
                />
              </div>
              <button
                onClick={() => handleSubmitWorkerReview(guide.id, "GUIDE", guideRating, guideComment)}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? "Menyimpan..." : "Simpan & Lanjut"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Review Driver */}
        {step === "driver" && driver && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Review Driver Wisata</h2>
                <p className="text-[11px] text-slate-500">Berikan penilaian untuk pengemudi perjalanan Anda.</p>
              </div>
            </div>

            <WorkerCard member={driver} />

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Rating Driver</label>
                <StarRating value={driverRating} onChange={setDriverRating} />
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  {["", "Sangat Buruk", "Kurang Memuaskan", "Cukup Baik", "Bagus", "Sangat Profesional!"][driverRating]}
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ulasan untuk Driver (Opsional)</label>
                <textarea
                  rows={3}
                  placeholder="Bagaimana keamanan berkendara, ketepatan waktu, dan keramahan driver Anda?..."
                  value={driverComment}
                  onChange={e => setDriverComment(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-blue-500 text-slate-900"
                />
              </div>
              <button
                onClick={() => handleSubmitWorkerReview(driver.id, "DRIVER", driverRating, driverComment)}
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? "Menyimpan..." : "Selesaikan Review"}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Done */}
        {step === "done" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Terima Kasih! 🎉</h2>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              Ulasan Anda sangat berarti bagi pengembangan layanan wisata dan membantu wisatawan lain dalam memilih paket terbaik.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/explore"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all"
              >
                Jelajahi Paket Wisata Lainnya
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/customer/bookings" className="text-xs text-slate-500 hover:text-slate-700 font-semibold">
                Kembali ke Riwayat Pemesanan
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
