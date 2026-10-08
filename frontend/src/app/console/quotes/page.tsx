"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QuoteGenerator } from "@/components/cat/QuoteGenerator";
import { ArrowLeft, Calculator, FileText } from "lucide-react";

export default function QuotesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="size-8 sm:size-9"
            >
              <ArrowLeft className="size-4 sm:size-5" />
            </Button>
            <div>
              <div className="text-xs sm:text-sm font-bold tracking-tight text-[#00264D]">
                Facultative Quotes
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500">Calculate premiums and deductibles</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="text-xs cursor-pointer"
            >
              <span className="hidden xs:inline">Back to</span> Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
            <QuoteGenerator />
          </div>
        </div>
      </main>
    </div>
  );
}
