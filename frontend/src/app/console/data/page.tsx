"use client";

import { useState } from "react";
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

  if (!isAuthenticated) {
    router.push("/login");
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
              onClick={() => router.push("/console")}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <div className="text-sm font-bold tracking-tight text-[#00264D]">
                Data Management
              </div>
              <div className="text-xs text-slate-500">Manage properties and portfolio data</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/console")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties" className="gap-2">
              <Database className="size-4" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="add-form" className="gap-2">
              <PlusCircle className="size-4" />
              Add Property
            </TabsTrigger>
            <TabsTrigger value="ai-ingest" className="gap-2">
              <Sparkles className="size-4" />
              AI Ingestion
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <PropertyTable />
            </div>
          </TabsContent>

          <TabsContent value="add-form" className="space-y-4">
            <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
              <PropertyForm />
            </div>
          </TabsContent>

          <TabsContent value="ai-ingest" className="space-y-4">
            <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6">
              <AIExposureForm />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
