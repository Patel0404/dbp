// Deterministic seed fixtures for local dev and tests. Covers NBA and EPL
// events with realistic-looking odds, injuries, and news so the top-picks UI
// has meaningful content without any vendor credentials.

import type {
  Bookmaker,
  Event,
  Injury,
  JurisdictionRule,
  League,
  Market,
  NewsItem,
  OddsMovement,
  OddsSnapshot,
  Player,
  Sport,
  Team,
} from "@dbp/shared";
import { americanToDecimal, americanToImpliedProbability } from "@dbp/shared";
import type { TeamForm } from "@dbp/scoring";

const now = () => new Date("2026-04-19T18:00:00Z"); // deterministic reference
const hoursFromNow = (h: number) => new Date(now().getTime() + h * 3600 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now().getTime() - h * 3600 * 1000).toISOString();

export const sports: Sport[] = [
  { id: "sport-nba", key: "nba", displayName: "NBA", active: true },
  { id: "sport-nfl", key: "nfl", displayName: "NFL", active: true },
  { id: "sport-epl", key: "epl", displayName: "English Premier League", active: true },
  { id: "sport-mlb", key: "mlb", displayName: "MLB", active: true },
];

export const leagues: League[] = [
  { id: "league-nba", sportId: "sport-nba", name: "NBA" },
  { id: "league-epl", sportId: "sport-epl", name: "EPL" },
];

export const teams: Team[] = [
  { id: "team-bos", leagueId: "league-nba", name: "Boston Celtics", shortName: "BOS" },
  { id: "team-lal", leagueId: "league-nba", name: "Los Angeles Lakers", shortName: "LAL" },
  { id: "team-den", leagueId: "league-nba", name: "Denver Nuggets", shortName: "DEN" },
  { id: "team-mia", leagueId: "league-nba", name: "Miami Heat", shortName: "MIA" },
  { id: "team-ars", leagueId: "league-epl", name: "Arsenal", shortName: "ARS" },
  { id: "team-mci", leagueId: "league-epl", name: "Manchester City", shortName: "MCI" },
];

export const players: Player[] = [
  { id: "p-tatum", teamId: "team-bos", name: "Jayson Tatum", position: "F" },
  { id: "p-brown", teamId: "team-bos", name: "Jaylen Brown", position: "G" },
  { id: "p-lebron", teamId: "team-lal", name: "LeBron James", position: "F" },
  { id: "p-davis", teamId: "team-lal", name: "Anthony Davis", position: "F/C" },
  { id: "p-jokic", teamId: "team-den", name: "Nikola Jokic", position: "C" },
  { id: "p-murray", teamId: "team-den", name: "Jamal Murray", position: "G" },
  { id: "p-butler", teamId: "team-mia", name: "Jimmy Butler", position: "F" },
  { id: "p-saka", teamId: "team-ars", name: "Bukayo Saka", position: "F" },
  { id: "p-haaland", teamId: "team-mci", name: "Erling Haaland", position: "F" },
];

export const events: Event[] = [
  {
    id: "evt-bos-lal",
    leagueId: "league-nba",
    homeTeamId: "team-bos",
    awayTeamId: "team-lal",
    startsAt: hoursFromNow(4),
    status: "scheduled",
    venue: "TD Garden",
  },
  {
    id: "evt-den-mia",
    leagueId: "league-nba",
    homeTeamId: "team-den",
    awayTeamId: "team-mia",
    startsAt: hoursFromNow(7),
    status: "scheduled",
    venue: "Ball Arena",
  },
  {
    id: "evt-ars-mci",
    leagueId: "league-epl",
    homeTeamId: "team-ars",
    awayTeamId: "team-mci",
    startsAt: hoursFromNow(26),
    status: "scheduled",
    venue: "Emirates Stadium",
  },
];

export const bookmakers: Bookmaker[] = [
  { id: "bk-dk", key: "draftkings", displayName: "DraftKings", regions: ["us"] },
  { id: "bk-fd", key: "fanduel", displayName: "FanDuel", regions: ["us"] },
  { id: "bk-bf", key: "betfair", displayName: "Betfair Exchange", regions: ["uk", "eu"] },
];

const mkSnapshot = (
  id: string,
  marketId: string,
  bookmakerId: string,
  side: OddsSnapshot["side"],
  american: number,
): OddsSnapshot => ({
  id,
  marketId,
  bookmakerId,
  side,
  americanOdds: american,
  decimalOdds: americanToDecimal(american),
  impliedProbability: americanToImpliedProbability(american),
  capturedAt: hoursAgo(0.25),
});

