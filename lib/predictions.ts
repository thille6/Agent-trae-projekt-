import type {
  ConfidenceLevel,
  DateBucket,
  FormTrend,
  MarketType,
  MatchRecord,
  MatchRecommendation,
  MatchTrend,
  PredictionResponse,
  PredictionSort,
  TeamTableSnapshot,
} from "@/lib/types";

interface LeagueConfig {
  id: string;
  name: string;
  country: string;
  badgeText: string;
  badgeTone: "blue" | "green" | "orange" | "purple" | "red";
}

interface SportsDbLeagueResponse {
  leagues?: Array<{
    strCurrentSeason?: string | null;
    strBadge?: string | null;
  }>;
}

interface SportsDbTableResponse {
  table?: Array<{
    idTeam?: string | null;
    strTeam?: string | null;
    strBadge?: string | null;
    intRank?: string | null;
    intPlayed?: string | null;
    intWin?: string | null;
    intDraw?: string | null;
    intLoss?: string | null;
    intGoalsFor?: string | null;
    intGoalsAgainst?: string | null;
    intGoalDifference?: string | null;
    intPoints?: string | null;
    strForm?: string | null;
  }>;
}

type SportsDbStandingRow = NonNullable<SportsDbTableResponse["table"]>[number];
type SportsDbEvent = NonNullable<SportsDbEventsResponse["events"]>[number];

interface SportsDbEventsResponse {
  events?: Array<{
    idEvent?: string | null;
    strTimestamp?: string | null;
    dateEvent?: string | null;
    strTime?: string | null;
    strVenue?: string | null;
    idHomeTeam?: string | null;
    idAwayTeam?: string | null;
    strHomeTeam?: string | null;
    strAwayTeam?: string | null;
    strHomeTeamBadge?: string | null;
    strAwayTeamBadge?: string | null;
    intHomeScore?: string | null;
    intAwayScore?: string | null;
  }>;
}

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
  staleUntil: number;
}

interface CacheResult<T> {
  data: T;
  stale: boolean;
  warning?: string;
}

interface LeaguePredictionChunk {
  matches: MatchRecord[];
  warnings: string[];
  stale: boolean;
}

const LEAGUES: LeagueConfig[] = [
  { id: "4328", name: "Premier League", country: "England", badgeText: "EPL", badgeTone: "blue" },
  { id: "4335", name: "La Liga", country: "Spain", badgeText: "LL", badgeTone: "orange" },
  { id: "4332", name: "Serie A", country: "Italy", badgeText: "SA", badgeTone: "green" },
  { id: "4331", name: "Bundesliga", country: "Germany", badgeText: "BL", badgeTone: "red" },
];

const FETCH_TIMEOUT_MS = 7000;
const CACHE_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_LEAGUE_BADGE = "https://www.thesportsdb.com/images/media/league/badge/default.png";

const globalCache = globalThis as typeof globalThis & {
  __predictionMemoryCache?: Map<string, CacheEntry<unknown>>;
};

const predictionMemoryCache =
  globalCache.__predictionMemoryCache ?? new Map<string, CacheEntry<unknown>>();

globalCache.__predictionMemoryCache = predictionMemoryCache;

