const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// ── Browser-like headers ──────────────────────────────────────────────
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── Yahoo Finance crumb/cookie cache ──────────────────────────────────
let yfCache = { crumb: null, cookie: null, expiry: 0 };

async function getYFAuth() {
  if (yfCache.crumb && Date.now() < yfCache.expiry) return yfCache;

  try {
    // Step 1: GET fc.yahoo.com → get cookie
    const fcRes = await fetch("https://fc.yahoo.com", {
      headers: {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
      }
    });

    const rawCookie = fcRes.headers.get("set-cookie");
    if (!rawCookie) {
      console.error("[auth] No set-cookie from fc.yahoo.com, status:", fcRes.status);
      return yfCache; // return empty, will retry next request
    }
    // Keep only the first k=v pair
    const cookie = rawCookie.split(";")[0].trim();
    console.log("[auth] Got cookie:", cookie.slice(0, 20) + "...");

    // Step 2: Get crumb using cookie
    const crumbRes = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
      headers: {
        "User-Agent": UA,
        "Cookie": cookie,
        "Accept": "text/plain, */*",
      }
    });
    const crumb = (await crumbRes.text()).trim();
    if (!crumb || crumb.startsWith("<") || crumb.length < 4) {
      console.error("[auth] Bad crumb:", crumb.slice(0, 60));
      return yfCache;
    }

    console.log("[auth] Got crumb:", crumb.slice(0, 8) + "...");
    yfCache = { crumb, cookie, expiry: Date.now() + 22 * 3600e3 };
    return yfCache;
  } catch (e) {
    console.error("[auth] Error:", e.message);
    return yfCache;
  }
}

// ── Fetch helper (retries once on 401/403) ────────────────────────────
async function yfFetch(url) {
  const { crumb, cookie } = await getYFAuth();
  const sep = url.includes("?") ? "&" : "?";
  const fullUrl = crumb ? `${url}${sep}crumb=${encodeURIComponent(crumb)}` : url;

  const headers = {
    "User-Agent": UA,
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://finance.yahoo.com/",
    "Origin": "https://finance.yahoo.com",
  };
  if (cookie) headers["Cookie"] = cookie;

  let res = await fetch(fullUrl, { headers });

  // If auth expired, refresh once and retry
  if ((res.status === 401 || res.status === 403) && crumb) {
    yfCache = { crumb: null, cookie: null, expiry: 0 }; // force refresh
    const auth2 = await getYFAuth();
    const url2 = auth2.crumb ? `${url}${sep}crumb=${encodeURIComponent(auth2.crumb)}` : url;
    if (auth2.cookie) headers["Cookie"] = auth2.cookie;
    res = await fetch(url2, { headers });
  }

  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);
  return res.json();
}

// ── Parse raw Yahoo Finance value (handles {raw:n, fmt:"..."} or plain) ──
const raw = (v) => (v && typeof v === "object" ? (v.raw ?? null) : (v ?? null));

