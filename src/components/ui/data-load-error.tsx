import { AlertCircle } from "lucide-react";

interface DataLoadErrorProps {
  error: unknown;
  onRetry: () => void | Promise<unknown>;
}

export function DataLoadError({ error, onRetry }: DataLoadErrorProps) {
  if (!error) return null;

  const message =
    error instanceof Error ? error.message : "Unable to load this data. Please try again.";

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <span>{message}</span>
      </div>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="shrink-0 font-semibold underline hover:text-red-950"
      >
        Retry
      </button>
    </div>
  );
}
