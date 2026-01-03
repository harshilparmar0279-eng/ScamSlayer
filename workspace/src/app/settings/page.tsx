'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { useFirebase } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Settings as SettingsIcon, LogOut, User, Shield, Palette, Bell, BrainCircuit, KeyRound, Trash2, FileText, LifeBuoy, Moon, Sun
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, auth, isUserLoading } = useFirebase();
  const { setTheme, theme } = useTheme();
  
  const handleLogout = () => {
    if (auth) {
      auth.signOut();
    }
  };

  const UserSkeleton = () => (
     <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application settings.</p>
        </header>

        {isUserLoading ? (
            <UserSkeleton />
        ) : user ? (
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'}/>
                <AvatarFallback className="text-2xl">
                  {user.email ? user.email.charAt(0).toUpperCase() : <User />}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">{user.displayName || 'Anonymous User'}</CardTitle>
                <CardDescription>{user.email || 'No email provided'}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        ) : (
           <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <CardTitle>You are not logged in</CardTitle>
            <CardDescription>Log in to manage your account.</CardDescription>
          </Card>
        )}

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
                    </div>
                </CardContent>
            </Card>

            {/* AI Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><KeyRound /> AI Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>You're All Set!</AlertTitle>
                        <AlertDescription>
                            The application is configured with a server-side API key. You are ready to analyze content.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Bell /> Notifications</CardTitle>
                    <CardDescription>Manage how you receive alerts from the app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                         <div className="space-y-0.5">
                            <Label htmlFor="scam-alerts" className="text-base">Scam Alerts</Label>
                            <p className="text-sm text-muted-foreground">Receive alerts for new community-reported scams.</p>
                        </div>
                        <Switch id="scam-alerts" />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                         <div className="space-y-0.5">
                            <Label htmlFor="high-risk-warnings" className="text-base">High-Risk Warnings</Label>
                            <p className="text-sm text-muted-foreground">Get immediate alerts for high-risk threats.</p>
                        </div>
                        <Switch id="high-risk-warnings" defaultChecked/>
                    </div>
                </CardContent>
            </Card>

            {/* AI Analysis Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><BrainCircuit /> AI Analysis Settings</CardTitle>
                    <CardDescription>Adjust how the AI analyzes content.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="sensitivity">Analysis Sensitivity</Label>
                        <Select defaultValue="medium">
                            <SelectTrigger id="sensitivity">
                                <SelectValue placeholder="Select sensitivity" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low (Basic Detection)</SelectItem>
                                <SelectItem value="medium">Medium (Balanced)</SelectItem>
                                <SelectItem value="high">High (Strict Detection)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="ai-model">AI Model Preference</Label>
                        <Select defaultValue="balanced">
                            <SelectTrigger id="ai-model">
                                <SelectValue placeholder="Select model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fast">Fast (Low Latency)</SelectItem>
                                <SelectItem value="balanced">Balanced</SelectItem>
                                <SelectItem value="advanced">Advanced (High Accuracy)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

             {/* Privacy & Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3"><Trash2 /> Privacy & Data</CardTitle>
                    <CardDescription>Control your data and analysis history.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                     <div className="flex flex-col space-y-2">
                        <Label htmlFor="auto-delete">Auto-delete History</Label>
                        <Select defaultValue="30">
                            <SelectTrigger id="auto-delete">
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="off">Off</SelectItem>
                                <SelectItem value="7">Delete after 7 days</SelectItem>
                                <SelectItem value="30">Delete after 30 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" /> Clear All History
                    </Button>
                </CardContent>
            </Card>

             {/* Legal & Information */}
            <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-3"><FileText/> Legal & Information</h3>
                <div className="grid gap-2">
                    <Button variant="ghost" className="justify-start">About App</Button>
                    <Button variant="ghost" className="justify-start">Privacy Policy</Button>
                    <Button variant="ghost" className="justify-start">Terms of Service</Button>
                </div>
            </div>

            {/* Support */}
             <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center gap-3"><LifeBuoy/> Support</h3>
                 <div className="grid gap-2">
                    <Button variant="ghost" className="justify-start">Contact Support</Button>
                    <Button variant="ghost" className="justify-start">Report False Positive / Negative</Button>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