// ── RSI (14-period Wilder smoothing) ─────────────────────────────────
function calcRSI(closes, period = 14) {
  const c = closes.filter(v => v != null);
  if (c.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = c[i] - c[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let ag = gains / period, al = losses / period;
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
  const auth = await getYFAuth();
  res.json({
    ok: !!auth.crumb,
    hasCrumb: !!auth.crumb,
    hasCookie: !!auth.cookie,
    crumbPreview: auth.crumb ? auth.crumb.slice(0, 6) + "..." : null,
    ts: new Date().toISOString()
  });
});

// ── /api/quote/:symbol ────────────────────────────────────────────────
app.get("/api/quote/:symbol", async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneYearAgo = now - 365 * 24 * 3600;

    const [chartData, quoteData] = await Promise.all([
      yfFetch(`https://query1.finance.yahoo.com/v8/finance/chart/${sym}?period1=${oneYearAgo}&period2=${now}&interval=1d&includePrePost=false`),
      yfFetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${sym}&fields=regularMarketPrice,regularMarketPreviousClose,regularMarketVolume,currency`)
    ]);

    // Parse chart
    const result  = chartData.chart?.result?.[0] || {};
    const meta    = result.meta || {};
    const qs      = result.indicators?.quote?.[0] || {};
    const closes  = (qs.close  || []).filter(v => v != null);
    const highs   = (qs.high   || []).filter(v => v != null);
    const lows    = (qs.low    || []).filter(v => v != null);
    const vols    = (qs.volume || []).filter(v => v != null);

    // Parse live quote
    const q = quoteData.quoteResponse?.result?.[0] || {};

    const price     = q.regularMarketPrice ?? meta.regularMarketPrice ?? closes.at(-1) ?? 0;
    const prevClose = q.regularMarketPreviousClose ?? meta.chartPreviousClose ?? price;
    const change    = +(price - prevClose).toFixed(2);
    const changePct = prevClose ? +((change / prevClose) * 100).toFixed(2) : 0;

    const ma50  = closes.length >= 50
      ? +(closes.slice(-50).reduce((a, b) => a + b, 0) / 50).toFixed(2) : null;
    const ma200 = closes.length >= 200
      ? +(closes.slice(-200).reduce((a, b) => a + b, 0) / 200).toFixed(2) : null;

    const rsi  = calcRSI(closes.slice(-30));
    const ema12 = calcEMA(closes.slice(-40), 12);
    const ema26 = calcEMA(closes.slice(-40), 26);
    const macd  = (ema12 != null && ema26 != null) ? +(ema12 - ema26).toFixed(2) : null;

    const high52  = highs.length ? +Math.max(...highs).toFixed(2) : null;
    const low52   = lows.length  ? +Math.min(...lows).toFixed(2)  : null;
    const fromHigh = high52 ? +(((price - high52) / high52) * 100).toFixed(1) : null;
    const avgVol  = vols.length >= 20
      ? Math.round(vols.slice(-20).reduce((a, b) => a + b, 0) / 20) : null;

    res.json({
      symbol: sym,
      price: +price.toFixed(2),
      change, changePct,
      prevClose: +prevClose.toFixed(2),
      high52, low52, fromHigh,
      volume: q.regularMarketVolume ?? vols.at(-1) ?? null,
      avgVolume: avgVol,
      currency: q.currency ?? meta.currency ?? "USD",
      ma50, ma200, rsi, macd,
      trend: ma50 && price > ma50 ? "bullish" : "bearish",
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
    const data = await yfFetch(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}` +
      `?modules=summaryDetail,defaultKeyStatistics,financialData,price`
    );

    const r  = data.quoteSummary?.result?.[0] || {};
    const sd = r.summaryDetail        || {};
    const ks = r.defaultKeyStatistics || {};
    const fd = r.financialData        || {};
    const pr = r.price                || {};

    const fmt = (v, dec = 2) => {
      const n = raw(v);
      return n != null ? +Number(n).toFixed(dec) : null;
    };

    const mktCap = raw(pr.marketCap) ?? raw(sd.marketCap);
    const mcapFmt = mktCap
      ? mktCap >= 1e12 ? `$${(mktCap / 1e12).toFixed(2)}T`
                       : `$${(mktCap / 1e9).toFixed(1)}B`
      : null;

    const pct = (v, dec = 1) => {
      const n = raw(v);
      return n != null ? +Number(n * 100).toFixed(dec) : null;
    };

    res.json({
      symbol: sym,
      marketCap:      mcapFmt,
      pe:             fmt(sd.trailingPE),
      forwardPE:      fmt(sd.forwardPE),
      ps:             fmt(ks.priceToSalesTrailing12Months),
      pb:             fmt(ks.priceToBook),
      evEbitda:       fmt(ks.enterpriseToEbitda),
      evRevenue:      fmt(ks.enterpriseToRevenue),
      pegRatio:       fmt(ks.pegRatio),
      eps:            fmt(ks.trailingEps),
      forwardEps:     fmt(ks.forwardEps),
      revenueGrowth:  pct(fd.revenueGrowth),
      grossMargin:    pct(fd.grossMargins),
      operatingMargin:pct(fd.operatingMargins),
      netMargin:      pct(fd.profitMargins),
      roe:            pct(fd.returnOnEquity),
      debtToEquity:   fmt(fd.debtToEquity),
      freeCashflow:   raw(fd.freeCashflow) != null
        ? `$${(raw(fd.freeCashflow) / 1e9).toFixed(1)}B` : null,
      shortFloat:     pct(ks.shortPercentOfFloat),
      beta:           fmt(sd.beta),
      dividendYield:  pct(sd.dividendYield, 2),
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
    const data = await yfFetch(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${sym}` +
      `?modules=insiderTransactions`
    );

    const txns = data.quoteSummary?.result?.[0]?.insiderTransactions?.transactions || [];
    const result = txns.slice(0, 8).map(t => {
      const val    = raw(t.value);
      const shares = raw(t.shares);
      return {
        name:   t.filerName     || "—",
        role:   t.filerRelation || "",
        isBuy:  (t.transactionText || "").toLowerCase().match(/purchase|acquisition/) != null,
        shares: shares,
        value:  val != null ? `$${(val / 1e6).toFixed(1)}M` : null,
        price:  val && shares ? +(val / shares).toFixed(2) : null,
        date:   t.startDate ? new Date(raw(t.startDate) * 1000 || t.startDate).toLocaleDateString("he-IL") : "",
      };
    });
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
  console.log(`Server on port ${PORT}`);
  // Pre-warm auth on startup
  getYFAuth().then(a => console.log("[startup] auth:", a.crumb ? "OK" : "FAILED"));
});