function parseInteger(value: string | null | undefined, fallback = 0): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundPercent(value: number): number {
  return Math.round(clamp(value, 0, 1) * 100);
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toDateBucket(dateString: string): DateBucket {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const target = new Date(`${dateString}T00:00:00Z`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays <= -1) {
    return "past";
  }

  if (diffDays === 1) {
    return "tomorrow";
  }

  return "today";
}

function toDateLabel(bucket: DateBucket): string {
  if (bucket === "past") {
    return "Past";
  }

  if (bucket === "tomorrow") {
    return "Tomorrow";
  }

  return "Today";
}

function parseForm(form: string | null | undefined): FormTrend[] {
  return (form ?? "")
    .split("")
    .map((entry) => entry.toUpperCase())
    .filter((entry): entry is FormTrend => entry === "W" || entry === "D" || entry === "L")
    .slice(0, 5);
}

function formScore(form: FormTrend[]): number {
  if (form.length === 0) {
    return 0;
  }

  const total = form.reduce((sum, result) => {
    if (result === "W") {
      return sum + 1;
    }

    if (result === "D") {
      return sum;
    }

    return sum - 1;
  }, 0);

  return total / form.length;
}

function poisson(lambda: number, goals: number): number {
  const boundedLambda = clamp(lambda, 0.05, 6);
  let factorial = 1;

  for (let index = 2; index <= goals; index += 1) {
    factorial *= index;
  }

  return (Math.exp(-boundedLambda) * boundedLambda ** goals) / factorial;
}

function shortenTeamName(name: string): string {
  if (name.length <= 15) {
    return name;
  }

  const [firstWord] = name.split(" ");
  return firstWord || name;
}

async function fetchJsonWithTimeout<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Upstream ${response.status} for ${url}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCachedJson<T>(cacheKey: string, url: string): Promise<CacheResult<T>> {
  const now = Date.now();
  const cachedEntry = predictionMemoryCache.get(cacheKey) as CacheEntry<T> | undefined;

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return { data: cachedEntry.data, stale: false };
  }

  try {
    const data = await fetchJsonWithTimeout<T>(url);
    predictionMemoryCache.set(cacheKey, {
      data,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL_MS,
      staleUntil: now + STALE_TTL_MS,
    });

    return { data, stale: false };
  } catch (error) {
    if (cachedEntry && cachedEntry.staleUntil > now) {
      const warning =
        error instanceof Error ? error.message : `Unknown upstream error for ${cacheKey}`;

      return {
        data: cachedEntry.data,
        stale: true,
        warning: `Using stale cache for ${cacheKey}: ${warning}`,
      };
    }

    throw error;
  }
}

function buildTableSnapshot(
  row: SportsDbStandingRow | undefined,
): TeamTableSnapshot {
  const played = clamp(parseInteger(row?.intPlayed, 1), 1, 100);
  const points = parseInteger(row?.intPoints);
  const goalsFor = parseInteger(row?.intGoalsFor);
  const goalsAgainst = parseInteger(row?.intGoalsAgainst);

  return {
    rank: parseInteger(row?.intRank, 10),
    points,
    played,
    goalsFor,
    goalsAgainst,
    goalDifference: parseInteger(row?.intGoalDifference, goalsFor - goalsAgainst),
    pointsPerGame: Number((points / played).toFixed(2)),
    form: parseForm(row?.strForm),
  };
}

function deriveHeadToHead(
  pastEvents: SportsDbEventsResponse["events"],
  homeTeam: string,
  awayTeam: string,
): MatchTrend[] {
  const matches = (pastEvents ?? [])
    .filter((event) => {
      const participants = [event.strHomeTeam ?? "", event.strAwayTeam ?? ""];
      const sameFixture =
        participants.includes(homeTeam) && participants.includes(awayTeam);

      return (
        sameFixture &&
        event.intHomeScore !== null &&
        event.intAwayScore !== null &&
        event.intHomeScore !== undefined &&
        event.intAwayScore !== undefined
      );
    })
    .slice(0, 3);

  if (matches.length === 0) {
    return [
      { label: "Recent H2H", value: "No recent league meeting cached" },
      { label: "Last Scoreline", value: "Unavailable" },
      { label: "Avg Goals", value: "N/A" },
    ];
  }

  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let goals = 0;

  for (const event of matches) {
    const homeGoals = parseInteger(event.intHomeScore);
    const awayGoals = parseInteger(event.intAwayScore);
    const eventHome = event.strHomeTeam ?? "";
    goals += homeGoals + awayGoals;

    if (homeGoals === awayGoals) {
      draws += 1;
    } else if (
      (eventHome === homeTeam && homeGoals > awayGoals) ||
      (eventHome === awayTeam && awayGoals > homeGoals)
    ) {
      homeWins += 1;
    } else {
      awayWins += 1;
    }
  }

  const lastEvent = matches[0];
  const lastScoreline = `${lastEvent.strHomeTeam} ${parseInteger(lastEvent.intHomeScore)}-${parseInteger(lastEvent.intAwayScore)} ${lastEvent.strAwayTeam}`;

  return [
    {
      label: `Last ${matches.length} H2H`,
      value: `${shortenTeamName(homeTeam)} ${homeWins}W • ${draws}D • ${awayWins}W ${shortenTeamName(awayTeam)}`,
    },
    { label: "Last Scoreline", value: lastScoreline },
    { label: "Avg Goals", value: (goals / matches.length).toFixed(2) },
  ];
}

