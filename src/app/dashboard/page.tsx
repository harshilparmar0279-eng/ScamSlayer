
'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle, Activity, BarChart, CheckCircle, Lightbulb, History, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { AnalyzeContentOutput } from '@/ai/flows/analyze-content-for-scam';
import { cn } from '@/lib/utils';

interface AnalysisHistoryItem extends Omit<AnalyzeContentOutput, 'possibilityScore' | 'informationType'> {
  id: string;
  userId: string;
  content: string;
  probabilityTrue: number;
  probabilityFalseScam: number;
  informationType: string;
  analysisTimestamp: {
    seconds: number;
    nanoseconds: number;
  } | null;
}

const getStatusVariant = (status?: string): 'destructive' | 'secondary' | 'default' => {
  if (!status) {
    return 'secondary';
  }
  if (status.includes('SCAM') || status.includes('FAKE')) {
    return 'destructive';
  }
  if (status.includes('REAL')) {
    return 'default';
  }
  return 'secondary';
};

const getRiskLevelVariant = (riskLevel: 'High' | 'Medium' | 'Low'): 'destructive' | 'secondary' => {
  switch (riskLevel) {
    case 'High':
      return 'destructive';
    case 'Medium':
    case 'Low':
      return 'secondary';
    default:
      return 'secondary';
  }
};

export default function DashboardPage() {
  const { isUserLoading, firestore } = useFirebase();

  // --- Data Fetching ---
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  // We no longer have a user, so we can't query user-specific data.
  // We'll mock the data or show a generic state.
  // For this example, we will query a non-existent collection to simulate an empty state.
  const statsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `public_analysis_results`), orderBy('analysisTimestamp', 'desc'));
  }, [firestore]);

  const recentHistoryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `public_analysis_results`), orderBy('analysisTimestamp', 'desc'), limit(3));
  }, [firestore]);
  
  const { data: statsData, isLoading: isStatsLoading } = useCollection<AnalysisHistoryItem>(statsQuery);
  const { data: recentHistory, isLoading: isHistoryLoading, error: historyError } = useCollection<AnalysisHistoryItem>(recentHistoryQuery);

  // --- Calculations ---
  const totalAnalyzed = statsData?.length ?? 0;
  
  const threatsThisWeek = useMemo(() => {
    if (!statsData) return 0;
    return statsData.filter(item => {
      if (!item.informationStatus) return false;
      const isThreat = item.informationStatus.includes('SCAM') || item.informationStatus.includes('FAKE');
      const itemDate = item.analysisTimestamp ? new Date(item.analysisTimestamp.seconds * 1000) : new Date(0);
      return isThreat && itemDate > last7Days;
    }).length;
  }, [statsData, last7Days]);

  const accuracyConfidence = useMemo(() => {
    if (!statsData || statsData.length === 0) return 0;
    const totalScore = statsData.reduce((acc, item) => {
      if (!item.informationStatus) return acc;
      if (item.informationStatus.includes('REAL')) {
        return acc + item.probabilityTrue;
      } else {
        return acc + item.probabilityFalseScam;
      }
    }, 0);
    return Math.round(totalScore / statsData.length);
  }, [statsData]);

  const threatLevel = useMemo(() => {
    if (threatsThisWeek > 10) return 'High';
    if (threatsThisWeek > 3) return 'Medium';
    return 'Low';
  }, [threatsThisWeek]);

  // --- Security Tips ---
  const securityTips = [
    "Never share your OTP, PIN, or password with anyone, no matter who they claim to be.",
    "Be cautious of urgent requests for money, even if they seem to come from friends or family.",
    "Always verify website links before clicking. Look for `https` and check the domain name carefully.",
    "If a job offer seems too good to be true, it probably is. Research the company independently.",
    "Official organizations will never ask for your sensitive information via SMS or WhatsApp."
  ];
  const [securityTip] = useState(securityTips[Math.floor(Math.random() * securityTips.length)]);

  // --- Skeletons & States ---
  const isLoading = isUserLoading || isStatsLoading || isHistoryLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <Skeleton className="h-10 w-2/3" />
          <div className="p-6 bg-primary/10 rounded-lg"><Skeleton className="h-8 w-1/2" /></div>
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-10 w-1/4" />
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight">Stay Protected</h1>
          <p className="text-muted-foreground">Here's a summary of the community's security status.</p>
        </header>

        <Card className="bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <span className={cn('w-3 h-3 rounded-full', getRiskLevelVariant(threatLevel) === 'destructive' ? 'bg-destructive' : 'bg-green-500')} />
               Community Threat Level: <span className={cn(getRiskLevelVariant(threatLevel) === 'destructive' ? 'text-destructive' : 'text-green-500')}>{threatLevel}</span>
            </CardTitle>
          </CardHeader>
        </Card>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
              <BarChart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAnalyzed}</div>
              <p className="text-xs text-muted-foreground">Total items scanned by the community</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Threats Detected</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{threatsThisWeek}</div>
              <p className="text-xs text-muted-foreground">In the last 7 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accuracyConfidence > 0 ? `${accuracyConfidence}%` : 'N/A'}</div>
              <p className="text-xs text-muted-foreground">Average confidence score</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent History & Security Tip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                 <h2 className="text-xl font-bold font-headline tracking-tight">Recent Community Activity</h2>
                {historyError ? (
                     <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>Could not load recent activity.</AlertDescription>
                    </Alert>
                ) : recentHistory && recentHistory.length > 0 ? (
                    recentHistory.map(item => (
                        <Card key={item.id} className="hover:shadow-md transition-shadow">
                             <CardContent className="p-4 flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg", getStatusVariant(item.informationStatus) === 'destructive' ? 'bg-destructive/10' : 'bg-green-500/10')}>
                                     <ShieldAlert className={cn("w-6 h-6", getStatusVariant(item.informationStatus) === 'destructive' ? 'text-destructive' : 'text-green-500')} />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold truncate">{item.finalVerdict}</p>
                                    <p className="text-sm text-muted-foreground truncate">{item.content}</p>
                                </div>
                                <Badge variant={getStatusVariant(item.informationStatus)}>{item.informationStatus && (item.informationStatus.includes('SCAM') || item.informationStatus.includes('FAKE')) ? 'Suspicious' : 'Safe'}</Badge>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="flex flex-col items-center justify-center p-8 text-center">
                        <History className="w-12 h-12 text-muted-foreground/50 mb-4" />
                        <CardTitle className="font-headline">No Activity Yet</CardTitle>
                        <CardDescription>Recent analyses from the community will appear here.</CardDescription>
                    </Card>
                )}
            </div>
            <div className="space-y-4">
                 <h2 className="text-xl font-bold font-headline tracking-tight">Security Tip</h2>
                 <Card className="bg-accent/20 border-accent/40 h-full">
                    <CardHeader className="flex-row items-start gap-4">
                         <Lightbulb className="w-8 h-8 text-accent-foreground/80 mt-1"/>
                         <CardDescription className="text-accent-foreground/90">
                            {securityTip}
                         </CardDescription>
                    </CardHeader>
                 </Card>
            </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t md:hidden">
        <Button asChild size="lg" className="w-full font-bold text-base">
          <Link href="/analyzer">Analyze Content</Link>
        </Button>
      </div>

       <div className="hidden md:block fixed bottom-8 right-8">
         <Button asChild size="lg" className="shadow-lg font-bold text-base">
           <Link href="/analyzer">Analyze Content</Link>
         </Button>
      </div>
    </AppLayout>
  );
}
