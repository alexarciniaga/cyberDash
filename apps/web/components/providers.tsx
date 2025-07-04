"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { getEnvironmentConfig } from "@/lib/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => {
    const config = getEnvironmentConfig();
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: config.query.staleTime,
          refetchInterval: config.query.refetchInterval,
          refetchOnWindowFocus: false,
          refetchOnReconnect: true, // Refetch when network reconnects
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors, but retry on network errors
            if (error instanceof Error && "status" in error) {
              const status = (error as any).status;
              if (status >= 400 && status < 500) return false;
            }
            return failureCount < config.query.retryCount;
          },
        },
        mutations: {
          retry: false, // Don't retry mutations by default
        },
      },
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        {children}
        {/* Only include devtools in development */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </NextThemesProvider>
    </QueryClientProvider>
  );
}
