"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import NotificationBell from "./NotificationBell";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TRAVEL" | "CUSTOMER" | "GUIDE" | "DRIVER";
  travelId?: string;
  avatarUrl?: string;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/";
  };

  // Check if user is a partner/admin role (they should only see partner pages)
  const isPartnerOrAdmin = user && ["TRAVEL", "GUIDE", "DRIVER", "ADMIN"].includes(user.role);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo - TripKu */}
        <Link href={isPartnerOrAdmin ? (user.role === "TRAVEL" ? "/travel/dashboard" : user.role === "GUIDE" ? "/guide/dashboard" : user.role === "DRIVER" ? "/driver/dashboard" : "/admin/dashboard") : "/"} className="flex items-center group">
          <img
            src="/logo.png"
            alt="TripKu Logo"
            className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Desktop Nav Links - Role Focused Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          {/* Guest or Customer Navigation */}
          {(!user || user.role === "CUSTOMER") && (
            <>
              <Link
                href="/explore"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/explore"
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                Jelajah Paket
              </Link>
              <Link
                href="/compare"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/compare"
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                Komparasi Paket
              </Link>

              {user?.role === "CUSTOMER" && (
                <Link
                  href="/customer/bookings"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/customer/bookings"
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  Pesanan Saya
                </Link>
              )}
            </>
          )}

          {/* Travel Admin Navigation (Dashboard only — other features accessible via action buttons) */}
          {user?.role === "TRAVEL" && (
            <>
              <Link
                href="/travel/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/travel/dashboard"
                  ? "bg-emerald-100/80 text-emerald-800 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                Dashboard
              </Link>
            </>
          )}

          {/* Tour Guide Navigation (Focused on Guide Work) */}
          {user?.role === "GUIDE" && (
            <>
              <Link
                href="/guide/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/guide/dashboard"
                  ? "bg-teal-100 text-teal-800 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                Dashboard
              </Link>
            </>
          )}

          {/* Driver Navigation (Focused on Transport & Trips) */}
          {user?.role === "DRIVER" && (
            <>
              <Link
                href="/driver/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/driver/dashboard"
                  ? "bg-blue-100 text-blue-800 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                Dashboard
              </Link>
            </>
          )}

          {/* Admin Navigation */}
          {user?.role === "ADMIN" && (
            <>
              <Link
                href="/admin/dashboard"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${pathname === "/admin/dashboard"
                  ? "bg-purple-100 text-purple-800 font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
              >
                Dashboard
              </Link>
            </>
          )}
        </nav>

        {/* Right Auth / Profile Menu (No demo switcher) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && (
            <>
              {user ? (
                <>
                  <NotificationBell />
                  <div className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 shadow-xs">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          user.name.charAt(0)
                        )}
                      </div>
                      <div className="hidden sm:block text-left">
                        <div className="text-xs font-bold text-slate-900 max-w-[120px] truncate leading-tight">
                          {user.name}
                        </div>
                        <span className="inline-block text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          {user.role}
                        </span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900">{user.name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {user.role}
                          </span>
                        </div>

                        {user.role === "CUSTOMER" && (
                          <>
                            <Link
                              href="/customer/bookings"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Riwayat Pemesanan
                            </Link>
                            <Link
                              href="/customer/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Profil Saya
                            </Link>
                          </>
                        )}

                        {user.role === "TRAVEL" && (
                          <>
                            <Link
                              href="/travel/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Dashboard
                            </Link>
                            <Link
                              href="/travel/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Profil Agensi Travel
                            </Link>
                            <Link
                              href="/travel/packages"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Manajemen Paket
                            </Link>
                            <Link
                              href="/travel/payments"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Verifikasi Pembayaran
                            </Link>
                            <Link
                              href="/travel/trips"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Jadwal Perjalanan & Kru
                            </Link>
                            <Link
                              href="/travel/booking-history"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Riwayat Pemesanan
                            </Link>
                          </>
                        )}

                        {user.role === "GUIDE" && (
                          <>
                            <Link
                              href="/guide/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Dashboard
                            </Link>
                            <Link
                              href="/guide/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Profil Saya
                            </Link>
                          </>
                        )}

                        {user.role === "DRIVER" && (
                          <>
                            <Link
                              href="/driver/dashboard"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Dashboard
                            </Link>
                            <Link
                              href="/driver/profile"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Profil Saya
                            </Link>
                          </>
                        )}

                        {user.role === "ADMIN" && (
                          <Link
                            href="/admin/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="block px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Dashboard
                          </Link>
                        )}

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Keluar (Logout)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-emerald-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/auth"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm shadow-emerald-600/25 transition-all hover:shadow-md"
                  >
                    Daftar
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer - Role Focused Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {(!user || user.role === "CUSTOMER") && (
            <>
              <Link
                href="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Jelajah Paket
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Komparasi Paket
              </Link>
              {user?.role === "CUSTOMER" && (
                <>
                  <Link
                    href="/customer/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Pesanan Saya
                  </Link>
                  <Link
                    href="/customer/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Profil Saya
                  </Link>
                </>
              )}
            </>
          )}

          {user?.role === "TRAVEL" && (
            <>
              <Link
                href="/travel/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-emerald-800 bg-emerald-50"
              >
                Dashboard
              </Link>
              <Link
                href="/travel/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Profil Agensi Travel
              </Link>
            </>
          )}

          {user?.role === "GUIDE" && (
            <>
              <Link
                href="/guide/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-teal-800 bg-teal-50"
              >
                Dashboard
              </Link>
            </>
          )}

          {user?.role === "DRIVER" && (
            <>
              <Link
                href="/driver/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-blue-800 bg-blue-50"
              >
                Dashboard
              </Link>
            </>
          )}

          {user?.role === "ADMIN" && (
            <>
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-purple-800 bg-purple-50"
              >
                Dashboard
              </Link>

            </>
          )}
        </div>
      )}
    </header>
  );
}
