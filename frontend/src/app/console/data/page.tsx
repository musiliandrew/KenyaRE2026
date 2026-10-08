"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyTable } from "@/components/cat/PropertyTable";
import { PropertyForm } from "@/components/cat/PropertyForm";
import { AIExposureForm } from "@/components/cat/AIExposureForm";
import { ArrowLeft, Database, Sparkles, PlusCircle } from "lucide-react";

export default function DataPage() {
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
                Data Management
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500">Manage properties and portfolio data</div>
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
      <main className="p-3 sm:p-6 max-w-6xl mx-auto">
        <Tabs defaultValue="properties" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="properties" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Database className="size-3.5 sm:size-4 shrink-0" />
              <span>Properties</span>
            </TabsTrigger>
            <TabsTrigger value="add-form" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <PlusCircle className="size-3.5 sm:size-4 shrink-0" />
              <span>Add Single</span>
            </TabsTrigger>
            <TabsTrigger value="ai-ingest" className="gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3">
              <Sparkles className="size-3.5 sm:size-4 shrink-0" />
              <span>AI Ingest</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-6 shadow-xs">
              <PropertyTable />
            </div>
          </TabsContent>

          <TabsContent value="add-form" className="space-y-4">
            <div className="max-w-2xl mx-auto rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
              <PropertyForm />
            </div>
          </TabsContent>

          <TabsContent value="ai-ingest" className="space-y-4">
            <div className="max-w-2xl mx-auto rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs">
              <AIExposureForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
