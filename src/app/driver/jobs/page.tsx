"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WorkerJobVacancies from "@/components/WorkerJobVacancies";

export default function DriverJobsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/driver/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard Driver</span>
        </Link>

        <WorkerJobVacancies role="DRIVER" />
      </div>
    </div>
  );
}