function buildRecommendation(
  homeTeam: string,
  awayTeam: string,
  probabilities: MatchRecord["probabilities"],
  xg: MatchRecord["xg"],
  homeTable: TeamTableSnapshot,
  awayTable: TeamTableSnapshot,
): MatchRecommendation {
  const candidates: Array<{
    market: MarketType;
    selection: string;
    probability: number;
  }> = [
    { market: "1X2", selection: "Home Win", probability: probabilities.home / 100 },
    { market: "1X2", selection: "Draw", probability: probabilities.draw / 100 - 0.03 },
    { market: "1X2", selection: "Away Win", probability: probabilities.away / 100 },
    {
      market: "Over/Under 2.5",
      selection: "Over 2.5",
      probability: probabilities.over25 / 100,
    },
    {
      market: "Over/Under 2.5",
      selection: "Under 2.5",
      probability: probabilities.under25 / 100,
    },
    { market: "BTTS", selection: "BTTS - Yes", probability: probabilities.bttsYes / 100 },
    { market: "BTTS", selection: "BTTS - No", probability: probabilities.bttsNo / 100 },
  ];

  candidates.sort((left, right) => right.probability - left.probability);

  const winner = candidates[0];
  const rating = roundPercent(winner.probability);
  const confidence: ConfidenceLevel =
    rating >= 76 ? "High" : rating >= 64 ? "Medium" : "Low";
  const riskTag = rating >= 78 ? "Safe" : rating >= 67 ? "Medium Risk" : "Value Bet";
  const leanTeam =
    probabilities.home >= probabilities.away ? homeTeam : awayTeam;
  const rationale = `${leanTeam} carry the stronger points-per-game profile (${homeTable.pointsPerGame.toFixed(2)} vs ${awayTable.pointsPerGame.toFixed(2)}) and the Poisson model projects xG at ${xg.home.toFixed(2)}-${xg.away.toFixed(2)}.`;

  return {
    market: winner.market,
    selection: winner.selection,
    confidence,
    rating,
    riskTag,
    rationale,
  };
}

function buildTacticalNotes(
  homeTeam: string,
  awayTeam: string,
  xg: MatchRecord["xg"],
  homeTable: TeamTableSnapshot,
  awayTable: TeamTableSnapshot,
  recommendation: MatchRecommendation,
): string[] {
  const homeForm = formScore(homeTable.form);
  const awayForm = formScore(awayTable.form);
  const strongerSide = homeForm >= awayForm ? homeTeam : awayTeam;

  return [
    `${strongerSide} bring the sharper recent form edge and shape the first tilt of the model.`,
    `Projected chance volume lands at ${xg.total.toFixed(2)} total xG with a ${xg.home.toFixed(2)}-${xg.away.toFixed(2)} split.`,
    `${recommendation.selection} grades as a ${recommendation.riskTag.toLowerCase()} because the confidence band sits at ${recommendation.rating}%.`,
  ];
}

