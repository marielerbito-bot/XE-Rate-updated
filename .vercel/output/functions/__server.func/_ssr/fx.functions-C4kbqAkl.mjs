import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/fx.functions-C4kbqAkl.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var PAIRS = [
	"AUD",
	"SGD",
	"CHF",
	"EUR",
	"HKD"
];
async function scrapePair(base) {
	const url = `https://www.xe.com/en-us/currencyconverter/convert/?Amount=1&From=${base}&To=USD`;
	const res = await fetch(url, {
		headers: {
			"user-agent": "Mozilla/5.0 (compatible; FXDesk/1.0; +https://www.xe.com/)",
			accept: "text/html"
		},
		signal: AbortSignal.timeout(12e3)
	});
	if (!res.ok) throw new Error(`XE ${base} ${res.status}`);
	const html = await res.text();
	const rateMatch = html.match(/"rate":\s*([0-9]+(?:\.[0-9]+)?)/);
	if (!rateMatch) throw new Error(`XE ${base} rate missing`);
	const timeMatch = html.match(/Mid-market rate at ([^<"\\]+)/i);
	return {
		base,
		rate: Number(rateMatch[1]),
		asOf: timeMatch?.[1]?.trim() ?? null
	};
}
var getXeRates_createServerFn_handler = createServerRpc({
	id: "4cf4f6545d62bb7ac0efa26dc1bb10eab5b4fdfc387729ccfedeab9a85174980",
	name: "getXeRates",
	filename: "src/lib/fx.functions.ts"
}, (opts) => getXeRates.__executeServer(opts));
var getXeRates = createServerFn({ method: "GET" }).handler(getXeRates_createServerFn_handler, async () => {
	return {
		quotes: await Promise.all(PAIRS.map((base) => scrapePair(base))),
		fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
		source: "xe",
		note: "XE mid-market rates are informational, not a transfer quote."
	};
});
//#endregion
export { getXeRates_createServerFn_handler };
