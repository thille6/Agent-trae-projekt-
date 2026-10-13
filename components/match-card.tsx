'use client';

import Image from "next/image";
import { ArrowRight, ChevronRight, Clock3, Percent, Shield, TrendingUp } from "lucide-react";

import type { MatchRecord } from "@/lib/types";

interface MatchCardProps {
  match: MatchRecord;
  onOpen: (match: MatchRecord) => void;
}

const toneClasses: Record<MatchRecord["league"]["badgeTone"], string> = {
  blue: "bg-accent/15 text-accent ring-1 ring-accent/25",
  green: "bg-success/15 text-success ring-1 ring-success/25",
  orange: "bg-warning/15 text-warning ring-1 ring-warning/25",
  purple: "bg-secondary/20 text-secondary ring-1 ring-secondary/25",
  red: "bg-danger/15 text-danger ring-1 ring-danger/25",
};

const confidenceClasses: Record<MatchRecord["recommendation"]["confidence"], string> = {
  Low: "bg-warning/15 text-warning ring-1 ring-warning/25",
  Medium: "bg-accent/15 text-accent ring-1 ring-accent/25",
  High: "bg-success/15 text-success ring-1 ring-success/25",
};

function ProbabilityCell({
  label,
  values,
}: {
  label: string;
  values: Array<{ name: string; value: number }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-panel p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
        <Percent className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-4 grid gap-2">
        {values.map((entry) => (
          <div key={entry.name} className="grid grid-cols-[48px_1fr_44px] items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
              {entry.name}
            </span>
            <div className="h-2 rounded-full bg-background">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${entry.value}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-foreground">{entry.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MatchCard({ match, onOpen }: MatchCardProps) {
  return (
    <article className="rounded-[28px] border border-border bg-surface p-5 shadow-card transition hover:border-accent/35 hover:bg-surface-elevated">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[match.league.badgeTone]}`}>
              {match.league.badgeText}
            </span>
            <span className="text-sm text-muted">
              {match.league.name} • {match.league.country}
            </span>
            <span className="inline-flex items-center gap-2 text-sm text-muted">
              <Clock3 className="h-4 w-4" />
              {new Date(match.kickoffUtc).toLocaleString([], {
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                month: "short",
                timeZone: "UTC",
              })}{" "}
              UTC
            </span>
          </div>

          <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="flex items-center gap-3">
                  {/* The feeds already expose remote team badges, so plain img keeps setup keyless. */}
                  <Image
                    alt={`${match.homeTeam.name} badge`}
                    className="h-11 w-11 rounded-full border border-border bg-panel object-contain p-1"
                    height={44}
                    src={match.homeTeam.badgeUrl}
                    unoptimized
                    width={44}
                  />
                  <div>
                    <p className="text-lg font-semibold text-foreground">{match.homeTeam.name}</p>
                    <p className="text-sm text-muted">
                      Home model edge {match.probabilities.home}% • #{match.table.home.rank}
                    </p>
                  </div>
                </div>
                <div className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                  vs
                </div>
                <div className="flex items-center justify-start gap-3 sm:justify-end">
                  <div className="sm:text-right">
                    <p className="text-lg font-semibold text-foreground">{match.awayTeam.name}</p>
                    <p className="text-sm text-muted">
                      Away model edge {match.probabilities.away}% • #{match.table.away.rank}
                    </p>
                  </div>
                  <Image
                    alt={`${match.awayTeam.name} badge`}
                    className="h-11 w-11 rounded-full border border-border bg-panel object-contain p-1"
                    height={44}
                    src={match.awayTeam.badgeUrl}
                    unoptimized
                    width={44}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-border bg-panel px-4 py-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Best pick
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {match.recommendation.selection}
                </p>
                <p className="mt-1 text-xs text-muted">{match.recommendation.market}</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${confidenceClasses[match.recommendation.confidence]}`}>
                <Shield className="h-4 w-4" />
                {match.recommendation.riskTag} {match.recommendation.rating}%
              </div>
            </div>
          </div>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          onClick={() => onOpen(match)}
          type="button"
        >
          Match detail
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <ProbabilityCell
          label="1X2"
          values={[
            { name: "1", value: match.probabilities.home },
            { name: "X", value: match.probabilities.draw },
            { name: "2", value: match.probabilities.away },
          ]}
        />
        <ProbabilityCell
          label="O/U 2.5"
          values={[
            { name: "Over", value: match.probabilities.over25 },
            { name: "Under", value: match.probabilities.under25 },
          ]}
        />
        <ProbabilityCell
          label="BTTS"
          values={[
            { name: "Yes", value: match.probabilities.bttsYes },
            { name: "No", value: match.probabilities.bttsNo },
          ]}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-panel p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Algorithm note
          </p>
          <p className="mt-2 text-sm leading-6 text-soft">{match.recommendation.rationale}</p>
        </div>
        <button
          className="inline-flex items-center gap-2 self-start rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          onClick={() => onOpen(match)}
          type="button"
        >
          View xG breakdown
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
