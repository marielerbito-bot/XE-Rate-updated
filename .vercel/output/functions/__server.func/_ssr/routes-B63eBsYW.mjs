import { i as __toESM } from "../_runtime.mjs";
import { i as require_react, r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as RefreshCw, r as ArrowLeftRight } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-B63eBsYW.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var getXeRates = createServerFn({ method: "GET" }).handler(createSsrRpc("4cf4f6545d62bb7ac0efa26dc1bb10eab5b4fdfc387729ccfedeab9a85174980"));
var NAMES = {
	AUD: "Australian dollar",
	SGD: "Singapore dollar",
	CHF: "Swiss franc",
	EUR: "Euro",
	HKD: "Hong Kong dollar"
};
function formatRate(n) {
	if (n >= 1) return n.toFixed(4);
	if (n >= .1) return n.toFixed(5);
	return n.toFixed(6);
}
function Home() {
	const query = useQuery({
		queryKey: ["xe-rates"],
		queryFn: () => getXeRates(),
		refetchInterval: 6e4
	});
	const quotes = query.data?.quotes ?? [];
	const [base, setBase] = (0, import_react.useState)("EUR");
	const [amount, setAmount] = (0, import_react.useState)("1000");
	const [history, setHistory] = (0, import_react.useState)({});
	(0, import_react.useEffect)(() => {
		if (!quotes.length) return;
		setHistory((prev) => {
			const next = { ...prev };
			for (const q of quotes) {
				const series = next[q.base] ? [...next[q.base]] : [];
				if (series[series.length - 1] !== q.rate) series.push(q.rate);
				next[q.base] = series.slice(-16);
			}
			return next;
		});
	}, [quotes]);
	const selected = quotes.find((q) => q.base === base);
	const usd = (0, import_react.useMemo)(() => {
		const n = Number(amount.replace(/,/g, ""));
		if (!selected || !Number.isFinite(n)) return null;
		return n * selected.rate;
	}, [amount, selected]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6 sm:py-12",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium tracking-wide text-primary",
						children: "XE.com mid-market"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 font-display text-4xl leading-none text-fg sm:text-5xl",
						children: "Rate desk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 max-w-md text-sm leading-relaxed text-muted",
						children: "Live quotes for AUD, SGD, CHF, EUR and HKD against the US dollar, read from XE."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: query.data ? `Updated ${new Date(query.data.fetchedAt).toLocaleTimeString()}` : query.isLoading ? "Fetching XE…" : "Waiting"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => query.refetch(),
						disabled: query.isFetching,
						className: "inline-flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-fg disabled:opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `size-4 ${query.isFetching ? "animate-spin" : ""}` }), "Refresh"]
					})]
				})]
			}),
			query.isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-6 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-down",
				children: "Could not read XE right now. Try refresh."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-5",
				children: quotes.length === 0 && query.isLoading ? [
					"AUD",
					"SGD",
					"CHF",
					"EUR",
					"HKD"
				].map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36 rounded-2xl border border-border bg-surface" }, code)) : quotes.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RateCard, {
					quote: q,
					series: history[q.base] ?? [q.rate],
					active: q.base === base,
					onSelect: () => setBase(q.base)
				}, q.base))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-4 flex items-center gap-2 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { className: "size-4 text-primary" }), "Convert into USD"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: "Amount"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-1 flex h-12 items-center rounded-xl border border-border bg-surface-2 px-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										inputMode: "decimal",
										value: amount,
										onChange: (e) => setAmount(e.target.value),
										className: "w-full bg-transparent text-lg font-semibold outline-none",
										"aria-label": "Amount"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: base,
										onChange: (e) => setBase(e.target.value),
										className: "bg-transparent text-sm font-medium text-fg outline-none",
										"aria-label": "Currency",
										children: Object.keys(NAMES).map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: code,
											className: "bg-surface",
											children: code
										}, code))
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden pb-3 text-muted sm:block",
								children: "="
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted",
								children: "US dollars"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 flex h-12 items-center font-display text-3xl text-fg",
								children: usd == null ? "—" : usd.toLocaleString(void 0, {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2
								})
							})] })
						]
					}),
					selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-4 text-xs text-muted",
						children: [
							"1 ",
							selected.base,
							" = ",
							formatRate(selected.rate),
							" USD",
							selected.asOf ? ` · mid-market at ${selected.asOf}` : "",
							" · ",
							"1 USD = ",
							formatRate(1 / selected.rate),
							" ",
							selected.base
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
				className: "mt-8 text-xs leading-relaxed text-muted",
				children: "Source: XE.com public converter pages. Mid-market is the midpoint between buy and sell in the wholesale market and is not the rate you receive on a transfer. Auto-refreshes every minute."
			})
		]
	});
}
function RateCard({ quote, series, active, onSelect }) {
	const first = series[0] ?? quote.rate;
	const delta = quote.rate - first;
	const up = delta >= 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: onSelect,
		className: `rounded-2xl border bg-surface p-4 text-left transition-colors ${active ? "border-primary" : "border-border hover:border-muted"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm font-semibold",
					children: [quote.base, "/USD"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `text-xs ${up ? "text-primary" : "text-down"}`,
					children: series.length > 1 ? `${up ? "+" : ""}${delta.toFixed(5)}` : "live"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 font-display text-3xl leading-none",
				children: formatRate(quote.rate)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 truncate text-xs text-muted",
				children: NAMES[quote.base]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spark, {
				series,
				up
			})
		]
	});
}
function Spark({ series, up }) {
	const w = 120;
	const h = 28;
	const min = Math.min(...series);
	const span = Math.max(...series) - min || 1;
	const pts = series.map((v, i) => {
		return `${series.length === 1 ? w : i / (series.length - 1) * w},${h - (v - min) / span * 24 - 2}`;
	}).join(" ");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: "mt-3 h-7 w-full",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
			fill: "none",
			stroke: up ? "var(--color-primary)" : "var(--color-down)",
			strokeWidth: "2",
			points: pts
		})
	});
}
//#endregion
export { Home as component };