export const markets: Market[] = [
  { id: "mkt-bos-lal-ml", eventId: "evt-bos-lal", type: "moneyline", lastUpdated: hoursAgo(0.25) },
  { id: "mkt-bos-lal-spread", eventId: "evt-bos-lal", type: "spread", line: -5.5, lastUpdated: hoursAgo(0.25) },
  { id: "mkt-den-mia-ml", eventId: "evt-den-mia", type: "moneyline", lastUpdated: hoursAgo(0.25) },
  { id: "mkt-den-mia-total", eventId: "evt-den-mia", type: "total", line: 215.5, lastUpdated: hoursAgo(0.25) },
  { id: "mkt-ars-mci-ml", eventId: "evt-ars-mci", type: "moneyline", lastUpdated: hoursAgo(0.25) },
];

export const oddsSnapshots: OddsSnapshot[] = [
  // BOS vs LAL moneyline — BOS favourite
  mkSnapshot("o1", "mkt-bos-lal-ml", "bk-dk", "home", -185),
  mkSnapshot("o2", "mkt-bos-lal-ml", "bk-dk", "away", +160),
  mkSnapshot("o3", "mkt-bos-lal-ml", "bk-fd", "home", -180),
  mkSnapshot("o4", "mkt-bos-lal-ml", "bk-fd", "away", +155),
  // BOS vs LAL spread
  mkSnapshot("o5", "mkt-bos-lal-spread", "bk-dk", "home", -110),
  mkSnapshot("o6", "mkt-bos-lal-spread", "bk-dk", "away", -110),
  // DEN vs MIA moneyline — DEN favourite, tighter
  mkSnapshot("o7", "mkt-den-mia-ml", "bk-dk", "home", -135),
  mkSnapshot("o8", "mkt-den-mia-ml", "bk-dk", "away", +115),
  mkSnapshot("o9", "mkt-den-mia-ml", "bk-fd", "home", -130),
  mkSnapshot("o10", "mkt-den-mia-ml", "bk-fd", "away", +112),
  // DEN vs MIA total
  mkSnapshot("o11", "mkt-den-mia-total", "bk-dk", "over", -105),
  mkSnapshot("o12", "mkt-den-mia-total", "bk-dk", "under", -115),
  // ARS vs MCI
  mkSnapshot("o13", "mkt-ars-mci-ml", "bk-bf", "home", +140),
  mkSnapshot("o14", "mkt-ars-mci-ml", "bk-bf", "away", +180),
  mkSnapshot("o15", "mkt-ars-mci-ml", "bk-bf", "draw", +240),
];

export const oddsMovements: OddsMovement[] = [
  {
    marketId: "mkt-bos-lal-ml",
    bookmakerId: "bk-dk",
    side: "home",
    openAmerican: -165,
    currentAmerican: -185,
    deltaAmerican: -20,
    steamScore: 0.7,
    reverseLineMovement: true,
  },
  {
    marketId: "mkt-den-mia-ml",
    bookmakerId: "bk-dk",
    side: "home",
    openAmerican: -140,
    currentAmerican: -135,
    deltaAmerican: 5,
    steamScore: 0.1,
    reverseLineMovement: false,
  },
  {
    marketId: "mkt-ars-mci-ml",
    bookmakerId: "bk-bf",
    side: "home",
    openAmerican: +160,
    currentAmerican: +140,
    deltaAmerican: -20,
    steamScore: 0.55,
    reverseLineMovement: false,
  },
];

export const injuries: Injury[] = [
  {
    id: "inj-1",
    playerId: "p-lebron",
    status: "questionable",
    designation: "ankle",
    reportedAt: hoursAgo(3),
    severity: 0.6,
  },
  {
    id: "inj-2",
    playerId: "p-butler",
    status: "out",
    designation: "knee",
    reportedAt: hoursAgo(2),
    severity: 0.9,
  },
];

