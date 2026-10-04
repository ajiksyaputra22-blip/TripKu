"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, Package, CreditCard, UserCheck, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "BOOKING" | "PAYMENT" | "ASSIGNMENT" | "TRIP_UPDATE";
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function NotifIcon({ type }: { type: string }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  switch (type) {
    case "BOOKING":
      return <div className={`${base} bg-emerald-100`}><Package className="w-4 h-4 text-emerald-600" /></div>;
    case "PAYMENT":
      return <div className={`${base} bg-blue-100`}><CreditCard className="w-4 h-4 text-blue-600" /></div>;
    case "ASSIGNMENT":
      return <div className={`${base} bg-orange-100`}><UserCheck className="w-4 h-4 text-orange-600" /></div>;
    case "TRIP_UPDATE":
      return <div className={`${base} bg-purple-100`}><MessageSquare className="w-4 h-4 text-purple-600" /></div>;
    default:
      return <div className={`${base} bg-slate-100`}><Bell className="w-4 h-4 text-slate-500" /></div>;
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }, []);

  // Polling setiap 30 detik untuk unread count
  useEffect(() => {
    fetchNotifications();
    pollingRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchNotifications]);

  // Close dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleOpen = async () => {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markOneRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Notifikasi"
        className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
          style={{ animation: "fadeInDown 0.18s ease" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-bold text-slate-800">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded-full">
                  {unreadCount} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  title="Tandai semua sudah dibaca"
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Baca semua
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-400">Memuat notifikasi…</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium">Tidak ada notifikasi</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group ${
                    !notif.isRead ? "bg-emerald-50/50" : ""
                  }`}
                  onClick={() => {
                    if (!notif.isRead) markOneRead(notif.id);
                  }}
                >
                  <NotifIcon type={notif.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-bold leading-tight ${!notif.isRead ? "text-slate-900" : "text-slate-600"}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-slate-400">{timeAgo(notif.createdAt)}</span>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          onClick={() => { if (!notif.isRead) markOneRead(notif.id); setOpen(false); }}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:underline transition-opacity"
                        >
                          Lihat <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-center text-[10px] text-slate-400">
                Menampilkan {notifications.length} notifikasi terbaru
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
