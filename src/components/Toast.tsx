"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  dismissToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Helper for global dispatch without hook
export function emitToast(message: string, type: ToastType = "info", title?: string, duration = 4000) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("tripku-toast", {
        detail: { message, type, title, duration },
      })
    );
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem: ToastItem = { id, message, type, title, duration };

      setToasts((prev) => [...prev.slice(-4), newItem]); // Max 5 toasts visible

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  useEffect(() => {
    const handleCustomToast = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { message, type, title, duration } = customEvent.detail;
        showToast(message, type, title, duration);
      }
    };

    window.addEventListener("tripku-toast", handleCustomToast);

    // Global override for window.alert to completely prevent "localhost says..." browser dialogs
    const originalAlert = window.alert;
    window.alert = (msg?: any) => {
      const text = String(msg ?? "");
      const isSuccess = /berhasil|sukses|terima kasih|disetujui|lunas|selesai|✓|🎉/i.test(text);
      const isError = /gagal|error|salah|ditolak|tidak valid|wajib|peringatan|batal|belum|maksimal/i.test(text);
      const type: ToastType = isSuccess ? "success" : isError ? "error" : "info";
      const title = isSuccess ? "Berhasil" : isError ? "Perhatian" : "Pemberitahuan";
      showToast(text, type, title);
    };

    return () => {
      window.removeEventListener("tripku-toast", handleCustomToast);
      window.alert = originalAlert;
    };
  }, [showToast]);

  const toast = {
    success: (message: string, title?: string) => showToast(message, "success", title || "Berhasil!"),
    error: (message: string, title?: string) => showToast(message, "error", title || "Gagal!"),
    info: (message: string, title?: string) => showToast(message, "info", title || "Informasi"),
    warning: (message: string, title?: string) => showToast(message, "warning", title || "Perhatian"),
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, toast }}>
      {children}
      {/* Toast Floating Container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((item) => {
          let bgClass = "bg-white border-slate-200 text-slate-800";
          let icon = <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />;
          let barClass = "bg-blue-500";

          if (item.type === "success") {
            bgClass = "bg-emerald-50/95 border-emerald-300 text-emerald-950";
            icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
            barClass = "bg-emerald-500";
          } else if (item.type === "error") {
            bgClass = "bg-rose-50/95 border-rose-300 text-rose-950";
            icon = <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
            barClass = "bg-rose-500";
          } else if (item.type === "warning") {
            bgClass = "bg-amber-50/95 border-amber-300 text-amber-950";
            icon = <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
            barClass = "bg-amber-500";
          } else {
            bgClass = "bg-blue-50/95 border-blue-300 text-blue-950";
            icon = <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />;
            barClass = "bg-blue-500";
          }

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300 transform translate-y-0 opacity-100 animate-in slide-in-from-top-3 ${bgClass}`}
              role="alert"
            >
              {icon}
              <div className="flex-1 min-w-0 pr-1">
                {item.title && (
                  <h4 className="text-xs font-bold leading-tight mb-0.5">{item.title}</h4>
                )}
                <p className="text-xs font-medium leading-relaxed opacity-90 break-words">
                  {item.message}
                </p>
              </div>
              <button
                onClick={() => dismissToast(item.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors shrink-0"
                aria-label="Tutup notifikasi"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
