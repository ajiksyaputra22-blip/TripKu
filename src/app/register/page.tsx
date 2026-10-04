"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function RegisterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  useEffect(() => {
    if (role === "TRAVEL") {
      router.replace("/travel/register");
    } else if (role === "GUIDE") {
      router.replace("/guide/register");
    } else if (role === "DRIVER") {
      router.replace("/driver/register");
    } else if (role === "CUSTOMER") {
      router.replace("/customer/register");
    } else {
      router.replace("/auth");
    }
  }, [role, router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <img 
            src="/logo.png" 
            alt="TripKu Logo" 
            className="h-16 w-auto object-contain mx-auto"
          />
        </Link>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Mengarahkan ke pendaftaran TripKu...</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterRedirectContent />
    </Suspense>
  );
}
