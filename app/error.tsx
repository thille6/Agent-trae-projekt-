'use client';

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl rounded-[32px] border border-border bg-surface p-8 shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-danger">
          Upstream Sync Error
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">
          The prediction board hit an unexpected runtime error.
        </h1>
        <p className="mt-4 text-base leading-7 text-soft">
          The route-level error boundary is active, so the app stays recoverable even when a fetch
          or render cycle fails unexpectedly.
        </p>
        <button
          className="mt-6 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          onClick={() => retry()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
