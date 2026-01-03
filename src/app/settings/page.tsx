
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Settings as SettingsIcon, Palette, BrainCircuit, FileText, LifeBuoy, Moon, Sun, Trash2
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useHistory } from '@/context/HistoryProvider';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// This wrapper component prevents the theme buttons from rendering on the server,
// which is the cause of the hydration mismatch error.
const ThemeSwitcher = () => {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // You can render a placeholder skeleton here if you want
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant={theme === 'light' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme('light')}>
                <Sun className="h-[1.2rem] w-[1.2rem]"/>
                <span className="sr-only">Set light theme</span>
            </Button>
                <Button variant={theme === 'dark' ? 'secondary' : 'outline'} size="icon" onClick={() => setTheme('dark')}>
                <Moon className="h-[1.2rem] w-[1.2rem]"/>
                <span className="sr-only">Set dark theme</span>
                </Button>
        </div>
    );
};

export default function SettingsPage() {
    const { clearHistory } = useHistory();
    const { toast } = useToast();

    const handleClearHistory = () => {
        clearHistory();
        toast({
            title: "History Cleared",
            description: "Your session analysis history has been cleared.",
        });
    }

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your application settings.</p>
        </header>

        <div className="grid gap-8">
            {/* Appearance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Palette /> Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="theme-switcher" className="text-base">Theme</Label>
                            <p className="text-sm text-muted-foreground">Select a light or dark theme.</p>
                        </div>
                        <ThemeSwitcher />
                    </div>
                </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><BrainCircuit /> AI Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>You're All Set!</AlertTitle>
                        <AlertDescription>
                            The application is configured with a secure, server-side API key. You are ready to analyze content.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

             {/* Privacy & Data */}
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Trash2 /> Privacy & Data</CardTitle>
                    <CardDescription>Manage your temporary session data.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="destructive" onClick={handleClearHistory}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear Session History
                    </Button>
                     <p className="text-sm text-muted-foreground mt-2">
                        This will delete all analysis results from your current session. This action cannot be undone.
                    </p>
                </CardContent>
            </Card>

             {/* Legal & Information */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-3"><FileText/> Legal & Information</h3>
                <div className="grid gap-2">
                    <Button variant="ghost" className="justify-start" asChild>
                        <Link href="/about">About App</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild>
                        <Link href="/about">Privacy Policy</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start" asChild>
                        <Link href="/about">Terms of Service</Link>
                    </Button>
                </div>
            </div>

            {/* Support */}
             <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-3"><LifeBuoy/> Support</h3>
                 <div className="grid gap-2">
                    <div className="p-2 rounded-md">
                        <p className="text-sm font-medium">Contact Support</p>
                        <p className="text-sm text-muted-foreground">project.suraksha.ai@gmail.com</p>
                    </div>
                    <Button variant="ghost" className="justify-start">Report False Positive / Negative</Button>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
