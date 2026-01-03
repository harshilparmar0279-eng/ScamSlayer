'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Bot,
  Loader2,
  Send,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { askChatbot } from '@/ai/flows/ask-chatbot';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useFirebase } from '@/firebase';
import type { AskChatbotOutput } from '@/ai/flows/ask-chatbot';
import { Badge } from './ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters.'),
});

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  history?: AskChatbotOutput['history'];
};

const getStatusVariant = (status?: string): 'destructive' | 'secondary' | 'default' => {
  if (!status) return 'secondary';
  if (status.includes('SCAM') || status.includes('FAKE')) return 'destructive';
  if (status.includes('REAL')) return 'default';
  return 'secondary';
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useFirebase();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { prompt: '' },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', text: values.prompt },
    ]);
    form.reset();

    try {
      const response = await askChatbot({
        prompt: values.prompt,
        userId: user?.uid,
      });

      setMessages(prev => [
        ...prev,
        { 
            id: (Date.now() + 1).toString(), 
            role: 'bot', 
            text: response.answer,
            history: response.history 
        },
      ]);
    } catch (error) {
      toast({
          variant: 'destructive',
          title: 'Chatbot Error',
          description: 'Could not get a response. Please check the server logs.'
      })
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        aria-label="Toggle Chatbot"
      >
        <AnimatePresence>
          {isOpen ? (
            <motion.div key="close" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: -90 }}>
              <X className="h-8 w-8" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ scale: 0, rotate: 90 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 90 }}>
              <Bot className="h-8 w-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-6 z-40 w-[calc(100vw-3rem)] max-w-sm"
          >
            <Card className="flex h-[60vh] flex-col shadow-2xl">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className='bg-primary/20 p-2 rounded-full'>
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <CardTitle>Aegis AI</CardTitle>
                    <CardDescription>How can I help you understand this app?</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Ask me about the app or to see your history!</p>
                            <p className="text-xs">e.g., "Show me my recent history."</p>
                        </div>
                    )}
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex items-start gap-3',
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        )}
                      >
                        {message.role === 'bot' && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                            <Bot size={18} />
                          </div>
                        )}
                        <div
                          className={cn(
                            'max-w-[80%] rounded-xl px-4 py-2 text-sm',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          <p>{message.text}</p>
                          {message.history && message.history.length > 0 && (
                            <div className="mt-3 space-y-2 border-t pt-2">
                                {message.history.map(item => (
                                    <div key={item.id} className='p-2 rounded-md bg-background/50'>
                                        <p className="font-semibold text-xs truncate">{item.finalVerdict}</p>
                                        <div className='flex justify-between items-center mt-1'>
                                            <Badge variant={getStatusVariant(item.informationStatus)} className="text-[10px] py-0">
                                                {item.informationStatus}
                                            </Badge>
                                            {item.analysisTimestamp && (
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(item.analysisTimestamp.seconds * 1000), { addSuffix: true })}
                                            </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                             <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                                <Bot size={18} />
                            </div>
                            <div className="bg-muted px-4 py-3 rounded-xl">
                                <Loader2 className="h-4 w-4 animate-spin text-primary"/>
                            </div>
                        </div>
                     )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="flex w-full items-start gap-2"
                  >
                    <FormField
                      control={form.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Ask a question..."
                              {...field}
                              disabled={isLoading}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Send</span>
                    </Button>
                  </form>
                </Form>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