function buildMatchPrediction(
  event: SportsDbEvent,
  config: LeagueConfig,
  leagueBadgeUrl: string,
  season: string,
  standingsMap: Map<string, SportsDbStandingRow>,
  standingsNameMap: Map<string, SportsDbStandingRow>,
  pastEvents: SportsDbEventsResponse["events"],
  leagueAverageGoals: number,
): MatchRecord | null {
  const homeTeamName = event.strHomeTeam ?? "";
  const awayTeamName = event.strAwayTeam ?? "";
  const homeTeamId = event.idHomeTeam ?? "";
  const awayTeamId = event.idAwayTeam ?? "";

  if (!homeTeamName || !awayTeamName || !event.idEvent || !event.dateEvent) {
    return null;
  }

  const homeRow =
    standingsMap.get(homeTeamId) ?? standingsNameMap.get(normalizeName(homeTeamName));
  const awayRow =
    standingsMap.get(awayTeamId) ?? standingsNameMap.get(normalizeName(awayTeamName));

  const homeTable = buildTableSnapshot(homeRow);
  const awayTable = buildTableSnapshot(awayRow);

  const homeGoalsForPerGame = homeTable.goalsFor / homeTable.played;
  const awayGoalsForPerGame = awayTable.goalsFor / awayTable.played;
  const homeGoalsAgainstPerGame = homeTable.goalsAgainst / homeTable.played;
  const awayGoalsAgainstPerGame = awayTable.goalsAgainst / awayTable.played;

  const homeAttackStrength =
    clamp(homeGoalsForPerGame / leagueAverageGoals, 0.6, 1.9) *
    (1 + formScore(homeTable.form) * 0.12);
  const awayAttackStrength =
    clamp(awayGoalsForPerGame / leagueAverageGoals, 0.6, 1.9) *
    (1 + formScore(awayTable.form) * 0.12);
  const homeDefenseStrength = clamp(homeGoalsAgainstPerGame / leagueAverageGoals, 0.65, 1.8);
  const awayDefenseStrength = clamp(awayGoalsAgainstPerGame / leagueAverageGoals, 0.65, 1.8);

  const pointsDelta = homeTable.pointsPerGame - awayTable.pointsPerGame;
  const strengthAdjustment = clamp(1 + pointsDelta * 0.08, 0.82, 1.22);
  const homeAdvantage = 1.13;

  const homeLambda = clamp(
    leagueAverageGoals * homeAdvantage * homeAttackStrength * (1 / awayDefenseStrength) * strengthAdjustment,
    0.35,
    3.4,
  );
  const awayLambda = clamp(
    leagueAverageGoals *
      (1 / homeAdvantage) *
      awayAttackStrength *
      (1 / homeDefenseStrength) *
      (2 - strengthAdjustment),
    0.25,
    3.1,
  );

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let bttsYes = 0;

  for (let homeGoals = 0; homeGoals <= 6; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= 6; awayGoals += 1) {
      const probability = poisson(homeLambda, homeGoals) * poisson(awayLambda, awayGoals);

      if (homeGoals > awayGoals) {
        homeWin += probability;
      } else if (homeGoals === awayGoals) {
        draw += probability;
      } else {
        awayWin += probability;
      }

      if (homeGoals + awayGoals >= 3) {
        over25 += probability;
      }

      if (homeGoals > 0 && awayGoals > 0) {
        bttsYes += probability;
      }
    }
  }

  const probabilities = {
    home: roundPercent(homeWin),
    draw: roundPercent(draw),
    away: roundPercent(awayWin),
    over25: roundPercent(over25),
    under25: roundPercent(1 - over25),
    bttsYes: roundPercent(bttsYes),
    bttsNo: roundPercent(1 - bttsYes),
  };

  const xg = {
    home: Number(homeLambda.toFixed(2)),
    away: Number(awayLambda.toFixed(2)),
    total: Number((homeLambda + awayLambda).toFixed(2)),
  };

  const recommendation = buildRecommendation(
    homeTeamName,
    awayTeamName,
    probabilities,
    xg,
    homeTable,
    awayTable,
  );

  const headlineStats: MatchTrend[] = [
    {
      label: "Table Rank",
      value: `${homeTable.rank} vs ${awayTable.rank}`,
    },
    {
      label: "Points / Match",
      value: `${homeTable.pointsPerGame.toFixed(2)} vs ${awayTable.pointsPerGame.toFixed(2)}`,
    },
    {
      label: "Goal Diff",
      value: `${homeTable.goalDifference >= 0 ? "+" : ""}${homeTable.goalDifference} vs ${awayTable.goalDifference >= 0 ? "+" : ""}${awayTable.goalDifference}`,
    },
  ];

  return {
    id: event.idEvent,
    date: event.dateEvent,
    dateLabel: toDateLabel(toDateBucket(event.dateEvent)),
    dateBucket: toDateBucket(event.dateEvent),
    kickoffUtc: event.strTimestamp ?? `${event.dateEvent}T${event.strTime ?? "00:00:00"}Z`,
    venue: event.strVenue ?? "Venue TBC",
    league: {
      id: config.id,
      name: config.name,
      country: config.country,
      badgeText: config.badgeText,
      badgeTone: config.badgeTone,
      badgeUrl: leagueBadgeUrl || DEFAULT_LEAGUE_BADGE,
      season,
    },
    homeTeam: {
      id: homeTeamId,
      name: homeTeamName,
      shortName: shortenTeamName(homeTeamName),
      badgeUrl: event.strHomeTeamBadge ?? homeRow?.strBadge ?? leagueBadgeUrl ?? DEFAULT_LEAGUE_BADGE,
    },
    awayTeam: {
      id: awayTeamId,
      name: awayTeamName,
      shortName: shortenTeamName(awayTeamName),
      badgeUrl: event.strAwayTeamBadge ?? awayRow?.strBadge ?? leagueBadgeUrl ?? DEFAULT_LEAGUE_BADGE,
    },
    probabilities,
    xg,
    table: {
      home: homeTable,
      away: awayTable,
    },
    headToHead: deriveHeadToHead(pastEvents, homeTeamName, awayTeamName),
    headlineStats,
    tacticalNotes: buildTacticalNotes(
      homeTeamName,
      awayTeamName,
      xg,
      homeTable,
      awayTable,
      recommendation,
    ),
    recommendation,
  };
}

