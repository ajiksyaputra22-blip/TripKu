import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";

export const metadata = {
  title: "Destinasi Wisata | TripKu",
  description: "Temukan destinasi wisata unggulan Indonesia yang tersedia di TripKu, dari Labuan Bajo hingga Raja Ampat.",
};

const destinations = [
  {
    slug: "labuan-bajo",
    name: "Labuan Bajo & Komodo",
    province: "Nusa Tenggara Timur",
    highlight: "Komodo dragon, snorkeling Pulau Padar, sunset di Bukit Cinta",
    tags: ["Bahari", "Petualangan", "Alam Liar"],
    query: "Labuan+Bajo",
  },
  {
    slug: "raja-ampat",
    name: "Raja Ampat",
    province: "Papua Barat Daya",
    highlight: "Keragaman hayati laut tertinggi di dunia, Pulau Pianemo, Wayag",
    tags: ["Diving", "Snorkeling", "Remote"],
    query: "Raja+Ampat",
  },
  {
    slug: "bromo",
    name: "Bromo & Ijen",
    province: "Jawa Timur",
    highlight: "Sunrise Gunung Bromo, kawah biru Ijen, Savana Teletubbies",
    tags: ["Gunung", "Sunrise", "Pendakian"],
    query: "Bromo",
  },
  {
    slug: "bali",
    name: "Nusa Penida & Bali",
    province: "Bali",
    highlight: "Kelingking Beach, Broken Beach, tebing karang ikonik",
    tags: ["Pantai", "Budaya", "Populer"],
    query: "Bali",
  },
  {
    slug: "yogyakarta",
    name: "Heritage Yogyakarta",
    province: "Daerah Istimewa Yogyakarta",
    highlight: "Borobudur, Prambanan, Keraton, wisata kuliner Malioboro",
    tags: ["Budaya", "Sejarah", "Keluarga"],
    query: "Yogyakarta",
  },
  {
    slug: "toraja",
    name: "Toraja",
    province: "Sulawesi Selatan",
    highlight: "Upacara Rambu Solo, rumah adat Tongkonan, pemakaman batu",
    tags: ["Budaya", "Etnik", "Unik"],
    query: "Toraja",
  },
  {
    slug: "lombok",
    name: "Lombok & Gili",
    province: "Nusa Tenggara Barat",
    highlight: "Gili Trawangan, Rinjani, Pink Beach, Pantai Tanjung Aan",
    tags: ["Pantai", "Gunung", "Diving"],
    query: "Lombok",
  },
  {
    slug: "wakatobi",
    name: "Wakatobi",
    province: "Sulawesi Tenggara",
    highlight: "Terumbu karang kelas dunia, diving spot eksklusif, laut jernih",
    tags: ["Diving", "Remote", "Bahari"],
    query: "Wakatobi",
  },
];

const tagColors: Record<string, string> = {
  Bahari: "bg-blue-50 text-blue-700",
  Petualangan: "bg-orange-50 text-orange-700",
  "Alam Liar": "bg-green-50 text-green-700",
  Diving: "bg-cyan-50 text-cyan-700",
  Snorkeling: "bg-sky-50 text-sky-700",
  Remote: "bg-purple-50 text-purple-700",
  Gunung: "bg-stone-50 text-stone-700",
  Sunrise: "bg-amber-50 text-amber-700",
  Pendakian: "bg-lime-50 text-lime-700",
  Pantai: "bg-teal-50 text-teal-700",
  Budaya: "bg-rose-50 text-rose-700",
  Populer: "bg-emerald-50 text-emerald-700",
  Sejarah: "bg-yellow-50 text-yellow-700",
  Keluarga: "bg-pink-50 text-pink-700",
  Etnik: "bg-indigo-50 text-indigo-700",
  Unik: "bg-violet-50 text-violet-700",
  Bahari2: "bg-blue-50 text-blue-700",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-700 transition-colors">Beranda</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium">Destinasi Wisata</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Destinasi Wisata Indonesia
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Jelajahi keindahan destinasi wisata terbaik Indonesia yang tersedia di TripKu. Klik destinasi untuk melihat paket yang tersedia.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {destinations.map((d) => (
            <Link
              key={d.slug}
              href={`/explore?destination=${d.query}`}
              className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden"
            >
              {/* Color band per destination */}
              <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

              <div className="p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-slate-400">{d.province}</span>
                </div>

                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors leading-tight">
                    {d.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-1.5">{d.highlight}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {d.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${tagColors[tag] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="pt-1 text-[11px] font-bold text-emerald-600 group-hover:underline">
                  Lihat paket tersedia
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 bg-slate-900 rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-base font-extrabold mb-2">Tidak menemukan destinasi yang Anda cari?</h2>
          <p className="text-xs text-slate-400 mb-5">
            Jelajahi semua paket wisata yang tersedia dan gunakan filter untuk menemukan destinasi impian Anda.
          </p>
          <Link
            href="/explore"
            className="inline-block px-6 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Jelajahi Semua Paket
          </Link>
        </div>
      </div>
    </div>
  );
}
