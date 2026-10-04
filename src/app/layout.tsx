import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "TripKu - Platform Marketplace Perjalanan Wisata Terpadu",
  description:
    "Platform Marketplace Perjalanan Wisata Terpadu Multi-Vendor. Menghubungkan Customer, Agen Travel, Tour Guide berlisensi, dan Driver armada pariwisata dalam satu ekosistem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <ToastProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
