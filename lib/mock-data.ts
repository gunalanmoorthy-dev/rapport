export type Sentiment = "green" | "amber" | "red";

export type PortfolioMove = {
  id: string;
  date: string;
  action: string;
  instrument: string;
  amount: string;
  direction: "buy" | "sell" | "rebalance";
};

export type EchoEntry = {
  id: string;
  date: string;
  duration: string;
  summary: string;
  committed: number;
  flagged: number;
};

export type Client = {
  id: string;
  name: string;
  household: string;
  balance: number;
  sentiment: Sentiment;
  sentimentNote: string;
  advisor: string;
  lastContact: string;
  riskProfile: string;
  moves: PortfolioMove[];
  echoHistory: EchoEntry[];
};

export const sentimentMeta: Record<
  Sentiment,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  green: {
    label: "Green",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/20",
  },
  amber: {
    label: "Amber",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  red: {
    label: "Red",
    dot: "bg-red-400",
    text: "text-red-300",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
  },
};

export function formatBalance(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export const clients: Client[] = [
  {
    id: "harrington",
    name: "Eleanor Harrington",
    household: "Harrington Family Trust",
    balance: 14820000,
    sentiment: "green",
    sentimentNote: "Highly engaged, referred two prospects last quarter.",
    advisor: "You",
    lastContact: "2 days ago",
    riskProfile: "Growth · Moderate",
    moves: [
      { id: "m1", date: "Jun 18", action: "Trimmed", instrument: "NVDA", amount: "$420,000", direction: "sell" },
      { id: "m2", date: "Jun 18", action: "Added", instrument: "Treasury Ladder", amount: "$600,000", direction: "buy" },
      { id: "m3", date: "Jun 02", action: "Rebalanced", instrument: "Global Equity Sleeve", amount: "$1,200,000", direction: "rebalance" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 18 · 9:42 AM", duration: "0:54", summary: "Eleanor wants to de-risk ahead of the property purchase in Q3. Move proceeds to short-duration treasuries.", committed: 4, flagged: 1 },
      { id: "e2", date: "Jun 02 · 4:11 PM", duration: "1:02", summary: "Quarterly review. She's comfortable with current allocation, asked about ESG screening for the next tranche.", committed: 6, flagged: 0 },
    ],
  },
  {
    id: "okafor",
    name: "Marcus Okafor",
    household: "Okafor Holdings LLC",
    balance: 8430000,
    sentiment: "amber",
    sentimentNote: "Two missed review calls. Concerned about tech exposure.",
    advisor: "You",
    lastContact: "3 weeks ago",
    riskProfile: "Aggressive Growth",
    moves: [
      { id: "m1", date: "Jun 15", action: "Sold", instrument: "Concentrated TSLA", amount: "$910,000", direction: "sell" },
      { id: "m2", date: "May 28", action: "Added", instrument: "Private Credit Fund III", amount: "$500,000", direction: "buy" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 15 · 11:20 AM", duration: "0:48", summary: "Marcus is nervous about single-stock concentration. Diversify out of TSLA over two tranches.", committed: 3, flagged: 2 },
    ],
  },
  {
    id: "delacroix",
    name: "Sophie Delacroix",
    household: "Delacroix Private",
    balance: 22150000,
    sentiment: "green",
    sentimentNote: "Long-tenured, expanding mandate to include daughter's accounts.",
    advisor: "You",
    lastContact: "5 days ago",
    riskProfile: "Balanced · Income",
    moves: [
      { id: "m1", date: "Jun 12", action: "Added", instrument: "Muni Bond Sleeve", amount: "$2,000,000", direction: "buy" },
      { id: "m2", date: "Jun 12", action: "Opened", instrument: "529 Plan — Camille", amount: "$340,000", direction: "buy" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 12 · 2:05 PM", duration: "1:11", summary: "Sophie wants to set up education funding for her daughter and increase tax-exempt income.", committed: 5, flagged: 0 },
    ],
  },
  {
    id: "venkataraman",
    name: "Priya Venkataraman",
    household: "Venkataraman Family Office",
    balance: 41300000,
    sentiment: "green",
    sentimentNote: "Anchor relationship. Reviewing alternatives allocation.",
    advisor: "You",
    lastContact: "Yesterday",
    riskProfile: "Endowment Style",
    moves: [
      { id: "m1", date: "Jun 19", action: "Committed", instrument: "Real Assets Fund II", amount: "$3,500,000", direction: "buy" },
      { id: "m2", date: "Jun 09", action: "Rebalanced", instrument: "Hedge Sleeve", amount: "$1,800,000", direction: "rebalance" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 19 · 8:30 AM", duration: "0:59", summary: "Priya approved the Real Assets Fund II commitment. Wants quarterly liquidity reporting going forward.", committed: 7, flagged: 1 },
    ],
  },
  {
    id: "whitlock",
    name: "James Whitlock",
    household: "Whitlock Retirement",
    balance: 3120000,
    sentiment: "red",
    sentimentNote: "Expressed dissatisfaction with returns. Retention risk.",
    advisor: "You",
    lastContact: "6 weeks ago",
    riskProfile: "Conservative",
    moves: [
      { id: "m1", date: "May 30", action: "Raised cash", instrument: "Equity Sleeve", amount: "$250,000", direction: "sell" },
    ],
    echoHistory: [
      { id: "e1", date: "May 30 · 3:48 PM", duration: "0:41", summary: "James unhappy with YTD performance vs. benchmark. Schedule an in-person review and prepare attribution.", committed: 2, flagged: 3 },
    ],
  },
  {
    id: "nakamura",
    name: "Yuki Nakamura",
    household: "Nakamura Trust",
    balance: 9870000,
    sentiment: "amber",
    sentimentNote: "Awaiting decision on liquidity event proceeds.",
    advisor: "You",
    lastContact: "12 days ago",
    riskProfile: "Growth",
    moves: [
      { id: "m1", date: "Jun 07", action: "Parked", instrument: "Money Market", amount: "$1,500,000", direction: "buy" },
    ],
    echoHistory: [
      { id: "e1", date: "Jun 07 · 10:02 AM", duration: "0:52", summary: "Yuki's business sale closed. Hold proceeds in money market until allocation plan is approved next week.", committed: 3, flagged: 1 },
    ],
  },
];

export function getClient(id: string) {
  return clients.find((c) => c.id === id);
}

export type StagedChange = {
  id: string;
  clientId: string;
  clientName: string;
  field: string;
  category: "CRM" | "Portfolio" | "Compliance";
  confidence: number;
  source: string;
  before: string;
  after: string;
};

export const stagedChanges: StagedChange[] = [
  {
    id: "s1",
    clientId: "okafor",
    clientName: "Marcus Okafor",
    field: "Risk profile",
    category: "CRM",
    confidence: 0.62,
    source: "Echo · Jun 15, 0:48",
    before: "Aggressive Growth",
    after: "Growth · Moderate",
  },
  {
    id: "s2",
    clientId: "harrington",
    clientName: "Eleanor Harrington",
    field: "Liquidity need",
    category: "Compliance",
    confidence: 0.58,
    source: "Echo · Jun 18, 0:54",
    before: "None on file",
    after: "$600,000 property purchase — Q3 2025",
  },
  {
    id: "s3",
    clientId: "whitlock",
    clientName: "James Whitlock",
    field: "Sentiment tag",
    category: "CRM",
    confidence: 0.71,
    source: "Echo · May 30, 0:41",
    before: "Amber",
    after: "Red — retention risk flagged",
  },
  {
    id: "s4",
    clientId: "nakamura",
    clientName: "Yuki Nakamura",
    field: "Cash allocation",
    category: "Portfolio",
    confidence: 0.49,
    source: "Echo · Jun 07, 0:52",
    before: "$0 money market",
    after: "$1,500,000 money market (temporary)",
  },
  {
    id: "s5",
    clientId: "venkataraman",
    clientName: "Priya Venkataraman",
    field: "Reporting cadence",
    category: "Compliance",
    confidence: 0.66,
    source: "Echo · Jun 19, 0:59",
    before: "Annual",
    after: "Quarterly liquidity reporting",
  },
];

export const liveTranscript: string[] = [
  "Okay, just got out of the call with Eleanor Harrington.",
  "She wants to de-risk ahead of the property purchase in Q3 — roughly six hundred thousand.",
  "Move the proceeds from trimming the NVDA position into a short-duration treasury ladder.",
  "She also asked about ESG screening for the next tranche, flag that for follow-up.",
  "Schedule the next review for early September, in person at her office.",
];
