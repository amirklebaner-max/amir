const express = require("express");
const path    = require("path");
const app     = express();
const PORT    = process.env.PORT || 3000;
const FH_KEY  = process.env.FINNHUB_KEY || "";

// Support Node < 18 (no built-in fetch)
if (!globalThis.fetch) {
  try { globalThis.fetch = require("node-fetch"); } catch(_) {}
}

app.use(express.json());
app.use((req, res, next) => { res.header("Access-Control-Allow-Origin", "*"); next(); });

// ── Finnhub fetch helper ──────────────────────────────────────────────
async function fh(endpoint) {
  if (!FH_KEY) throw new Error("FINNHUB_KEY environment variable not set");
  const sep = endpoint.includes("?") ? "&" : "?";
  const url = `https://finnhub.io/api/v1${endpoint}${sep}token=${FH_KEY}`;
  const res = await fetch(url, { headers: { "User-Agent": "portfolio-dashboard/1.0" } });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status} for ${endpoint}`);
  return res.json();
}

// ── RSI (14-period Wilder smoothing) ─────────────────────────────────
function calcRSI(closes, period = 14) {
  const c = closes.filter(v => v != null);
  if (c.length < period + 1) return null;
  let ag = 0, al = 0;
  for (let i = 1; i <= period; i++) {
    const d = c[i] - c[i - 1];
    if (d >= 0) ag += d; else al -= d;
  }
  ag /= period; al /= period;
  for (let i = period + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    ag = (ag * (period - 1) + Math.max(d, 0)) / period;
    al = (al * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (al === 0) return 100;
  return Math.round(100 - 100 / (1 + ag / al));
}

// ── EMA helper ────────────────────────────────────────────────────────
function calcEMA(data, period) {
  const d = data.filter(v => v != null);
  if (d.length < period) return null;
  const k = 2 / (period + 1);
  let ema = d.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < d.length; i++) ema = d[i] * k + ema * (1 - k);
  return ema;
}

// ── /api/health ───────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  if (!FH_KEY) return res.json({ ok: false, reason: "FINNHUB_KEY not set in Railway Variables" });
  try {
    const q = await fh("/quote?symbol=MSFT");
    res.json({ ok: true, msftPrice: q.c, ts: new Date().toISOString() });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ── /api/quote/:symbol ────────────────────────────────────────────────
app.get("/api/quote/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const now         = Math.floor(Date.now() / 1000);
    const oneYearAgo  = now - 365 * 24 * 3600;

    const [quoteRes, candleRes] = await Promise.allSettled([
      fh(`/quote?symbol=${sym}`),
      fh(`/stock/candle?symbol=${sym}&resolution=D&from=${oneYearAgo}&to=${now}`)
    ]);

    if (quoteRes.status === "rejected") throw quoteRes.reason;
    const quote   = quoteRes.value;
    const candles = candleRes.status === "fulfilled" ? candleRes.value : {};

    const closes = (candles.c || []).filter(v => v != null);
    const highs  = (candles.h || []).filter(v => v != null);
    const lows   = (candles.l || []).filter(v => v != null);
    const vols   = (candles.v || []).filter(v => v != null);

    const price     = (quote.c && quote.c !== 0) ? quote.c : (closes.at(-1) ?? 0);
    const prevClose = (quote.pc && quote.pc !== 0) ? quote.pc : price;
    const change    = +(price - prevClose).toFixed(2);
    const changePct = quote.dp != null ? +quote.dp.toFixed(2)
                    : (prevClose ? +((change / prevClose) * 100).toFixed(2) : 0);

    const ma50  = closes.length >= 50
      ? +(closes.slice(-50).reduce((a, b) => a + b, 0) / 50).toFixed(2) : null;
    const ma200 = closes.length >= 200
      ? +(closes.slice(-200).reduce((a, b) => a + b, 0) / 200).toFixed(2) : null;
    const rsi   = calcRSI(closes.slice(-30));
    const ema12 = calcEMA(closes.slice(-40), 12);
    const ema26 = calcEMA(closes.slice(-40), 26);
    const macd  = (ema12 != null && ema26 != null) ? +(ema12 - ema26).toFixed(2) : null;

    const high52   = highs.length ? +Math.max(...highs).toFixed(2) : null;
    const low52    = lows.length  ? +Math.min(...lows).toFixed(2)  : null;
    const fromHigh = high52 ? +(((price - high52) / high52) * 100).toFixed(1) : null;
    const avgVol   = vols.length >= 20
      ? Math.round(vols.slice(-20).reduce((a, b) => a + b, 0) / 20) : null;

    res.json({
      symbol: sym,
      price:    +price.toFixed(2),
      change, changePct,
      prevClose: +prevClose.toFixed(2),
      high52, low52, fromHigh,
      volume:    vols.at(-1) ?? null,
      avgVolume: avgVol,
      currency: "USD",
      ma50, ma200, rsi, macd,
      trend:       ma50 && price > ma50 ? "bullish" : "bearish",
      goldenCross: ma50 && ma200 ? ma50 > ma200 : null,
    });
  } catch (e) {
    console.error("[quote]", sym, e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── /api/valuation/:symbol ────────────────────────────────────────────
app.get("/api/valuation/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const data = await fh(`/stock/metric?symbol=${sym}&metric=all`);
    const m    = data.metric || {};

    const fmt = (v, dec = 2) => v != null ? +Number(v).toFixed(dec) : null;
    const pct = (v, dec = 1) => v != null ? +Number(v).toFixed(dec) : null;

    // Market cap from basic financials (in millions)
    const mcapM = m.marketCapitalization;
    const mcapFmt = mcapM
      ? mcapM >= 1e6 ? `$${(mcapM / 1e6).toFixed(2)}T`
      : mcapM >= 1e3 ? `$${(mcapM / 1e3).toFixed(1)}B`
      : `$${mcapM.toFixed(0)}M`
      : null;

    res.json({
      symbol:          sym,
      marketCap:       mcapFmt,
      pe:              fmt(m.peBasicExclExtraTTM),
      forwardPE:       fmt(m.peNormalizedAnnual),
      ps:              fmt(m.psAnnual),
      pb:              fmt(m.pbAnnual),
      evEbitda:        fmt(m["ev/ebitdaAnnual"] ?? m.enterpriseValueEBITDAAnnual),
      evRevenue:       fmt(m["ev/salesAnnual"] ?? m.enterpriseValueSalesAnnual),
      pegRatio:        null,
      eps:             fmt(m.epsBasicExclExtraItemsTTM),
      forwardEps:      null,
      revenueGrowth:   pct(m.revenueGrowthTTMYoy),
      grossMargin:     pct(m.grossMarginTTM),
      operatingMargin: pct(m.operatingMarginTTM),
      netMargin:       pct(m.netProfitMarginTTM),
      roe:             pct(m.roeTTM),
      debtToEquity:    fmt(m.totalDebt_totalEquityAnnual ?? m["totalDebt/totalEquityAnnual"]),
      freeCashflow:    null,
      shortFloat:      pct(m.shortInterestRatio),
      beta:            fmt(m.beta),
      dividendYield:   pct(m.dividendYieldIndicatedAnnual, 2),
    });
  } catch (e) {
    console.error("[valuation]", sym, e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── /api/insider/:symbol ──────────────────────────────────────────────
app.get("/api/insider/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const data = await fh(`/stock/insider-transactions?symbol=${sym}`);
    const txns = (data.data || []).slice(0, 8);
    const result = txns.map(t => ({
      name:   t.name  || "—",
      role:   t.share ? `${t.share.toLocaleString()} shares` : "",
      isBuy:  (t.transactionCode || "").match(/P|A/) != null,
      shares: t.share ?? null,
      value:  t.value != null ? `$${(t.value / 1e6).toFixed(1)}M` : null,
      price:  (t.value && t.share) ? +(t.value / t.share).toFixed(2) : null,
      date:   t.transactionDate
        ? new Date(t.transactionDate).toLocaleDateString("he-IL") : "",
    }));
    res.json(result);
  } catch (e) {
    console.error("[insider]", sym, e.message);
    res.json([]);
  }
});

// ── Serve React build ─────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!FH_KEY) console.warn("⚠️  FINNHUB_KEY not set — /api/* will return errors");
  else console.log("✅ Finnhub key loaded");
});
