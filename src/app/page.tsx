"use client";

import { useState } from "react";
import { Car, FileText, Plus } from "lucide-react";
import { QuoteWizard } from "@/components/QuoteWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="min-h-full bg-slate-50/50">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white shadow-sm">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Motor Insurance
            </p>
            <h1 className="text-xl font-bold text-slate-900">Quote Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="h-5 w-5 text-slate-500" />
              Requests
            </CardTitle>
            <CardDescription className="text-slate-500">
              Create a motor insurance quotation step by step, then download the PDF in
              English or Arabic.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No requests yet.</p>
              <Button className="mt-5" onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4" />
                New Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {showWizard && <QuoteWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
