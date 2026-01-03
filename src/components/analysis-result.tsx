
'use client';

import type { AnalyzeContentOutput } from '@/ai/flows/analyze-content-for-scam';
import type { AnalyzeUrlOutput } from '@/ai/flows/analyze-url';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { AlertCircle, CheckCircle2, ShieldAlert, FileWarning, Lightbulb, UserCheck, MessageSquareWarning, Link as LinkIcon, ShieldQuestion, Zap, BrainCircuit, MicVocal, Video } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface AnalysisResultProps {
  result: AnalyzeContentOutput;
}
interface UrlAnalysisResultProps {
  result: AnalyzeUrlOutput;
}

const getStatusInfo = (status: AnalyzeContentOutput['informationStatus'] | AnalyzeUrlOutput['safetyStatus']) => {
  switch (status) {
    case 'SCAM':
    case 'SCAM / FRAUD':
    case 'Unsafe':
      return { Icon: ShieldAlert, color: 'text-destructive', bgColor: 'bg-destructive/10', label: 'Scam / Unsafe' };
    case 'FAKE':
    case 'FAKE INFORMATION':
      return { Icon: FileWarning, color: 'text-accent', bgColor: 'bg-accent/20', label: 'Fake / AI-Generated' };
    case 'SUSPICIOUS':
    case 'Suspicious':
        return { Icon: ShieldQuestion, color: 'text-accent', bgColor: 'bg-accent/20', label: 'Suspicious' };
    case 'REAL':
    case 'REAL INFORMATION':
    case 'Safe':
      return { Icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', label: 'Real / Safe' };
    default:
      return { Icon: AlertCircle, color: 'text-muted-foreground', bgColor: 'bg-muted', label: 'Unknown' };
  }
};

const getInformationTypeIcon = (type: string) => {
    const iconMap: { [key: string]: React.ElementType } = {
        'Fake News': FileWarning, 'Financial Scam': ShieldAlert, 'Job Scam': ShieldAlert,
        'Lottery Scam': ShieldAlert, 'Phishing': ShieldAlert, 'OTP / UPI Fraud': ShieldAlert,
        'Clickbait': MessageSquareWarning, 'Misinformation': FileWarning, 'Genuine Information': CheckCircle2,
        'Sextortion': ShieldAlert, 'Tech Support Scam': ShieldAlert, 'Deepfake': Video,
    };
    return iconMap[type] || AlertCircle;
};

const getDetailedAnalysisIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('psychological') || lowerType.includes('urgency') || lowerType.includes('fear') || lowerType.includes('greed')) return Zap;
    if (lowerType.includes('language') || lowerType.includes('grammar') || lowerType.includes('tone')) return MicVocal;
    if (lowerType.includes('request') || lowerType.includes('asks for')) return BrainCircuit;
    if (lowerType.includes('video')) return Video;
    return AlertCircle;
}

