"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// CONSOLE PAGE REDIRECTED TO NEW DASHBOARD
// Original console functionality preserved in git history for security
// New dashboard at /dashboard provides the simplified hackathon interface

export default function ConsolePage() {
  const router = useRouter();
  useEffect(() => {
    router.push("/console/data");
  }, [router]);
  return null;
}
