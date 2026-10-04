"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatRupiah, formatDate, formatDateTime, getStatusBadge } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import {
  ArrowLeft,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  RefreshCw,
  ChevronDown,
  FileText
} from "lucide-react";

export default function TravelReportsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [currentTravel, setCurrentTravel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [packageFilter, setPackageFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("ALL"); // ALL, THIS_MONTH, LAST_MONTH, THIS_YEAR

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, packagesRes, profileRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/packages"),
        fetch("/api/auth/me"),
      ]);

      const bookingsData = await bookingsRes.json();
      const packagesData = await packagesRes.json();
      const profileData = await profileRes.json();

      setBookings(bookingsData.bookings || []);
      setPackages(packagesData.packages || []);
      if (profileData?.user?.travel) {
        setCurrentTravel(profileData.user.travel);
      }
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter bookings logic
  const filteredBookings = bookings.filter((b) => {
    // Status Filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "NEEDS_PELUNASAN" && b.status !== "NEEDS_PELUNASAN") return false;
      if (statusFilter === "CONFIRMED" && b.status !== "CONFIRMED") return false;
      if (statusFilter === "COMPLETED" && b.status !== "COMPLETED") return false;
      if (statusFilter === "PENDING" && !b.status.includes("WAITING")) return false;
    }

    // Package Filter
    if (packageFilter !== "ALL" && b.packageId !== packageFilter) {
      return false;
    }

    // Date Filter
    if (dateFilter !== "ALL") {
      const bookingDate = new Date(b.createdAt);
      const now = new Date();
      if (dateFilter === "THIS_MONTH") {
        if (bookingDate.getMonth() !== now.getMonth() || bookingDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (dateFilter === "THIS_YEAR") {
        if (bookingDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = b.bookingCode?.toLowerCase() || "";
      const customer = b.customer?.name?.toLowerCase() || "";
      const pkgName = b.package?.name?.toLowerCase() || "";
      return code.includes(q) || customer.includes(q) || pkgName.includes(q);
    }

    return true;
  });

  // Calculate Metrics
  const totalBookingsCount = filteredBookings.length;
  const totalGrossValue = filteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalPax = filteredBookings.reduce((sum, b) => sum + (b.participantCount || 0), 0);

  // Revenue received (all verified payments)
  let totalRevenueReceived = 0;
  let totalDPAmountReceived = 0;
  let totalPelunasanAmountReceived = 0;
  let totalReceivableRemaining = 0;

  filteredBookings.forEach((b) => {
    const verifiedPayments = b.payments?.filter((p: any) => p.status === "VERIFIED") || [];
    const verifiedSum = verifiedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
    totalRevenueReceived += verifiedSum;

    verifiedPayments.forEach((p: any) => {
      if (p.paymentType === "DP") totalDPAmountReceived += p.amount;
      else totalPelunasanAmountReceived += p.amount;
    });

    // If booking is confirmed or completed, receivable is 0
    if (b.status === "NEEDS_PELUNASAN") {
      const dpAmt = b.dpAmount || 0;
      totalReceivableRemaining += (b.totalPrice - dpAmt);
    } else if (b.status.includes("WAITING")) {
      totalReceivableRemaining += b.totalPrice;
    }
  });

  // Export CSV Handler
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      toast.warning("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "No",
      "Kode Booking",
      "Tanggal Booking",
      "Nama Pemesan",
      "Email Pemesan",
      "No HP Pemesan",
      "Paket Wisata",
      "Tanggal Keberangkatan",
      "Jumlah Pax",
      "Skema Pembayaran",
      "Total Tagihan (Rp)",
      "Nominal DP (Rp)",
      "Status DP",
      "Nominal Terbayar (Rp)",
      "Sisa Tagihan (Rp)",
      "Status Booking",
      "Catatan Pemesan"
    ];

    const rows = filteredBookings.map((b, index) => {
      const verifiedPayments = b.payments?.filter((p: any) => p.status === "VERIFIED") || [];
      const paidAmount = verifiedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
      const remainingAmount = Math.max(0, b.totalPrice - paidAmount);
      const isDP = b.dpAmount > 0;
      const departure = b.package?.departureDate ? new Date(b.package.departureDate).toLocaleDateString("id-ID") : "-";

      return [
        index + 1,
        `"${b.bookingCode}"`,
        `"${new Date(b.createdAt).toLocaleDateString("id-ID")}"`,
        `"${b.customer?.name || "-"}"`,
        `"${b.customer?.email || "-"}"`,
        `"${b.customer?.phone || "-"}"`,
        `"${b.package?.name?.replace(/"/g, '""') || "-"}"`,
        `"${departure}"`,
        b.participantCount,
        isDP ? `"DP (${Math.round(b.dpAmount / b.totalPrice * 100)}%)"` : `"Bayar Penuh (100%)"`,
        b.totalPrice,
        b.dpAmount || 0,
        b.dpPaid ? `"Lunas"` : (isDP ? `"Belum"` : `"-"`),
        paidAmount,
        remainingAmount,
        `"${b.status}"`,
        `"${(b.notes || "-").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const travelName = currentTravel?.businessName?.replace(/\s+/g, "_") || "Agensi_Travel";
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Transaksi_${travelName}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download PDF Handler (menggunakan jsPDF + html2canvas)
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setDownloadingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const element = printAreaRef.current;
      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      let position = 0;
      const pageHeightPx = pdfHeight / ratio;

      while (position < imgHeight) {
        const remaining = imgHeight - position;
        const sliceHeight = Math.min(pageHeightPx, remaining);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgWidth;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(canvas, 0, -position, imgWidth, imgHeight);

        const pageImg = pageCanvas.toDataURL("image/jpeg", 0.92);
        if (position > 0) pdf.addPage();
        pdf.addImage(pageImg, "JPEG", imgX, 0, imgWidth * ratio, sliceHeight * ratio);
        position += pageHeightPx;
      }

      const travelName = currentTravel?.businessName?.replace(/\s+/g, "_") || "Agensi_Travel";
      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`Laporan_${travelName}_${dateStr}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Gagal membuat PDF. Silakan coba tombol Cetak / Simpan PDF sebagai alternatif.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 print:bg-white print:py-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:px-2">

        {/* Navigation & Action Bar (Hidden in Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <Link
            href="/travel/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>

          {/* Download Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Laporan</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${downloadMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {downloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pilih Format Laporan
                </div>
                <button
                  onClick={() => { setDownloadMenuOpen(false); handleExportCSV(); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 text-xs font-medium text-slate-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Excel / CSV</div>
                    <div className="text-[10px] text-slate-400">Buka di Microsoft Excel / Google Sheets</div>
                  </div>
                </button>
                <button
                  onClick={() => { setDownloadMenuOpen(false); handleDownloadPDF(); }}
                  disabled={downloadingPdf || loading}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 text-xs font-medium text-slate-700 disabled:opacity-50"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{downloadingPdf ? "Membuat PDF..." : "Download PDF"}</div>
                    <div className="text-[10px] text-slate-400">Format PDF siap cetak (A4 Landscape)</div>
                  </div>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => { setDownloadMenuOpen(false); handlePrint(); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2.5 text-xs font-medium text-slate-700"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <Printer className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Cetak Langsung</div>
                    <div className="text-[10px] text-slate-400">Print atau Simpan PDF via browser</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PDF capture area: mencakup header + tabel */}
        <div ref={printAreaRef}>

          {/* Print Letterhead Header (Always visible in Print, and modern header in Screen) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 print:border-none print:shadow-none print:p-0 print:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-6 gap-4">
              <div className="flex items-center gap-3.5">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                    {currentTravel?.businessName || "Agensi Travel Wisata"}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Laporan Resmi Transaksi Pemesanan, Penerimaan DP &amp; Pelunasan
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Rekening Resmi: {currentTravel?.bankName || "BCA"} - {currentTravel?.bankAccount || "-"} (a.n. {currentTravel?.bankHolder || currentTravel?.businessName || "-"})
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 space-y-0.5">
                <div>Tanggal Laporan: <strong className="text-slate-800">{formatDate(new Date())}</strong></div>
                <div>Waktu Unduh: <span className="font-mono text-slate-700">{formatDateTime(new Date())}</span></div>
                <div className="text-[11px] text-emerald-700 font-semibold print:text-slate-800">Status Dokumen: Terverifikasi Sistem</div>
              </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 print:grid-cols-4 print:gap-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 print:bg-white">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Total Transaksi (Gross)
                </span>
                <div className="text-base sm:text-lg font-extrabold text-slate-900">
                  {formatRupiah(totalGrossValue)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  {totalBookingsCount} Pemesanan ({totalPax} Pax)
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 print:bg-white">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Dana Diterima (Lunas)
                </span>
                <div className="text-base sm:text-lg font-extrabold text-emerald-700">
                  {formatRupiah(totalRevenueReceived)}
                </div>
                <span className="text-[11px] text-emerald-600 mt-0.5 block">
                  DP: {formatRupiah(totalDPAmountReceived)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 print:bg-white">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Piutang Pelunasan (H-2)
                </span>
                <div className="text-base sm:text-lg font-extrabold text-amber-800">
                  {formatRupiah(totalReceivableRemaining)}
                </div>
                <span className="text-[11px] text-amber-700 mt-0.5 block">
                  Wajib lunas H-2 keberangkatan
                </span>
              </div>

              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 print:bg-white">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  Paket Aktif &amp; Peserta
                </span>
                <div className="text-base sm:text-lg font-extrabold text-blue-900">
                  {packages.length} Paket
                </div>
                <span className="text-[11px] text-blue-700 mt-0.5 block">
                  Total Wisatawan: {totalPax} Orang
                </span>
              </div>
            </div>
          </div>

          {/* Filter Controls (Hidden in Print) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6 print:hidden space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filter Data Laporan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari kode booking / nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                >
                  <option value="ALL">Semua Status Booking</option>
                  <option value="NEEDS_PELUNASAN">DP Terverifikasi (Wajib Lunas H-2)</option>
                  <option value="CONFIRMED">Lunas Terkonfirmasi (100%)</option>
                  <option value="COMPLETED">Perjalanan Selesai</option>
                  <option value="PENDING">Menunggu Verifikasi Pembayaran</option>
                </select>
              </div>

              {/* Package Filter */}
              <div>
                <select
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                >
                  <option value="ALL">Semua Paket Wisata</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium"
                >
                  <option value="ALL">Semua Periode Transaksi</option>
                  <option value="THIS_MONTH">Bulan Ini</option>
                  <option value="THIS_YEAR">Tahun Ini</option>
                </select>
              </div>
            </div>
          </div>

          {/* Report Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-16 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs print:border print:border-slate-300">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider print:bg-slate-100">
                      <th className="p-3.5">No</th>
                      <th className="p-3.5">Kode Booking</th>
                      <th className="p-3.5">Pemesan &amp; Kontak</th>
                      <th className="p-3.5">Paket Wisata</th>
                      <th className="p-3.5">Keberangkatan</th>
                      <th className="p-3.5">Pax</th>
                      <th className="p-3.5">Skema</th>
                      <th className="p-3.5">Total Tagihan</th>
                      <th className="p-3.5">Dana Masuk</th>
                      <th className="p-3.5">Sisa Tagihan</th>
                      <th className="p-3.5">Status Booking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b, idx) => {
                      const badge = getStatusBadge(b.status);
                      const verifiedPayments = b.payments?.filter((p: any) => p.status === "VERIFIED") || [];
                      const paidAmount = verifiedPayments.reduce((s: number, p: any) => s + (p.amount || 0), 0);
                      const remainingAmount = Math.max(0, b.totalPrice - paidAmount);
                      const isDP = b.dpAmount > 0;

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/60 transition-colors print:hover:bg-transparent">
                          <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {b.bookingCode}
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-900">{b.customer?.name}</div>
                            <div className="text-[11px] text-slate-400">{b.customer?.phone || b.customer?.email}</div>
                          </td>
                          <td className="p-3.5 font-medium text-slate-800 max-w-xs truncate">
                            {b.package?.name}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-slate-600">
                            {b.package?.departureDate ? formatDate(b.package.departureDate) : "-"}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900">{b.participantCount} Pax</td>
                          <td className="p-3.5 whitespace-nowrap">
                            {isDP ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                DP {Math.round(b.dpAmount / b.totalPrice * 100)}%
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Full 100%
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {formatRupiah(b.totalPrice)}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-700 whitespace-nowrap">
                            {formatRupiah(paidAmount)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {remainingAmount > 0 ? (
                              <span className="font-bold text-amber-700">
                                {formatRupiah(remainingAmount)}
                                <span className="block text-[10px] text-amber-600 font-normal">Wajib H-2</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Rp 0 (Lunas)</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Summary */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2 print:bg-white">
                <span>Menampilkan <strong>{filteredBookings.length}</strong> data transaksi</span>
                <div className="flex items-center gap-6 font-semibold">
                  <span>Total Omzet: <strong className="text-slate-900">{formatRupiah(totalGrossValue)}</strong></span>
                  <span>Total Dana Diterima: <strong className="text-emerald-700">{formatRupiah(totalRevenueReceived)}</strong></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">Tidak ada data transaksi yang cocok dengan filter yang dipilih.</p>
            </div>
          )}

          {/* End PDF capture area */}
        </div>

        {/* Print Signatures & Footer (Visible only in Print or at bottom) */}
        <div className="hidden print:grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-slate-300 text-xs">
          <div className="text-center">
            <p className="text-slate-500">Diverifikasi oleh Bagian Keuangan,</p>
            <div className="h-20" />
            <p className="font-bold text-slate-900 underline">( Staff Administrasi &amp; Keuangan )</p>
            <p className="text-[10px] text-slate-400">Tanggal: {formatDate(new Date())}</p>
          </div>
          <div className="text-center">
            <p className="text-slate-500">Mengetahui &amp; Menyetujui,</p>
            <div className="h-20" />
            <p className="font-bold text-slate-900 underline">( {currentTravel?.businessName || "Direktur Operasional"} )</p>
            <p className="text-[10px] text-slate-400">Pimpinan Agensi Travel</p>
          </div>
        </div>

      </div>
    </div>
  );
}
