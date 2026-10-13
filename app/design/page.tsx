import { connection } from "next/server";

import { DesignCardPreview } from "@/components/design-card-preview";
import { getPredictionResponse } from "@/lib/predictions";

export default async function DesignPage() {
  await connection();
  const response = await getPredictionResponse();
  const [featuredMatch] = response.matches;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-[32px] border border-border bg-surface px-6 py-8 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted">
            Design System
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-foreground">
            Tokens and primitives for the football analytics board
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-soft">
            This route isolates the core semantic tokens, surface treatments, badges, and the
            main match card primitive used across the dashboard.
          </p>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Background", className: "bg-background" },
            { label: "Surface", className: "bg-surface" },
            { label: "Panel", className: "bg-panel" },
            { label: "Accent", className: "bg-accent" },
          ].map((swatch) => (
            <article
              key={swatch.label}
              className="rounded-[28px] border border-border bg-surface p-5 shadow-card"
            >
              <div className={`h-28 rounded-2xl border border-border ${swatch.className}`} />
              <p className="mt-4 text-lg font-semibold text-foreground">{swatch.label}</p>
            </article>
          ))}
        </section>

        <section className="mt-6">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">Primary match card</h2>
          {featuredMatch ? (
            <DesignCardPreview match={featuredMatch} />
          ) : (
            <div className="rounded-[28px] border border-dashed border-border bg-surface p-6 text-soft">
              Live fixture data is temporarily unavailable. The preview route stays online and will
              render again as soon as the upstream feed recovers.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
