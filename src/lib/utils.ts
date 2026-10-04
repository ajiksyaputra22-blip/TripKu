import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d).replace(".", ":");
  return `${dateStr}, ${timeStr} WIB`;
}

export function formatTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  const timeStr = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d).replace(".", ":");
  return `${timeStr} WIB`;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case "CONFIRMED":
    case "VERIFIED":
    case "APPROVED":
    case "ACCEPTED":
    case "COMPLETED":
    case "ACTIVE":
    case "PAID":
      return {
        label: status === "CONFIRMED" ? "Terkonfirmasi" :
               status === "VERIFIED" ? "Terverifikasi" :
               status === "APPROVED" ? "Disetujui" :
               status === "ACCEPTED" ? "Diterima" :
               status === "COMPLETED" ? "Selesai" :
               status === "ACTIVE" ? "Aktif" : "Lunas",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "WAITING_PAYMENT":
    case "PENDING":
    case "WAITING_VERIFICATION":
    case "PROPOSED":
    case "SCHEDULED":
    case "UNPAID":
      return {
        label: status === "WAITING_PAYMENT" ? "Menunggu Bayar" :
               status === "WAITING_VERIFICATION" ? "Menunggu Verifikasi" :
               status === "PROPOSED" ? "Ditawarkan" :
               status === "SCHEDULED" ? "Terjadwal" :
               status === "UNPAID" ? "Belum Dibayar" : "Pending",
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "ONGOING":
    case "IN_PROGRESS":
      return {
        label: "Sedang Berjalan",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "CANCELLED":
    case "REJECTED":
    case "SUSPENDED":
      return {
        label: status === "CANCELLED" ? "Dibatalkan" :
               status === "REJECTED" ? "Ditolak" : "Ditangguhkan",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    default:
      return {
        label: status,
        className: "bg-slate-50 text-slate-700 border-slate-200",
      };
  }
}

export function formatWhatsAppUrl(phone: string | null | undefined, text?: string): string {
  if (!phone) return "#";
  // Clean non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  // Convert 08... to 628...
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (!cleaned.startsWith("62")) {
    cleaned = "62" + cleaned;
  }
  const baseUrl = `https://wa.me/${cleaned}`;
  if (text) {
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  }
  return baseUrl;
}
