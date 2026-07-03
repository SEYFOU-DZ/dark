"use client";

import { useState } from "react";
import { Car, FileText, Plus, Languages } from "lucide-react";
import { QuoteWizard } from "@/components/QuoteWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/contexts/LocaleContext";

export default function DashboardPage() {
  const [showWizard, setShowWizard] = useState(false);
  const { locale, setLocale, tr, dir } = useLocale();

  return (
    <div className="min-h-full bg-slate-50/50" dir={dir}>
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white shadow-sm">
            <Car className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {tr("appTagline")}
            </p>
            <h1 className="text-xl font-bold text-slate-900">{tr("appTitle")}</h1>
          </div>

          {/* Language toggle */}
          <button
            onClick={() => setLocale(locale === "en" ? "ar" : "en")}
            className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            title={tr("language")}
          >
            <Languages className="h-4 w-4 text-slate-500" />
            {locale === "en" ? "العربية" : "English"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="h-5 w-5 text-slate-500" />
              {tr("requests")}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {tr("requestsDesc")}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-8">
            <div className="flex flex-col items-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-slate-100 text-slate-600 border border-slate-200/60">
                <Plus className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-500 font-medium">{tr("noRequests")}</p>
              <Button className="mt-5" onClick={() => setShowWizard(true)}>
                <Plus className="h-4 w-4" />
                {tr("newRequest")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {showWizard && <QuoteWizard onClose={() => setShowWizard(false)} />}
    </div>
  );
}
