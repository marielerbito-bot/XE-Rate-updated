import { createServerFn } from "@tanstack/react-start";

const PAIRS = ["AUD", "SGD", "CHF", "EUR", "HKD"] as const;
const XE_AUTH = "Basic bG9kZXN0YXI6cHVnc25heA==";

export type Quote = {
  base: (typeof PAIRS)[number];
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

async function chartClose(base: (typeof PAIRS)[number], midnight: number): Promise<number> {
  const res = await fetch(
    `https://www.xe.com/api/protected/charting-rates/?fromCurrency=${base}&toCurrency=USD&crypto=false`,
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
  if (!res.ok) throw new Error(`XE chart ${base} ${res.status}`);
  const data = (await res.json()) as { batchList: Batch[] };
  const pts = decodePoints(data.batchList);
  if (!pts.length) throw new Error(`XE chart ${base} empty`);
  let best = pts[0];
  for (const point of pts) {
    if (Math.abs(point.t - midnight) < Math.abs(best.t - midnight)) best = point;
  }
  if (Math.abs(best.t - midnight) > 60_000) throw new Error(`XE chart ${base} missing 00:00 UTC`);
  return best.rate;
}

async function closesAtMidnight(midnight: number): Promise<Record<string, number>> {
  if (closeCache?.midnight === midnight) return closeCache.rates;
  const rates: Record<string, number> = {};
  await Promise.all(
    PAIRS.map(async (base) => {
      rates[base] = await chartClose(base, midnight);
    }),
  );
  closeCache = { midnight, rates };
  return rates;
}

async function liveUsdPerUnit(): Promise<{ rates: Record<string, number>; asOf: string }> {
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
  for (const base of PAIRS) {
    const perUsd = data.rates[base];
    if (!perUsd) throw new Error(`XE live missing ${base}`);
    rates[base] = 1 / perUsd;
  }
  return { rates, asOf: new Date(data.timestamp).toISOString() };
}

export const getXeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<RatesPayload> => {
    const midnight = utcMidnight();
    const closeAt = new Date(midnight).toISOString();
    const closeDate = new Date(midnight - 86_400_000).toISOString().slice(0, 10);
    const [live, closes] = await Promise.all([liveUsdPerUnit(), closesAtMidnight(midnight)]);
    const quotes = PAIRS.map((base) => {
      const rate = live.rates[base];
      const close = closes[base];
      const change = rate - close;
      return {
        base,
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
      note: "Live mid-market from XE. Previous close is the XE chart print at 00:00 UTC, which is the close of the prior UTC date.",
    };
  },
);