const DetailedAnalysisSection = ({ title, items, icon: TitleIcon }: { title: string, items: string[], icon: React.ElementType }) => {
    if (!items || items.length === 0) return null;
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-lg"><TitleIcon className="text-primary w-5 h-5"/> {title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
                {items.map((item) => (
                    <Badge key={item} variant="secondary" className="text-sm py-1 px-3">
                      {item}
                    </Badge>
                ))}
            </CardContent>
        </Card>
    )
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const { Icon, color, bgColor, label } = getStatusInfo(result.informationStatus);
  const chartData = useMemo(() => {
    const isVideo = result.informationType.includes('Deepfake');
    return [
        { name: isVideo ? 'Fake / AI' : 'False / Scam', value: result.possibilityScore.falseOrScam },
        { name: isVideo ? 'Authentic' : 'True', value: result.possibilityScore.true },
    ];
  }, [result.possibilityScore, result.informationType]);

  const COLORS = ['hsl(var(--destructive))', 'hsl(var(--success))'];

  const scoreColor = useMemo(() => {
    const score = result.possibilityScore.falseOrScam;
    if (score > 75) return 'text-destructive';
    if (score > 40) return 'text-accent';
    return 'text-success';
  }, [result.possibilityScore.falseOrScam]);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      <Card className={cn('shadow-lg border-2', bgColor.replace('bg-', 'border-'))}>
        <CardHeader className="flex flex-row items-center space-x-4">
          <Icon className={cn('w-10 h-10 flex-shrink-0', color)} />
          <div>
            <CardTitle className="font-headline text-xl md:text-2xl">Information Status</CardTitle>
            <p className={cn('text-2xl md:text-3xl font-bold', color)}>{label}</p>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Lightbulb className="text-primary"/> Possibility Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.7;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        if (percent === 0) return null;
                        return (
                          <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-sm font-bold">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none" />
                    ))}
                  </Pie>
                  <Legend iconSize={12} wrapperStyle={{fontSize: "0.875rem"}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
             <p className="text-center text-muted-foreground mt-4">
              Likelihood of being malicious or AI-generated: <span className={cn('font-bold', scoreColor)}>{result.possibilityScore.falseOrScam}%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><FileWarning className="text-primary"/> Information Type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {result.informationType.map((type) => {
              const TypeIcon = getInformationTypeIcon(type);
              return (
                <Badge key={type} variant={result.informationStatus === 'REAL' || result.informationStatus === 'REAL INFORMATION' ? 'default' : 'destructive'} className="text-sm py-1 px-3">
                  <TypeIcon className="w-4 h-4 mr-2"/>
                  {type}
                </Badge>
              );
            })}
          </CardContent>
        </Card>
      </div>

       {result.detailedAnalysis && (
        <div className="space-y-4">
             <h2 className="font-headline text-xl font-semibold tracking-tight">Detailed Analysis</h2>
             <div className="grid md:grid-cols-3 gap-4">
                <DetailedAnalysisSection title="Psychological Triggers" items={result.detailedAnalysis.psychologicalTriggers} icon={Zap} />
                <DetailedAnalysisSection title="Language Analysis" items={result.detailedAnalysis.languageAnalysis} icon={MicVocal} />
                <DetailedAnalysisSection title="Request Analysis" items={result.detailedAnalysis.requestAnalysis} icon={BrainCircuit} />
                {result.detailedAnalysis.videoAnalysis && <DetailedAnalysisSection title="Video Analysis" items={result.detailedAnalysis.videoAnalysis} icon={Video} />}
             </div>
        </div>
       )}


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><UserCheck className="text-primary"/> Simple Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{result.simpleExplanation}</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-lg bg-accent/20 border-accent/40">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2 text-accent-foreground/90"><ShieldAlert /> Warning & Safety Advice</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-accent-foreground/80 whitespace-pre-wrap leading-relaxed">{result.warningOrSafetyAdvice}</p>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Final Verdict</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{result.finalVerdict}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function UrlAnalysisResult({ result }: UrlAnalysisResultProps) {
    const { Icon, color, bgColor, label } = getStatusInfo(result.safetyStatus);

    return (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className={cn('shadow-lg border-2', bgColor.replace('bg-', 'border-'))}>
                <CardHeader className="flex flex-row items-center space-x-4">
                <Icon className={cn('w-10 h-10 flex-shrink-0', color)} />
                <div>
                    <CardTitle className="font-headline text-xl md:text-2xl">URL Safety Status</CardTitle>
                    <p className={cn('text-2xl md:text-3xl font-bold', color)}>{label}</p>
                </div>
                </CardHeader>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2"><LinkIcon className="text-primary" /> Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <h4 className="font-semibold">Reason</h4>
                        <p className="text-muted-foreground">{result.reason}</p>
                     </div>
                     <div>
                        <h4 className="font-semibold">Potential Risk</h4>
                        <p className="text-muted-foreground">{result.risk}</p>
                     </div>
                </CardContent>
            </Card>

            <Card className="shadow-lg bg-accent/20 border-accent/40">
                <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2 text-accent-foreground/90"><ShieldAlert /> Safety Advice</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-accent-foreground/80 whitespace-pre-wrap leading-relaxed">{result.advice}</p>
                </CardContent>
            </Card>
        </div>
    );
}
