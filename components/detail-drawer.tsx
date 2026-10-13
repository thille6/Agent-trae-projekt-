'use client';

import { Activity, ShieldCheck, Sparkles, Swords } from "lucide-react";

import type { FormTrend, MatchRecord } from "@/lib/types";

interface DetailDrawerProps {
  match: MatchRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

const formTone: Record<FormTrend, string> = {
  W: "bg-success/15 text-success ring-1 ring-success/30",
  D: "bg-warning/15 text-warning ring-1 ring-warning/30",
  L: "bg-danger/15 text-danger ring-1 ring-danger/30",
};

export function DetailDrawer({ match, isOpen, onClose }: DetailDrawerProps) {
  if (!match) {
    return null;
  }

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <button
        aria-label="Close match details"
        className={`absolute inset-0 bg-overlay transition ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
        type="button"
      />
      <aside
        aria-labelledby="match-detail-title"
        aria-modal="true"
        className={`absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-surface shadow-2xl transition duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
      >
        <div className="sticky top-0 z-10 border-b border-border bg-surface/95 px-6 py-5 backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                {match.league.name} • {match.dateLabel}
              </p>
              <h2 id="match-detail-title" className="mt-2 text-2xl font-semibold text-foreground">
                {match.homeTeam.name} vs {match.awayTeam.name}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {match.venue} • {new Date(match.kickoffUtc).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })}{" "}
                UTC kickoff
              </p>
            </div>
            <button
              className="rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:border-accent hover:text-foreground"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Activity className="h-4 w-4 text-accent" />
                Simulated xG
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{match.homeTeam.name}</span>
                  <strong className="text-foreground">{match.xg.home.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">{match.awayTeam.name}</span>
                  <strong className="text-foreground">{match.xg.away.toFixed(2)}</strong>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                  <span className="text-muted">Total Match xG</span>
                  <strong className="text-foreground">{match.xg.total.toFixed(2)}</strong>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                <ShieldCheck className="h-4 w-4 text-success" />
                Recommendation
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  {match.recommendation.selection}
                </p>
                <p className="text-sm text-muted">
                  {match.recommendation.market} • {match.recommendation.confidence} confidence
                </p>
                <p className="inline-flex rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">
                  {match.recommendation.riskTag} {match.recommendation.rating}%
                </p>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Swords className="h-4 w-4 text-warning" />
                Headline Stats
              </div>
              <div className="mt-4 space-y-3">
                {match.headlineStats.map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-muted">{stat.label}</span>
                    <strong className="text-right text-foreground">{stat.value}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-panel p-5 md:col-span-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Head-to-head
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {match.headToHead.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Table Snapshots
              </h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{match.homeTeam.shortName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Rank #{match.table.home.rank} • {match.table.home.points} pts • GD {match.table.home.goalDifference >= 0 ? "+" : ""}
                    {match.table.home.goalDifference}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-sm font-semibold text-foreground">{match.awayTeam.shortName}</p>
                  <p className="mt-1 text-sm text-muted">
                    Rank #{match.table.away.rank} • {match.table.away.points} pts • GD {match.table.away.goalDifference >= 0 ? "+" : ""}
                    {match.table.away.goalDifference}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-panel p-5">
              <div className="flex items-center gap-2 text-sm text-muted">
                <Sparkles className="h-4 w-4 text-accent" />
                Recent form
              </div>
              <div className="mt-5 grid gap-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{match.homeTeam.name}</span>
                  <div className="flex gap-2">
                    {match.table.home.form.map((result, index) => (
                      <span
                        key={`${match.homeTeam.name}-${index}`}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${formTone[result]}`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">{match.awayTeam.name}</span>
                  <div className="flex gap-2">
                    {match.table.away.form.map((result, index) => (
                      <span
                        key={`${match.awayTeam.name}-${index}`}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${formTone[result]}`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-border bg-panel p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">
                Tactical notes
              </h3>
              <div className="mt-4 space-y-3 text-sm leading-7 text-soft">
                {match.tacticalNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </article>
          </section>
        </div>
      </aside>
    </div>
  );
}
