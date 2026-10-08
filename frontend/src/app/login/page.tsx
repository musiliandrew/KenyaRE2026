// LOGIN PAGE COMMENTED OUT FOR DEMO MODE
// Login functionality preserved for security but not visible in UI
// Auto-guest access is enabled in AuthContext for hackathon demo

/*
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Lock,
} from "lucide-react";
import type { UserRole } from "@/contexts/AuthContext";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "underwriter", label: "Underwriter - Price Policies" },
  { value: "risk_analyst", label: "Risk Analyst - Analyze Models" },
  { value: "portfolio_manager", label: "Portfolio Manager - Monitor Risk" },
  { value: "county_disaster", label: "County & Disaster Body - View Flood Zones" },
  { value: "cedant_broker", label: "Cedant & Broker - Reinsurance" },
  { value: "judge", label: "Hackathon Judge - Full Access" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedRole) return;

    setIsLoading(true);
    // Simulate login delay
    setTimeout(() => {
      login(email, selectedRole);
      router.push("/console");
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Shield className="size-8 text-[#00264D]" />
            <h1 className="text-2xl font-bold text-[#00264D]">Kenya Re CAT Risk Console</h1>
          </div>
          <p className="text-sm text-slate-600">
            AI-Powered Urban Pluvial Flood Catastrophe Model & Underwriting Platform
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="size-5 text-[#00264D]" />
            <h2 className="text-xl font-bold text-[#00264D]">Sign In</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@kenyare.co.ke"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00264D] focus:border-transparent outline-none transition"
                required
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                Select Your Role
              </label>
              <select
                id="role"
                value={selectedRole || ""}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#00264D] focus:border-transparent outline-none transition bg-white"
                required
              >
                <option value="">Choose a role...</option>
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              disabled={!email || !selectedRole || isLoading}
              className="w-full bg-[#D21245] hover:bg-[#B50F3B] text-white py-3"
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight className="size-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center">
              This is a demo environment. Any email and role combination will work.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-[#00264D]">
            ← Back to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
*/

// Redirect to dashboard instead
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  useEffect(() => {
    router.push("/console");
  }, [router]);
  return null;
}
