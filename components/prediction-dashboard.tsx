'use client';

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  CalendarDays,
  Filter,
  Flame,
  Funnel,
  Gauge,
  ListFilter,
  RefreshCw,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { DetailDrawer } from "@/components/detail-drawer";
import { MatchCard } from "@/components/match-card";
import {
  getAverageProbability,
  getConfidenceScore,
  getTopRecommendation,
  getUniqueLeagues,
  sortMatches,
} from "@/lib/predictions";
import type {
  ConfidenceLevel,
  DateBucket,
  MarketType,
  MatchRecord,
  PredictionSort,
} from "@/lib/types";

interface PredictionDashboardProps {
  generatedAt: string;
  matches: MatchRecord[];
  partial: boolean;
  stale: boolean;
  warnings: string[];
}

const dateOptions: Array<{ label: string; value: DateBucket | "all" }> = [
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "Past", value: "past" },
  { label: "All", value: "all" },
];

const marketOptions: Array<{ label: string; value: MarketType | "all" }> = [
  { label: "All Markets", value: "all" },
  { label: "1X2", value: "1X2" },
  { label: "Over/Under 2.5", value: "Over/Under 2.5" },
  { label: "BTTS", value: "BTTS" },
];

const confidenceOptions: Array<{ label: string; value: ConfidenceLevel | "all" }> = [
  { label: "All confidence", value: "all" },
  { label: "High only", value: "High" },
  { label: "Medium+", value: "Medium" },
  { label: "Low+", value: "Low" },
];

function confidencePasses(
  matchConfidence: ConfidenceLevel,
  activeThreshold: ConfidenceLevel | "all",
): boolean {
  if (activeThreshold === "all") {
    return true;
  }

  return getConfidenceScore(matchConfidence) >= getConfidenceScore(activeThreshold);
}

