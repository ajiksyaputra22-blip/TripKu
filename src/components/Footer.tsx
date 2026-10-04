"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail } from "lucide-react";

/* Social icons as inline SVG since lucide-react version doesn't include them */
function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconFacebook({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function IconYoutube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
      <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
    </svg>
  );
}

function IconXTwitter({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  const [email, setEmail] = useState("");

  const socialLinks = [
    { Icon: IconInstagram, href: "#", label: "Instagram" },
    { Icon: IconFacebook, href: "#", label: "Facebook" },
    { Icon: IconYoutube, href: "#", label: "YouTube" },
    { Icon: IconXTwitter, href: "#", label: "X (Twitter)" },
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
                <span>cs@tripku.id</span>
              </li>
              <li>Senin – Minggu, 08.00 – 20.00 WIB</li>
            </ul>

            <div className="flex items-center gap-2 mt-5">
              {socialLinks.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
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
