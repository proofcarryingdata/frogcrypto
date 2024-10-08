import React, { useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import {
  type ErrorBoundaryProps,
  type FallbackProps,
  ErrorBoundary,
  type ErrorBoundaryPropsWithFallback,
  type ErrorBoundaryPropsWithComponent,
} from "react-error-boundary";
import { TRPCClientError } from "@trpc/client";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps): React.ReactElement {
  const onClick = useCallback(() => {
    if (error instanceof Error) {
      if (error instanceof TRPCClientError) {
        if (error.data?.code === "UNAUTHORIZED") {
          localStorage.clear();
        }
      }
    }
    window.location.reload();
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 rounded-lg border border-red-200">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h2 className="text-xl font-bold text-red-700 mb-2">
        Oops! Something went wrong
      </h2>
      <p className="text-red-600 mb-4">
        We&apos;re sorry, but an error occurred while rendering this component.
      </p>
      <p className="text-sm text-red-500 max-w-md">
        Error: {error.message || "Unknown error"}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function CustomErrorBoundary({
  children,
  ...props
}: Omit<
  ErrorBoundaryPropsWithComponent,
  "FallbackComponent"
>): React.ReactElement {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} {...props}>
      {children}
    </ErrorBoundary>
  );
}

export default CustomErrorBoundary;
