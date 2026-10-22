import { createServerFn } from "@tanstack/react-start";

const PAIRS = ["AUD", "SGD", "CHF", "EUR", "HKD"] as const;

export type Quote = {
  base: (typeof PAIRS)[number];
  rate: number;
  asOf: string | null;
  close: number;
  closeDate: string;
  change: number;
  changePct: number;
};

export type RatesPayload = {
  quotes: Quote[];
  fetchedAt: string;
  source: "xe";
  note: string;
};

function utcYesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function xeHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; FXDesk/1.0; +https://www.xe.com/)",
      accept: "text/html",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`XE ${res.status}`);
  return res.text();
}

async function liveUsdPerUnit(): Promise<{ rates: Record<string, number>; asOf: string }> {
  const res = await fetch(
    "https://www.xe.com/api/protected/midmarket-converter/?from=USD&amount=1",
    {
      headers: {
        accept: "application/json",
        authorization: "Basic bG9kZXN0YXI6cHVnc25heA==",
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

async function scrapeClose(base: (typeof PAIRS)[number], closeDate: string): Promise<number> {
  const html = await xeHtml(
    `https://www.xe.com/en-us/currencytables/?from=${base}&date=${closeDate}`,
  );
  const closeMatch = html.match(
    />USD<\/a><\/th><td>US Dollar<\/td><td>([0-9]+(?:\.[0-9]+)?)<\/td>/,
  );
  if (!closeMatch) throw new Error(`XE ${base} close missing`);
  return Number(closeMatch[1]);
}

export const getXeRates = createServerFn({ method: "GET" }).handler(
  async (): Promise<RatesPayload> => {
    const closeDate = utcYesterday();
    const [live, closes] = await Promise.all([
      liveUsdPerUnit(),
      Promise.all(PAIRS.map((base) => scrapeClose(base, closeDate))),
    ]);
    const quotes = PAIRS.map((base, i) => {
      const rate = live.rates[base];
      const close = closes[i];
      const change = rate - close;
      return {
        base,
        rate,
        asOf: live.asOf,
        close,
        closeDate,
        change,
        changePct: (change / close) * 100,
      };
    });
    return {
      quotes,
      fetchedAt: new Date().toISOString(),
      source: "xe",
      note: "Live mid-market from XE (about a 1 minute cache). Previous close is XE’s published table for the prior UTC date.",
    };
  },
);