export function PredictionDashboard({
  generatedAt,
  matches,
  partial,
  stale,
  warnings,
}: PredictionDashboardProps) {
  const router = useRouter();
  const matchListRef = useRef<HTMLElement | null>(null);
  const [activeDate, setActiveDate] = useState<DateBucket | "all">("today");
  const [activeLeague, setActiveLeague] = useState<string>("all");
  const [activeMarket, setActiveMarket] = useState<MarketType | "all">("all");
  const [activeConfidence, setActiveConfidence] = useState<ConfidenceLevel | "all">("Medium");
  const [activeSort, setActiveSort] = useState<PredictionSort>("confidence");
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

  const leagueOptions = useMemo(() => ["all", ...getUniqueLeagues(matches)], [matches]);

  const filteredMatches = useMemo(() => {
    const nextMatches = matches.filter((match) => {
      const datePass = activeDate === "all" || match.dateBucket === activeDate;
      const leaguePass = activeLeague === "all" || match.league.name === activeLeague;
      const marketPass = activeMarket === "all" || match.recommendation.market === activeMarket;
      const confidencePass = confidencePasses(
        match.recommendation.confidence,
        activeConfidence,
      );

      return datePass && leaguePass && marketPass && confidencePass;
    });

    return sortMatches(nextMatches, activeSort);
  }, [activeConfidence, activeDate, activeLeague, activeMarket, activeSort, matches]);

  const topRecommendation = useMemo(
    () => getTopRecommendation(filteredMatches, activeSort),
    [activeSort, filteredMatches],
  );

  const quickStats = useMemo(() => {
    const highConfidenceCount = filteredMatches.filter(
      (match) => match.recommendation.confidence === "High",
    ).length;

    return [
      {
        label: "Matches",
        value: String(filteredMatches.length),
        icon: ListFilter,
      },
      {
        label: "High confidence",
        value: `${highConfidenceCount}`,
        icon: Flame,
      },
      {
        label: "Avg. BTTS",
        value: `${getAverageProbability(filteredMatches, (match) => match.probabilities.bttsYes)}%`,
        icon: Gauge,
      },
      {
        label: "Best edge",
        value: topRecommendation ? `${topRecommendation.selection} ${topRecommendation.rating}%` : "No edge",
        icon: Sparkles,
      },
    ];
  }, [filteredMatches, topRecommendation]);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {(stale || partial || warnings.length > 0) && (
          <section className="mb-6 rounded-[28px] border border-warning/40 bg-warning/10 px-5 py-4 text-sm text-soft">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                <div>
                  <p className="font-semibold text-foreground">
                    {stale
                      ? "Showing cached data while an upstream source cools down."
                      : "One or more upstream feeds returned partial data."}
                  </p>
                  <p className="mt-1 text-soft">
                    Generated {new Date(generatedAt).toLocaleString()}.
                    {warnings.length > 0 ? ` ${warnings[0]}` : ""}
                  </p>
                </div>
              </div>
              <button
                className="inline-flex items-center gap-2 self-start rounded-full border border-warning/40 px-4 py-2 text-sm font-medium text-foreground transition hover:border-warning"
                onClick={() => router.refresh()}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Sync again
              </button>
            </div>
          </section>
        )}

        <section className="rounded-[32px] border border-border bg-surface px-5 py-5 shadow-card sm:px-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-panel px-4 py-2 text-sm text-muted">
                <SearchCheck className="h-4 w-4 text-accent" />
                Real fixtures + live table-driven probability engine
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                AI-style football tips generated from public live fixtures and league tables.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-soft sm:text-base">
                Scan 1X2, Over/Under 2.5, BTTS, risk-tagged recommendations, and computed xG in
                one dark analytics board powered by a cached server-side prediction engine.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
                  onClick={() => {
                    matchListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  type="button"
                >
                  View live matches
                  <ArrowDown className="h-4 w-4" />
                </button>
                <p className="self-center text-sm text-muted">
                  {filteredMatches.length} fixtures available with the current filters
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:min-w-0 xl:flex-1">
              {quickStats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-border bg-panel px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    <stat.icon className="h-4 w-4 text-accent" />
                    {stat.label}
                  </div>
                  <p className="mt-3 text-xl font-semibold text-foreground">{stat.value}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section ref={matchListRef} className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted">Match list</p>
              <h2 className="text-2xl font-semibold text-foreground">
                {filteredMatches.length} fixtures ready for review
              </h2>
            </div>
            <div className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted md:block">
              {activeSort === "confidence" ? "Highest-rated recommendation:" : "Next kickoff leader:"}{" "}
              <span className="font-semibold text-foreground">
                {topRecommendation ? topRecommendation.selection : "No filtered matches"}
              </span>
            </div>
          </div>

          {filteredMatches.length > 0 ? (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} onOpen={setSelectedMatch} />
              ))}
            </div>
          ) : (
            <div className="rounded-[32px] border border-dashed border-border bg-surface px-8 py-12 text-center">
              <p className="text-lg font-semibold text-foreground">No live fixtures match the current filter set.</p>
              <p className="mt-2 text-sm text-soft">
                Broaden the league or confidence threshold, or trigger a fresh sync once upstream feeds update.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[32px] border border-border bg-surface px-5 py-5 shadow-card sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-muted">
                <Filter className="h-4 w-4 text-accent" />
                Filter & sort engine
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-foreground">
                Slice the board by league, market, confidence, and kickoff timing.
              </h2>
            </div>
            <label className="rounded-full border border-border bg-panel px-4 py-2 text-sm text-muted">
              <span className="mr-2">Sort</span>
              <select
                className="bg-transparent text-foreground outline-none"
                onChange={(event) => setActiveSort(event.target.value as PredictionSort)}
                value={activeSort}
              >
                <option value="confidence">Confidence high to low</option>
                <option value="kickoff">Kickoff date</option>
              </select>
            </label>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-panel p-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                <CalendarDays className="h-4 w-4 text-accent" />
                Date
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dateOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                      activeDate === option.value
                        ? "bg-accent text-accent-foreground"
                        : "bg-background text-muted hover:text-foreground"
                    }`}
                    onClick={() => setActiveDate(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="rounded-2xl border border-border bg-panel p-4">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Funnel className="h-4 w-4 text-accent" />
                League
              </span>
              <select
                className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
                onChange={(event) => setActiveLeague(event.target.value)}
                value={activeLeague}
              >
                {leagueOptions.map((league) => (
                  <option key={league} value={league}>
                    {league === "all" ? "All leagues" : league}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-border bg-panel p-4">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Funnel className="h-4 w-4 text-accent" />
                Market
              </span>
              <select
                className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
                onChange={(event) => setActiveMarket(event.target.value as MarketType | "all")}
                value={activeMarket}
              >
                {marketOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-2xl border border-border bg-panel p-4">
              <span className="flex items-center gap-2 text-sm text-muted">
                <Gauge className="h-4 w-4 text-accent" />
                Confidence threshold
              </span>
              <select
                className="mt-4 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent"
                onChange={(event) =>
                  setActiveConfidence(event.target.value as ConfidenceLevel | "all")
                }
                value={activeConfidence}
              >
                {confidenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      <DetailDrawer
        isOpen={selectedMatch !== null}
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </>
  );
}
