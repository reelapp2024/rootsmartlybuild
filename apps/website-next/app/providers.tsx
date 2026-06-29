'use client'

import { Toaster } from "@/themes/multicolor/components/ui/toaster";
import { Toaster as Sonner } from "@/themes/multicolor/components/ui/sonner";
import { TooltipProvider } from "@/themes/multicolor/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/themes/multicolor/contexts/ThemeContext";
import { ConsoleErrorFilter } from "@/themes/multicolor/components/ConsoleErrorFilter";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes - reduce API calls
        gcTime: 10 * 60 * 1000, // 10 minutes cache
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Don't refetch on mount if data exists
        refetchOnReconnect: true,
        retry: 1, // Only retry once on failure
        retryDelay: 1000, // 1 second delay
      },
      mutations: {
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ConsoleErrorFilter />
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

