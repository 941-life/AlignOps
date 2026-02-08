"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // Initialize MSW in development
    if (
      process.env.NEXT_PUBLIC_USE_MOCKS === "true" &&
      typeof window !== "undefined"
    ) {
      import("@/mocks/browser").then(({ worker }) => {
        worker.start({
          onUnhandledRequest: "bypass",
        });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