async function loadLeaguePredictions(config: LeagueConfig): Promise<LeaguePredictionChunk> {
  const warnings: string[] = [];
  let stale = false;

  try {
    const leagueResponse = await fetchCachedJson<SportsDbLeagueResponse>(
      `league:${config.id}`,
      `https://www.thesportsdb.com/api/v1/json/3/lookupleague.php?id=${config.id}`,
    );
    const season = leagueResponse.data.leagues?.[0]?.strCurrentSeason ?? "Current";
    const leagueBadgeUrl = leagueResponse.data.leagues?.[0]?.strBadge ?? DEFAULT_LEAGUE_BADGE;
    stale = stale || leagueResponse.stale;
    if (leagueResponse.warning) {
      warnings.push(leagueResponse.warning);
    }

    const [tableResponse, eventsResponse, pastResponse] = await Promise.all([
      fetchCachedJson<SportsDbTableResponse>(
        `table:${config.id}:${season}`,
        `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=${config.id}&s=${encodeURIComponent(season)}`,
      ),
      fetchCachedJson<SportsDbEventsResponse>(
        `next:${config.id}`,
        `https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${config.id}`,
      ),
      fetchCachedJson<SportsDbEventsResponse>(
        `past:${config.id}`,
        `https://www.thesportsdb.com/api/v1/json/3/eventspastleague.php?id=${config.id}`,
      ),
    ]);

    stale = stale || tableResponse.stale || eventsResponse.stale || pastResponse.stale;
    if (tableResponse.warning) {
      warnings.push(tableResponse.warning);
    }
    if (eventsResponse.warning) {
      warnings.push(eventsResponse.warning);
    }
    if (pastResponse.warning) {
      warnings.push(pastResponse.warning);
    }

    const standingsRows = tableResponse.data.table ?? [];
    const upcomingEvents = eventsResponse.data.events ?? [];
    const pastEvents = pastResponse.data.events ?? [];

    if (upcomingEvents.length === 0) {
      warnings.push(`No upcoming fixtures returned for ${config.name}.`);
      return { matches: [], warnings, stale };
    }

    const standingsMap = new Map<string, SportsDbStandingRow>();
    const standingsNameMap = new Map<string, SportsDbStandingRow>();

    for (const row of standingsRows) {
      if (row.idTeam) {
        standingsMap.set(row.idTeam, row);
      }

      if (row.strTeam) {
        standingsNameMap.set(normalizeName(row.strTeam), row);
      }
    }

    const totalGoalsFor = standingsRows.reduce(
      (sum, row) => sum + parseInteger(row.intGoalsFor),
      0,
    );
    const totalPlayed = standingsRows.reduce((sum, row) => sum + parseInteger(row.intPlayed), 0);
    const leagueAverageGoals =
      totalPlayed > 0 ? clamp(totalGoalsFor / totalPlayed, 0.9, 1.9) : 1.35;

    const matches = upcomingEvents
      .slice(0, 10)
      .map((event) =>
        buildMatchPrediction(
          event,
          config,
          leagueBadgeUrl,
          season,
          standingsMap,
          standingsNameMap,
          pastEvents,
          leagueAverageGoals,
        ),
      )
      .filter((match): match is MatchRecord => match !== null);

    return { matches, warnings, stale };
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unknown error for ${config.name}`;

    return {
      matches: [],
      warnings: [`Failed to sync ${config.name}: ${message}`],
      stale,
    };
  }
}

export function getConfidenceScore(level: ConfidenceLevel): number {
  if (level === "High") {
    return 3;
  }

  if (level === "Medium") {
    return 2;
  }

  return 1;
}

export function sortMatches(data: MatchRecord[], sort: PredictionSort): MatchRecord[] {
  const nextData = [...data];

  if (sort === "kickoff") {
    return nextData.sort(
      (left, right) =>
        new Date(left.kickoffUtc).getTime() - new Date(right.kickoffUtc).getTime(),
    );
  }

  return nextData.sort((left, right) => {
    if (right.recommendation.rating !== left.recommendation.rating) {
      return right.recommendation.rating - left.recommendation.rating;
    }

    if (getConfidenceScore(right.recommendation.confidence) !== getConfidenceScore(left.recommendation.confidence)) {
      return (
        getConfidenceScore(right.recommendation.confidence) -
        getConfidenceScore(left.recommendation.confidence)
      );
    }

    return new Date(left.kickoffUtc).getTime() - new Date(right.kickoffUtc).getTime();
  });
}

export function getUniqueLeagues(data: MatchRecord[]): string[] {
  return Array.from(new Set(data.map((match) => match.league.name))).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function getTopRecommendation(
  data: MatchRecord[],
  sort: PredictionSort,
): MatchRecommendation | null {
  const [topMatch] = sortMatches(data, sort);
  return topMatch ? topMatch.recommendation : null;
}

export function getAverageProbability(
  data: MatchRecord[],
  selector: (match: MatchRecord) => number,
): number {
  if (data.length === 0) {
    return 0;
  }

  const total = data.reduce((sum, match) => sum + selector(match), 0);
  return Math.round(total / data.length);
}

export async function getPredictionResponse(): Promise<PredictionResponse> {
  const leagueChunks = await Promise.all(LEAGUES.map((league) => loadLeaguePredictions(league)));
  const matches = leagueChunks.flatMap((chunk) => chunk.matches);
  const warnings = leagueChunks.flatMap((chunk) => chunk.warnings);
  const stale = leagueChunks.some((chunk) => chunk.stale);
  const partial = leagueChunks.some((chunk) => chunk.matches.length === 0);

  return {
    matches: sortMatches(matches, "confidence"),
    generatedAt: new Date().toISOString(),
    stale,
    partial,
    warnings,
  };
}
