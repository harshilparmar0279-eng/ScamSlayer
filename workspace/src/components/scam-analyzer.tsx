'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, FileText, Image as ImageIcon, Video, Upload, Link as LinkIcon, QrCode } from 'lucide-react';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { analyzeContentForScam } from '@/ai/flows/analyze-content-for-scam';
import { analyzeUrl } from '@/ai/flows/analyze-url';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AnalyzeContentInput, AnalyzeContentOutput } from '@/ai/flows/analyze-content-for-scam';
import type { AnalyzeUrlOutput } from '@/ai/flows/analyze-url';
import { AnalysisResult, UrlAnalysisResult } from './analysis-result';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { fileToDataURI } from '@/lib/utils';
import Image from 'next/image';
import { collection, serverTimestamp } from 'firebase/firestore';
import jsQR from 'jsqr';

const formSchema = z.object({
  contentType: z.enum(['text', 'image', 'video', 'url', 'qrcode']),
  content: z.string().optional(),
  imageFile: z.any().optional(),
  videoFile: z.any().optional(),
  url: z.string().optional(),
  qrCodeFile: z.any().optional(),
}).superRefine((data, ctx) => {
    if (data.contentType === 'text') {
        if (!data.content || data.content.length < 20) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Content must be at least 20 characters.' });
        }
    }
    if (data.contentType === 'image' && !data.imageFile) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['imageFile'], message: 'Please upload an image file.' });
    }
     if (data.contentType === 'qrcode' && !data.qrCodeFile) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['qrCodeFile'], message: 'Please upload a QR code image.' });
    }
    if (data.contentType === 'video' && !data.videoFile) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['videoFile'], message: 'Please upload a video file.' });
    }
    if (data.contentType === 'url') {
        if (!data.url) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'Please enter a URL.' });
        } else {
            try {
                new URL(data.url);
            } catch {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['url'], message: 'Please enter a valid URL.' });
            }
        }
    }
});

type FormValues = z.infer<typeof formSchema>;

