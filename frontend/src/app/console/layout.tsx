import React from "react";
import { ConsoleSidebar } from "@/components/layout/ConsoleSidebar";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <ConsoleSidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
