const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// ── Yahoo Finance via yahoo-finance2 (handles crumb/cookie auth) ──────
const YF = require("yahoo-finance2").default;
const yf = new YF({ suppressNotices: ["yahooSurvey", "ripHistorical"] });

// ── RSI calculation ───────────────────────────────────────────────────
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return Math.round(100 - 100 / (1 + avgGain / avgLoss));
}

// ── EMA helper ────────────────────────────────────────────────────────
function calcEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
  return ema;
}

// ── /api/quote/:symbol ────────────────────────────────────────────────
app.get("/api/quote/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    // Get current quote + 1 year chart data in parallel
    const today = new Date().toISOString().slice(0, 10);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const from = oneYearAgo.toISOString().slice(0, 10);

    const [q, chartData] = await Promise.all([
      yf.quote(sym, {}, { validateResult: false }),
      yf.chart(sym, { period1: from, period2: today, interval: "1d" }, { validateResult: false })
    ]);

    const quotes = chartData.quotes || [];
    const closes = quotes.map(d => d.close).filter(v => v != null);
    const highs  = quotes.map(d => d.high).filter(v => v != null);
    const lows   = quotes.map(d => d.low).filter(v => v != null);
    const vols   = quotes.map(d => d.volume).filter(v => v != null);

    const price     = q.regularMarketPrice ?? closes[closes.length - 1] ?? 0;
    const prevClose = q.regularMarketPreviousClose ?? price;
    const change    = +(price - prevClose).toFixed(2);
    const changePct = +((change / prevClose) * 100).toFixed(2);

    const ma50 = closes.length >= 50
      ? +(closes.slice(-50).reduce((a, b) => a + b, 0) / 50).toFixed(2) : null;
    const ma200 = closes.length >= 200
      ? +(closes.slice(-200).reduce((a, b) => a + b, 0) / 200).toFixed(2) : null;

    const rsi  = calcRSI(closes.slice(-30));
    const macd = closes.length >= 26
      ? +(calcEMA(closes.slice(-40), 12) - calcEMA(closes.slice(-40), 26)).toFixed(2)
      : null;

    const high52   = highs.length ? +Math.max(...highs).toFixed(2) : null;
    const low52    = lows.length  ? +Math.min(...lows).toFixed(2)  : null;
    const fromHigh = high52 ? +(((price - high52) / high52) * 100).toFixed(1) : null;
    const avgVol   = vols.length >= 20
      ? Math.round(vols.slice(-20).reduce((a, b) => a + b, 0) / 20) : null;

    res.json({
      symbol: sym,
      price: +price.toFixed(2),
      change,
      changePct,
      prevClose: +prevClose.toFixed(2),
      high52, low52, fromHigh,
      volume: q.regularMarketVolume ?? vols[vols.length - 1] ?? null,
      avgVolume: avgVol,
      currency: q.currency ?? "USD",
      ma50, ma200, rsi, macd,
      trend: ma50 && price > ma50 ? "bullish" : "bearish",
      goldenCross: ma50 && ma200 ? ma50 > ma200 : null,
    });
  } catch (e) {
    console.error("quote error", sym, e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── /api/valuation/:symbol ────────────────────────────────────────────
app.get("/api/valuation/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const summary = await yf.quoteSummary(sym, {
      modules: ["summaryDetail", "defaultKeyStatistics", "financialData", "price"]
    }, { validateResult: false });

    const sd = summary.summaryDetail        || {};
    const ks = summary.defaultKeyStatistics || {};
    const fd = summary.financialData        || {};
    const pr = summary.price                || {};

    const fmt = (v, dec = 2) => v != null ? +Number(v).toFixed(dec) : null;

    const marketCap = pr.marketCap ?? sd.marketCap ?? null;
    const mcapFmt = marketCap
      ? marketCap >= 1e12
        ? `$${(marketCap / 1e12).toFixed(2)}T`
        : `$${(marketCap / 1e9).toFixed(1)}B`
      : null;

    res.json({
      symbol: sym,
      marketCap: mcapFmt,
      pe:             fmt(sd.trailingPE),
      forwardPE:      fmt(sd.forwardPE),
      ps:             fmt(ks.priceToSalesTrailing12Months),
      pb:             fmt(ks.priceToBook),
      evEbitda:       fmt(ks.enterpriseToEbitda),
      evRevenue:      fmt(ks.enterpriseToRevenue),
      pegRatio:       fmt(ks.pegRatio),
      eps:            fmt(ks.trailingEps),
      forwardEps:     fmt(ks.forwardEps),
      revenueGrowth:  fd.revenueGrowth  != null ? fmt(fd.revenueGrowth  * 100, 1) : null,
      grossMargin:    fd.grossMargins   != null ? fmt(fd.grossMargins   * 100, 1) : null,
      operatingMargin:fd.operatingMargins!=null ? fmt(fd.operatingMargins*100, 1) : null,
      netMargin:      fd.profitMargins  != null ? fmt(fd.profitMargins  * 100, 1) : null,
      roe:            fd.returnOnEquity != null ? fmt(fd.returnOnEquity * 100, 1) : null,
      debtToEquity:   fmt(fd.debtToEquity),
      freeCashflow:   fd.freeCashflow   != null ? `$${(fd.freeCashflow / 1e9).toFixed(1)}B` : null,
      shortFloat:     ks.shortPercentOfFloat != null ? fmt(ks.shortPercentOfFloat * 100, 1) : null,
      beta:           fmt(sd.beta),
      dividendYield:  sd.dividendYield  != null ? fmt(sd.dividendYield * 100, 2) : null,
    });
  } catch (e) {
    console.error("valuation error", sym, e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── /api/insider/:symbol ─────────────────────────────────────────────
app.get("/api/insider/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const summary = await yf.quoteSummary(sym, {
      modules: ["insiderTransactions"]
    }, { validateResult: false });

    const txns = summary.insiderTransactions?.transactions || [];
    const result = txns.slice(0, 8).map(t => ({
      name:  t.filerName     || "—",
      role:  t.filerRelation || "",
      isBuy: (t.transactionText || "").toLowerCase().includes("purchase") ||
             (t.transactionText || "").toLowerCase().includes("acquisition"),
      shares: t.shares ?? null,
      value:  t.value != null ? `$${(t.value / 1e6).toFixed(1)}M` : null,
      price:  t.value && t.shares ? +(t.value / t.shares).toFixed(2) : null,
      date:   t.startDate ? new Date(t.startDate).toLocaleDateString("he-IL") : "",
    }));
    res.json(result);
  } catch (e) {
    res.json([]);
  }
});

// ── Serve React build ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
