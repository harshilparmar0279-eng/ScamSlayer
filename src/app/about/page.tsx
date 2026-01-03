
'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Info, ShieldCheck, Zap, Users, Code
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const features = [
  { name: 'Text Analysis', description: 'Paste any text to check for red flags.' },
  { name: 'URL Scanner', description: 'Verify links before you click them.' },
  { name: 'Image Analysis', description: 'Upload screenshots of suspicious chats or posts.' },
  { name: 'QR Code Scanner', description: 'Check the destination of QR codes safely.' },
  { name: 'Video Analysis', description: 'Analyze keyframes from short video clips.' },
];

const teamMembers = [
    { name: 'Harshil Parmar', initial: 'H' },
    { name: 'Kush Thacker', initial: 'K' },
    { name: 'Charmin Patel', initial: 'C' },
    { name: 'Krishna Somani', initial: 'K' },
]

export default function AboutPage() {

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col items-center text-center">
             <ShieldCheck className="w-16 h-16 text-primary mb-4" />
            <h1 className="text-4xl font-bold font-headline tracking-tight">Suraksha AI</h1>
            <p className="text-lg text-muted-foreground mt-2">Version 1.0.0</p>
        </header>

        <Separator />

        <div className="grid gap-8">
            {/* Mission Statement */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 font-headline text-2xl"><Info /> Our Mission</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        Our mission is to empower users to navigate the digital world safely by detecting scams and misinformation.
                    </p>
                </CardContent>
            </Card>

             {/* Key Features */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 font-headline text-2xl"><Zap /> Key Features</CardTitle>
                    <CardDescription>The app can analyze text, URLs, images, QR codes, and videos to check their authenticity.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    {features.map(feature => (
                        <div key={feature.name} className="p-4 bg-muted/50 rounded-lg">
                            <p className="font-semibold">{feature.name}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>


            {/* The Team */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 font-headline text-2xl"><Users /> The Team</CardTitle>
                    <CardDescription>Created by Quantum Crew</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-6">
                    {teamMembers.map(member => (
                         <div key={member.name} className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{member.initial}</AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{member.name}</p>
                         </div>
                    ))}
                </CardContent>
            </Card>

            <div className="text-center text-muted-foreground text-sm">
                <p>&copy; {new Date().getFullYear()} Quantum Crew. All Rights Reserved.</p>
                 <div className="mt-4 flex justify-center gap-4">
                    <Link href="/about" className="hover:text-primary">Privacy Policy</Link>
                    <Link href="/about" className="hover:text-primary">Terms of Service</Link>
                </div>
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
