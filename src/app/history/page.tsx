
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useHistory } from '@/context/HistoryProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisResult, UrlAnalysisResult } from '@/components/analysis-result';
import type { AnalyzeContentOutput } from '@/ai/flows/analyze-content-for-scam';
import type { AnalyzeUrlOutput } from '@/ai/flows/analyze-url';
import { History as HistoryIcon, FileSearch, FileText, Image, Video, Link as LinkIcon, QrCode } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const isUrlResult = (res: any): res is AnalyzeUrlOutput => res && 'safetyStatus' in res;

const PromptIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'text': return <FileText className="w-5 h-5" />;
    case 'url': return <LinkIcon className="w-5 h-5" />;
    case 'image': return <Image className="w-5 h-5" />;
    case 'qrcode': return <QrCode className="w-5 h-5" />;
    case 'video': return <Video className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
};


export default function HistoryPage() {
  const { history } = useHistory();

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-primary" /> Session History
          </h1>
          <p className="text-muted-foreground">
            This is a temporary history of your analyses for this session. It will be cleared when you close this tab.
          </p>
        </header>

        {history.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {history.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-b-0">
                 <Card className="shadow-md">
                    <AccordionTrigger className="p-6 text-left hover:no-underline">
                        <div className="flex items-center gap-4 w-full">
                            <PromptIcon type={item.prompt.type} />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold text-lg truncate">{item.prompt.content}</p>
                                <p className="text-sm text-muted-foreground">Click to view analysis</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                         <div className="border-t pt-6">
                            {isUrlResult(item.result) 
                                ? <UrlAnalysisResult result={item.result as AnalyzeUrlOutput} />
                                : <AnalysisResult result={item.result as AnalyzeContentOutput} />
                            }
                         </div>
                    </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <FileSearch className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <CardTitle className="font-headline text-2xl">No History Yet</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              Your analysis results from this session will appear here. Go to the analyzer to check some content.
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href="/analyzer">Go to Analyzer</Link>
            </Button>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
