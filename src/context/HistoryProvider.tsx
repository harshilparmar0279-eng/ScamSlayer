
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { AnalyzeContentOutput } from '@/ai/flows/analyze-content-for-scam';
import type { AnalyzeUrlOutput } from '@/ai/flows/analyze-url';

// Define the shape of the user's input
interface Prompt {
  type: 'text' | 'url' | 'image' | 'qrcode' | 'video';
  content: string; // The text, URL, or a description of the file
}

// Define the history item to include both prompt and result
export interface HistoryItem {
  id: string;
  prompt: Prompt;
  result: AnalyzeContentOutput | AnalyzeUrlOutput;
}

interface HistoryContextType {
  history: HistoryItem[];
  addHistoryItem: (item: HistoryItem) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const addHistoryItem = (item: HistoryItem) => {
    setHistory(prevHistory => [item, ...prevHistory]);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <HistoryContext.Provider value={{ history, addHistoryItem, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
}
