"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";

/* Social icons as inline SVG */
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconTikTok({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.27 6.27 0 0 0 1.87-4.49V8.69a8.18 8.18 0 0 0 4.9 1.6V6.85a4.85 4.85 0 0 1-1-.16z" />
    </svg>
  );
}

function IconWhatsApp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");

  const socialLinks = [
    {
      Icon: IconInstagram,
      href: "https://www.instagram.com/trip._ku?xtok=Z2M5dG1zdDBwZHhk",
      label: "Instagram",
    },
    {
      Icon: IconTikTok,
      href: "https://www.tiktok.com/@trip_ku?_r=1&_t=ZS-9BTlESDrkFJ",
      label: "TikTok",
    },
    {
      Icon: IconWhatsApp,
      href: "https://wa.me/62895345428383",
      label: "WhatsApp",
    },
  ];

  return (
    <footer className="bg-[#111111] text-slate-400 text-sm border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-8">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 lg:gap-12 pb-12 border-b border-white/10">

          {/* Col 1: Brand + Newsletter */}
          <div className="md:col-span-1 space-y-5">
            <Link href="/" className="block">
              <span className="text-2xl font-black text-white tracking-tight">TRIPKU.</span>
            </Link>

            <p className="text-xs text-slate-400 leading-relaxed">
              Dapatkan promo terbaru dan info perjalanan hanya dengan mendaftarkan emailmu.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg bg-white text-slate-950 text-xs font-bold hover:bg-slate-100 transition-colors shrink-0"
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Col 2: Bantuan */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider mb-4">Bantuan</h4>
            <ul className="space-y-3 text-xs">
              <li><Link href="/help" className="hover:text-white transition-colors">Pusat Bantuan</Link></li>
              <li><Link href="/payment-methods" className="hover:text-white transition-colors">Metode Pembayaran</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Syarat &amp; Ketentuan</Link></li>
            </ul>
          </div>

          {/* Col 3: TripKu */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider mb-4">Tripku</h4>
            <ul className="space-y-3 text-xs">
              <li><Link href="/about" className="hover:text-white transition-colors">Tentang Kami</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Cara Kerja TripKu</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Destinasi Wisata</Link></li>
            </ul>
          </div>

          {/* Col 4: Mitra Tripku */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider mb-4">Mitra Tripku</h4>
            <ul className="space-y-3 text-xs">
              <li><Link href="/travel/register" className="hover:text-white transition-colors">Daftar Agensi Travel</Link></li>
              <li><Link href="/guide/register" className="hover:text-white transition-colors">Gabung Tour Guide</Link></li>
              <li><Link href="/driver/register" className="hover:text-white transition-colors">Gabung Driver</Link></li>
              <li><Link href="/auth" className="hover:text-white transition-colors">Panduan Mitra</Link></li>
            </ul>
          </div>

          {/* Col 5: Hubungi Kami + Social */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider mb-4">Hubungi Kami</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>tripku797@gmail.com</span>
              </li>
              <li className="flex items-center gap-2">
                <IconWhatsApp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <a
                  href="https://wa.me/62895345428383"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  +62 895-3454-28383
                </a>
              </li>
              <li>Senin s/d Jum'at, 08.00 - 17.00 WIB</li>
            </ul>

            <div className="flex items-center gap-2 mt-5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-md bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-3.5 h-3.5 text-slate-300" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>© {new Date().getFullYear()} Tripku. Semua hak dilindungi.</span>
        </div>
      </div>
    </footer>
  );
}