export function ScamAnalyzer() {
  const [analysisResult, setAnalysisResult] = useState<AnalyzeContentOutput | AnalyzeUrlOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const { user, firestore } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contentType: 'text',
      content: '',
      url: '',
    },
  });

  const decodeQrCode = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(code ? code.data : null);
        };
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: any, type: 'image' | 'video' | 'qrcode') => {
    const file = e.target.files?.[0];
    if (file) {
        field.onChange(file);
        const dataUri = await fileToDataURI(file);
        setPreview(dataUri);

        if (type === 'qrcode') {
            const qrData = await decodeQrCode(file);
            if (qrData) {
                form.setValue('url', qrData);
                toast({ title: 'QR Code Decoded', description: `Found URL: ${qrData}` });
                // Automatically submit for analysis
                onSubmit({ ...form.getValues(), contentType: 'url', url: qrData });
            } else {
                toast({ variant: 'destructive', title: 'QR Code Error', description: 'Could not decode QR code from the image.' });
            }
        }
    }
  };
  
  const handleTabChange = (value: string) => {
    form.setValue('contentType', value as FormValues['contentType']);
    setAnalysisResult(null);
    setPreview(null);
    form.reset({
        contentType: value as FormValues['contentType'],
        content: '',
        imageFile: undefined,
        videoFile: undefined,
        url: '',
        qrCodeFile: undefined
    });
  }

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setAnalysisResult(null);
    
    let contentToSave = '';

    try {
      let result;
      if (values.contentType === 'url' && values.url) {
        contentToSave = `URL: ${values.url}`;
        const urlResult = await analyzeUrl({ url: values.url });
        // Adapt to AnalyzeContentOutput structure for history
        result = {
          informationStatus: urlResult.safetyStatus === 'Unsafe' ? 'SCAM / FRAUD' : urlResult.safetyStatus === 'Suspicious' ? 'SUSPICIOUS' : 'REAL INFORMATION',
          possibilityScore: {
            falseOrScam: urlResult.safetyStatus === 'Unsafe' ? 95 : urlResult.safetyStatus === 'Suspicious' ? 60 : 5,
            true: urlResult.safetyStatus === 'Safe' ? 95 : urlResult.safetyStatus === 'Suspicious' ? 40 : 5,
          },
          informationType: [urlResult.risk],
          simpleExplanation: urlResult.reason,
          warningOrSafetyAdvice: urlResult.advice,
          finalVerdict: `This URL is considered ${urlResult.safetyStatus}.`,
        };
        setAnalysisResult(urlResult);
      } else {
          let input: AnalyzeContentInput = {};
          if (values.contentType === 'text' && values.content) {
              input.content = values.content;
              contentToSave = values.content;
          } else if (values.contentType === 'image' && values.imageFile) {
              input.photoDataUri = await fileToDataURI(values.imageFile);
              contentToSave = `Image: ${values.imageFile.name}`;
          } else if (values.contentType === 'video' && values.videoFile) {
              input.videoDataUri = await fileToDataURI(values.videoFile);
              contentToSave = `Video: ${values.videoFile.name}`;
          }
          
          if (Object.keys(input).length < 1 && !(values.contentType === 'qrcode' && values.url)) {
            toast({ variant: "destructive", title: "No Content", description: "Please provide content to analyze." });
            setIsLoading(false);
            return;
          }
          result = await analyzeContentForScam(input);
          setAnalysisResult(result);
      }
      
      if (user && firestore && result) {
        addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'analysis_results'), {
          content: contentToSave,
          informationStatus: result.informationStatus,
          probabilityTrue: result.possibilityScore.true,
          probabilityFalseScam: result.possibilityScore.falseOrScam,
          informationType: Array.isArray(result.informationType) ? result.informationType.join(', ') : result.informationType,
          simpleExplanation: result.simpleExplanation,
          warningOrSafetyAdvice: result.warningOrSafetyAdvice,
          finalVerdict: result.finalVerdict,
          analysisTimestamp: serverTimestamp(),
          userId: user.uid,
        });
      }

    } catch (e: any) {
      toast({ variant: "destructive", title: "Analysis Failed", description: e.message || "An unexpected error occurred." });
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const AnalysisSkeleton = () => (
     <div className="space-y-6">
        <Card className="shadow-lg animate-pulse">
          <CardHeader className="flex flex-row items-center space-x-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-8 w-32 mt-2" />
            </div>
          </CardHeader>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg animate-pulse">
            <CardHeader><Skeleton className="h-8 w-40" /></CardHeader>
            <CardContent className="flex justify-center items-center"><Skeleton className="h-56 w-56 rounded-full" /></CardContent>
          </Card>
          <Card className="shadow-lg animate-pulse">
            <CardHeader><Skeleton className="h-8 w-40" /></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
  )

  const isUrlResult = (res: any): res is AnalyzeUrlOutput => res && 'safetyStatus' in res;

  return (
    <div className="grid gap-8">
      <Card className="w-full shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Analyze Content for Scams</CardTitle>
          <CardDescription>
            Select the content type and provide the content to check for scams or fake information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="text" disabled={isLoading}><FileText className="mr-2 h-4 w-4" />Text</TabsTrigger>
                <TabsTrigger value="url" disabled={isLoading}><LinkIcon className="mr-2 h-4 w-4" />URL</TabsTrigger>
                <TabsTrigger value="image" disabled={isLoading}><ImageIcon className="mr-2 h-4 w-4" />Image</TabsTrigger>
                <TabsTrigger value="qrcode" disabled={isLoading}><QrCode className="mr-2 h-4 w-4" />QR Code</TabsTrigger>
                <TabsTrigger value="video" disabled={isLoading}><Video className="mr-2 h-4 w-4" />Video</TabsTrigger>
              </TabsList>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                <TabsContent value="text">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Text Content</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='e.g. "Congratulations! You won ₹10,00,000. Click this link and share OTP to claim."'
                            className="min-h-[150px] resize-y"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                 <TabsContent value="url">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://example.com"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="image">
                   <FormField
                    control={form.control}
                    name="imageFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image File</FormLabel>
                        <FormControl>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                    {preview ? (
                                        <Image src={preview} alt="Image preview" width={200} height={200} className="max-h-full max-w-full p-2 object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF</p>
                                        </div>
                                    )}
                                    <Input id="image-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, field, 'image')} disabled={isLoading} />
                                </label>
                            </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                 <TabsContent value="qrcode">
                   <FormField
                    control={form.control}
                    name="qrCodeFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>QR Code Image</FormLabel>
                        <FormControl>
                            <div className="flex items-center justify-center w-full">
                                <label htmlFor="qrcode-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                    {preview ? (
                                        <Image src={preview} alt="QR Code preview" width={200} height={200} className="max-h-full max-w-full p-2 object-contain" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> a QR code image</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG</p>
                                        </div>
                                    )}
                                    <Input id="qrcode-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleFileChange(e, field, 'qrcode')} disabled={isLoading} />
                                </label>
                            </div>
                        </FormControl>
                        <FormDescription>The app will scan the QR code and analyze the URL it contains.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                 <TabsContent value="video">
                  <FormField
                    control={form.control}
                    name="videoFile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video File</FormLabel>
                        <FormControl>
                             <div className="flex items-center justify-center w-full">
                                <label htmlFor="video-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80">
                                    {preview ? (
                                        <video src={preview} controls className="max-h-full max-w-full p-2" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                            <p className="text-xs text-muted-foreground">MP4, AVI, MOV</p>
                                        </div>
                                    )}
                                    <Input id="video-upload" type="file" className="hidden" accept="video/*" onChange={(e) => handleFileChange(e, field, 'video')} disabled={isLoading} />
                                </label>
                            </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                {form.getValues('contentType') !== 'qrcode' && (
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze Content'
                    )}
                  </Button>
                )}
              </form>
            </Tabs>
          </Form>
        </CardContent>
      </Card>

      {isLoading && <AnalysisSkeleton />}
      {analysisResult && (
        isUrlResult(analysisResult) 
          ? <UrlAnalysisResult result={analysisResult} />
          : <AnalysisResult result={analysisResult as AnalyzeContentOutput} />
      )}
    </div>
  );
}
