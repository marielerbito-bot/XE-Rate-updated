import { createServerFn } from "@tanstack/react-start";

const PAIRS = [
  { id: "AUDUSD", base: "AUD", quote: "USD" },
  { id: "SGDUSD", base: "SGD", quote: "USD" },
  { id: "CHFUSD", base: "CHF", quote: "USD" },
  { id: "EURUSD", base: "EUR", quote: "USD" },
  { id: "HKDUSD", base: "HKD", quote: "USD" },
  { id: "AUDSGD", base: "AUD", quote: "SGD" },
] as const;

const XE_AUTH = "Basic bG9kZXN0YXI6cHVnc25heA==";

export type PairId = (typeof PAIRS)[number]["id"];

export type Quote = {
  id: PairId;
  base: string;
  quote: string;
  rate: number;
  asOf: string | null;
  close: number;
  closeDate: string;
  closeAt: string;
  change: number;
  changePct: number;
};

export type RatesPayload = {
  quotes: Quote[];
  fetchedAt: string;
  source: "xe";
  note: string;
};

type Batch = { startTime: number; interval: number; rates: number[] };

function utcMidnight(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function decodePoints(batches: Batch[]): { t: number; rate: number }[] {
  const pts: { t: number; rate: number }[] = [];
  for (const batch of batches) {
    const [offset, ...rest] = batch.rates;
    if (offset == null) continue;
    rest.forEach((value, index) => {
      pts.push({
        t: batch.startTime + index * batch.interval,
        rate: Math.round((value - offset) * 1e10) / 1e10,
      });
    });
  }
  return pts;
}

let closeCache: { midnight: number; rates: Record<string, number> } | null = null;

async function chartClose(base: string, quote: string, midnight: number): Promise<number> {
  const res = await fetch(
    `https://www.xe.com/api/protected/charting-rates/?fromCurrency=${base}&toCurrency=${quote}&crypto=false`,
    {
      headers: {
        accept: "application/json",
        authorization: XE_AUTH,
        "user-agent": "Mozilla/5.0 (compatible; FXDesk/1.0; +https://www.xe.com/)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!res.ok) throw new Error(`XE chart ${base}/${quote} ${res.status}`);
  const data = (await res.json()) as { batchList: Batch[] };
  const pts = decodePoints(data.batchList);
  if (!pts.length) throw new Error(`XE chart ${base}/${quote} empty`);
  let best = pts[0];
  for (const point of pts) {
    if (Math.abs(point.t - midnight) < Math.abs(best.t - midnight)) best = point;
  }
  if (Math.abs(best.t - midnight) > 60_000) {
    throw new Error(`XE chart ${base}/${quote} missing 00:00 UTC`);
  }
  return best.rate;
}

async function closesAtMidnight(midnight: number): Promise<Record<string, number>> {
  if (closeCache?.midnight === midnight) return closeCache.rates;
  const rates: Record<string, number> = {};
  await Promise.all(
    PAIRS.map(async (pair) => {
      rates[pair.id] = await chartClose(pair.base, pair.quote, midnight);
    }),
  );
  closeCache = { midnight, rates };
  return rates;
}

async function liveRates(): Promise<{ rates: Record<string, number>; asOf: string }> {
  const res = await fetch(
    "https://www.xe.com/api/protected/midmarket-converter/?from=USD&amount=1",
    {
      headers: {
        accept: "application/json",
        authorization: XE_AUTH,
        "user-agent": "Mozilla/5.0 (compatible; FXDesk/1.0; +https://www.xe.com/)",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!res.ok) throw new Error(`XE live ${res.status}`);
  const data = (await res.json()) as { timestamp: number; rates: Record<string, number> };
  const rates: Record<string, number> = {};
  for (const pair of PAIRS) {
    if (pair.quote !== "USD") continue;
    const perUsd = data.rates[pair.base];
    if (!perUsd) throw new Error(`XE live missing ${pair.base}`);
    rates[pair.id] = 1 / perUsd;
  }
  rates.AUDSGD = rates.AUDUSD / rates.SGDUSD;
  return { rates, asOf: new Date(data.timestamp).toISOString() };
}

export const getXeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<RatesPayload> => {
    const midnight = utcMidnight();
    const closeAt = new Date(midnight).toISOString();
    const closeDate = new Date(midnight - 86_400_000).toISOString().slice(0, 10);
    const [live, closes] = await Promise.all([liveRates(), closesAtMidnight(midnight)]);
    const quotes = PAIRS.map((pair) => {
      const rate = live.rates[pair.id];
      const close = closes[pair.id];
      const change = rate - close;
      return {
        id: pair.id,
        base: pair.base,
        quote: pair.quote,
        rate,
        asOf: live.asOf,
        close,
        closeDate,
        closeAt,
        change,
        changePct: (change / close) * 100,
      };
    });
    return {
      quotes,
      fetchedAt: new Date().toISOString(),
      source: "xe",
      note: "Live mid-market from XE. AUD/SGD is the AUD/USD ÷ SGD/USD cross. Previous close is the XE chart print at 00:00 UTC.",
    };
  },
);
