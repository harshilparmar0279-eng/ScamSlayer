'use client';

import { AppLayout } from "@/components/layout/app-layout";
import { ScamAnalyzer } from "@/components/scam-analyzer";
import { Bot } from "lucide-react";

export default function AnalyzerPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center gap-4">
          <Bot className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">AI Analyzer</h1>
            <p className="text-muted-foreground">Analyze content to detect scams and fake news.</p>
          </div>
        </header>
        <ScamAnalyzer />
      </div>
    </AppLayout>
  );
}
