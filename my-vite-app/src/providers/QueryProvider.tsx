/**
 * Query Provider Component
 *
 * Sets up TanStack React Query for the application.
 * Provides query client context and development tools.
 */

import React, { Suspense, lazy } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null;

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Query Provider Component
 * Wraps the application with React Query context
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Show devtools only in development */}
      {import.meta.env.DEV && ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
            position="bottom"
          />
        </Suspense>
      )}
    </QueryClientProvider>
  );
};