export const news: NewsItem[] = [
  {
    id: "news-1",
    headline: "LeBron listed questionable with ankle soreness",
    summary: "Lakers star LeBron James is questionable for tonight's game against Boston with ankle soreness.",
    source: "Shams Charania",
    sourceCredibility: 0.95,
    publishedAt: hoursAgo(3),
    entities: [
      { kind: "player", id: "p-lebron", label: "LeBron James" },
      { kind: "team", id: "team-lal", label: "Los Angeles Lakers" },
      { kind: "event", id: "evt-bos-lal", label: "BOS vs LAL" },
    ],
    sentiment: "negative",
    impact: "negative",
    urgency: 0.7,
    relevance: 0.9,
    confidence: 0.85,
  },
  {
    id: "news-2",
    headline: "Jimmy Butler ruled out with knee injury",
    summary: "The Heat will be without Jimmy Butler tonight in Denver; the team confirmed he will miss at least two games.",
    source: "ESPN",
    sourceCredibility: 0.9,
    publishedAt: hoursAgo(2),
    entities: [
      { kind: "player", id: "p-butler", label: "Jimmy Butler" },
      { kind: "team", id: "team-mia", label: "Miami Heat" },
      { kind: "event", id: "evt-den-mia", label: "DEN vs MIA" },
    ],
    sentiment: "negative",
    impact: "negative",
    urgency: 0.85,
    relevance: 0.95,
    confidence: 0.95,
  },
  {
    id: "news-3",
    headline: "Celtics look strong returning home after road trip",
    summary: "Boston returns to TD Garden with extra rest and full health ahead of the Lakers game.",
    source: "The Athletic",
    sourceCredibility: 0.85,
    publishedAt: hoursAgo(6),
    entities: [
      { kind: "team", id: "team-bos", label: "Boston Celtics" },
      { kind: "event", id: "evt-bos-lal", label: "BOS vs LAL" },
    ],
    sentiment: "positive",
    impact: "positive",
    urgency: 0.3,
    relevance: 0.8,
    confidence: 0.75,
  },
  {
    id: "news-4",
    headline: "Arsenal healthy for top-of-table clash with City",
    summary: "Mikel Arteta confirms a full squad available as Arsenal host Manchester City.",
    source: "BBC Sport",
    sourceCredibility: 0.9,
    publishedAt: hoursAgo(5),
    entities: [
      { kind: "team", id: "team-ars", label: "Arsenal" },
      { kind: "event", id: "evt-ars-mci", label: "ARS vs MCI" },
    ],
    sentiment: "positive",
    impact: "positive",
    urgency: 0.2,
    relevance: 0.75,
    confidence: 0.7,
  },
];

export const teamForms: Record<string, TeamForm> = {
  "team-bos": {
    teamId: "team-bos",
    last10WinPct: 0.8,
    offensiveEfficiency: 0.72,
    defensiveEfficiency: 0.68,
    restDays: 2,
    travelMiles: 0,
    homeWinPct: 0.78,
    awayWinPct: 0.62,
  },
  "team-lal": {
    teamId: "team-lal",
    last10WinPct: 0.5,
    offensiveEfficiency: 0.6,
    defensiveEfficiency: 0.55,
    restDays: 0,
    travelMiles: 2600,
    homeWinPct: 0.6,
    awayWinPct: 0.42,
  },
  "team-den": {
    teamId: "team-den",
    last10WinPct: 0.65,
    offensiveEfficiency: 0.68,
    defensiveEfficiency: 0.6,
    restDays: 1,
    travelMiles: 0,
    homeWinPct: 0.72,
    awayWinPct: 0.5,
  },
  "team-mia": {
    teamId: "team-mia",
    last10WinPct: 0.55,
    offensiveEfficiency: 0.58,
    defensiveEfficiency: 0.65,
    restDays: 1,
    travelMiles: 1800,
    homeWinPct: 0.66,
    awayWinPct: 0.48,
  },
  "team-ars": {
    teamId: "team-ars",
    last10WinPct: 0.7,
    offensiveEfficiency: 0.7,
    defensiveEfficiency: 0.72,
    restDays: 3,
    travelMiles: 0,
    homeWinPct: 0.78,
    awayWinPct: 0.55,
  },
  "team-mci": {
    teamId: "team-mci",
    last10WinPct: 0.75,
    offensiveEfficiency: 0.74,
    defensiveEfficiency: 0.7,
    restDays: 2,
    travelMiles: 200,
    homeWinPct: 0.82,
    awayWinPct: 0.6,
  },
};

export const jurisdictions: JurisdictionRule[] = [
  {
    code: "US-NJ",
    displayName: "New Jersey (United States)",
    allowsAdvisory: true,
    allowsRealMoney: true,
    minAge: 21,
    disclaimers: [
      "Gambling involves risk. Please play responsibly.",
      "If you or someone you know has a gambling problem, help is available.",
    ],
    responsibleGamblingResources: [
      { label: "1-800-GAMBLER", url: "tel:18004262537" },
      { label: "NJ Responsible Gaming", url: "https://www.njgamblinghelp.com/" },
    ],
  },
  {
    code: "US-CA",
    displayName: "California (United States)",
    allowsAdvisory: true,
    allowsRealMoney: false,
    minAge: 21,
    disclaimers: ["Real-money sports betting is not licensed in California."],
    responsibleGamblingResources: [{ label: "1-800-GAMBLER", url: "tel:18004262537" }],
  },
  {
    code: "UK",
    displayName: "United Kingdom",
    allowsAdvisory: true,
    allowsRealMoney: true,
    minAge: 18,
    disclaimers: ["When the fun stops, stop."],
    responsibleGamblingResources: [
      { label: "BeGambleAware", url: "https://www.begambleaware.org/" },
    ],
  },
];
