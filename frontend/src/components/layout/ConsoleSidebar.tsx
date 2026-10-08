"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Database,
  Compass,
  BarChart3,
  Calculator,
  FileText,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ConsoleSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    {
      step: "Step 1",
      title: "Data Ingestion",
      desc: "Upload portfolio & slips",
      href: "/console/data",
      icon: Database,
      badge: "Start",
      badgeColor: "bg-emerald-100 text-emerald-800",
    },
    {
      step: "Step 2",
      title: "3D Risk Map & Sim",
      desc: "Nairobi pluvial inundation",
      href: "/dashboard?tab=hazard",
      icon: Compass,
      badge: "3D Map",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      step: "Step 3",
      title: "Loss Engine & EP",
      desc: "PML, AAL & treaty curves",
      href: "/dashboard?tab=loss",
      icon: BarChart3,
      badge: "Actuarial",
      badgeColor: "bg-purple-100 text-purple-800",
    },
    {
      step: "Step 4",
      title: "Facultative Quotes",
      desc: "Calculate pure risk rate & slip",
      href: "/console/quotes",
      icon: Calculator,
      badge: "PDF Slip",
      badgeColor: "bg-red-100 text-red-800",
    },
    {
      step: "Reports",
      title: "Executive Dossiers",
      desc: "Groq LLM actuarial briefs",
      href: "/console/reports",
      icon: FileText,
      badge: "PDF",
      badgeColor: "bg-amber-100 text-amber-800",
    },
  ];

  return (
    <>
      {/* MOBILE TOP TRIGGER BAR */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="size-9 cursor-pointer"
            aria-label="Toggle Console Navigation"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-14">
              <Image
                src="/kenya-re-logo.png"
                alt="Kenya Re"
                fill
                sizes="56px"
                className="object-contain"
                priority
              />
            </div>
            <span className="text-xs font-bold tracking-tight text-[#00264D]">
              CAT Risk Console
            </span>
          </div>
        </div>

        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="text-xs cursor-pointer">
            Dashboard
          </Button>
        </Link>
      </div>

      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR ASIDE */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* LOGO & BRANDING HEADER */}
        <div className="flex flex-col border-b border-slate-200 px-5 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="relative h-9 w-24">
                <Image
                  src="/kenya-re-logo.png"
                  alt="Kenya Re Logo"
                  fill
                  sizes="96px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
            <div className="flex lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="size-7"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#00264D]">
              Catastrophe Modeling
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Nairobi Pluvial Flood Model · Team A
            </div>
          </div>
        </div>

        {/* WORKFLOW PIPELINE LABEL */}
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Model Pipeline</span>
            <span className="text-emerald-700 font-mono">4-Step Flow</span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href.includes("?") && pathname === item.href.split("?")[0]);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs transition-all ${
                  isActive
                    ? "bg-[#00264D] text-white shadow-xs font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div
                  className={`mt-0.5 rounded-md p-1.5 shrink-0 ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-[#00264D]"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{item.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? "text-slate-200" : "text-slate-400"
                    }`}
                  >
                    {item.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* QUICK LINK TO FULL INTERACTIVE DASHBOARD */}
        <div className="p-3 border-t border-slate-100">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 hover:bg-slate-100 transition cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-[#D21245]" />
                  <span className="text-xs font-bold text-[#00264D]">Full 3D Dashboard</span>
                </div>
                <ChevronRight className="size-3.5 text-slate-400" />
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Switch to full map & portfolio metrics
              </div>
            </div>
          </Link>
        </div>

        {/* USER PROFILE & LOGOUT FOOTER */}
        <div className="border-t border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-8 rounded-full bg-[#00264D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xs font-bold text-slate-900">
                  {user?.name || "Cat Underwriter"}
                </div>
                <div className="truncate text-[10px] text-slate-500">
                  {user?.role || "Kenya Re Actuarial"}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              title="Sign Out"
              className="size-8 text-slate-500 hover:text-red-600 cursor-pointer"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
