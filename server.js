const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// ── Yahoo Finance helper ──────────────────────────────────────────────
async function yahooFetch(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "application/json",
    }
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status}`);
  return res.json();
}

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
  const rs = avgGain / avgLoss;
  return Math.round(100 - 100 / (1 + rs));
}

// ── EMA helper ────────────────────────────────────────────────────────
function calcEMA(data, period) {
  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < data.length; i++) ema = data[i] * k + ema * (1 - k);
  return ema;
}

// ── MACD ──────────────────────────────────────────────────────────────
function calcMACD(closes) {
  if (closes.length < 26) return { macd: null, signal: null };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macd = ema12 - ema26;
  return { macd: +macd.toFixed(2), signal: null };
}

// ── /api/quote/:symbol ────────────────────────────────────────────────
app.get("/api/quote/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1y`;
    const data = await yahooFetch(url);
    const meta = data.chart.result[0].meta;
    const quotes = data.chart.result[0].indicators.quote[0];
    const closes = quotes.close.filter(Boolean);
    const highs = quotes.high.filter(Boolean);
    const lows = quotes.low.filter(Boolean);
    const volumes = quotes.volume.filter(Boolean);

    const price = meta.regularMarketPrice || closes[closes.length - 1];
    const prevClose = meta.previousClose || meta.chartPreviousClose;
    const change = +(price - prevClose).toFixed(2);
    const changePct = +((change / prevClose) * 100).toFixed(2);

    const ma50 = closes.length >= 50
      ? +(closes.slice(-50).reduce((a, b) => a + b, 0) / 50).toFixed(2)
      : null;
    const ma200 = closes.length >= 200
      ? +(closes.slice(-200).reduce((a, b) => a + b, 0) / 200).toFixed(2)
      : null;
    const rsi = calcRSI(closes.slice(-30));
    const { macd } = calcMACD(closes.slice(-40));
    const high52 = +Math.max(...highs).toFixed(2);
    const low52 = +Math.min(...lows).toFixed(2);
    const fromHigh = +(((price - high52) / high52) * 100).toFixed(1);
    const avgVol = Math.round(volumes.slice(-20).reduce((a, b) => a + b, 0) / 20);

    res.json({
      symbol: sym,
      price: +price.toFixed(2),
      change,
      changePct,
      prevClose: +prevClose.toFixed(2),
      high52,
      low52,
      fromHigh,
      volume: volumes[volumes.length - 1],
      avgVolume: avgVol,
      currency: meta.currency,
      // Technical
      ma50,
      ma200,
      rsi,
      macd,
      trend: ma50 && price > ma50 ? "bullish" : "bearish",
      goldenCross: ma50 && ma200 ? ma50 > ma200 : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/valuation/:symbol ────────────────────────────────────────────
app.get("/api/valuation/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=summaryDetail,defaultKeyStatistics,financialData,price`;
    const data = await yahooFetch(url);
    const r = data.quoteSummary.result[0];
    const sd = r.summaryDetail || {};
    const ks = r.defaultKeyStatistics || {};
    const fd = r.financialData || {};
    const pr = r.price || {};

    const v = (obj, key) => obj[key]?.raw ?? null;
    const fmt = (n, dec = 2) => n != null ? +n.toFixed(dec) : null;

    const marketCap = v(pr, "marketCap");
    const mcapFmt = marketCap
      ? marketCap >= 1e12
        ? `$${(marketCap / 1e12).toFixed(2)}T`
        : `$${(marketCap / 1e9).toFixed(1)}B`
      : null;

    res.json({
      symbol: sym,
      marketCap: mcapFmt,
      marketCapRaw: marketCap,
      pe: fmt(v(sd, "trailingPE")),
      forwardPE: fmt(v(sd, "forwardPE")),
      ps: fmt(v(ks, "priceToSalesTrailing12Months")),
      pb: fmt(v(ks, "priceToBook")),
      evEbitda: fmt(v(ks, "enterpriseToEbitda")),
      evRevenue: fmt(v(ks, "enterpriseToRevenue")),
      pegRatio: fmt(v(ks, "pegRatio")),
      eps: fmt(v(ks, "trailingEps")),
      forwardEps: fmt(v(ks, "forwardEps")),
      revenueGrowth: fmt(v(fd, "revenueGrowth") * 100, 1),
      grossMargin: fmt(v(fd, "grossMargins") * 100, 1),
      operatingMargin: fmt(v(fd, "operatingMargins") * 100, 1),
      netMargin: fmt(v(fd, "profitMargins") * 100, 1),
      roe: fmt(v(fd, "returnOnEquity") * 100, 1),
      debtToEquity: fmt(v(fd, "debtToEquity")),
      freeCashflow: v(fd, "freeCashflow")
        ? `$${(v(fd, "freeCashflow") / 1e9).toFixed(1)}B`
        : null,
      shortFloat: fmt(v(ks, "shortPercentOfFloat") * 100, 1),
      beta: fmt(v(sd, "beta")),
      dividendYield: v(sd, "dividendYield")
        ? fmt(v(sd, "dividendYield") * 100, 2)
        : null,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── /api/insider/:symbol ─────────────────────────────────────────────
app.get("/api/insider/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${sym}?modules=insiderTransactions`;
    const data = await yahooFetch(url);
    const transactions = data.quoteSummary?.result?.[0]?.insiderTransactions?.transactions || [];
    const result = transactions.slice(0, 8).map(t => ({
      name: t.filerName || "—",
      role: t.filerRelation || "",
      isBuy: (t.transactionText || "").toLowerCase().includes("purchase") || (t.transactionText || "").toLowerCase().includes("acquisition"),
      shares: t.shares?.raw || null,
      price: (t.value?.raw && t.shares?.raw && t.shares.raw > 0)
        ? +(t.value.raw / t.shares.raw).toFixed(2)
        : null,
      value: t.value?.raw ? `$${(t.value.raw / 1e6).toFixed(1)}M` : null,
      date: t.startDate?.fmt || "",
    }));
    res.json(result);
  } catch(e) {
    res.json([]);
  }
});

// ── Serve React build ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
