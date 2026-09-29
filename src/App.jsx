import { useState, useEffect, useRef } from "react";

// ── COLORS ──────────────────────────────────────────────────────────
const C = {
  bg:"#040408", s1:"#09090f", s2:"#0e0e18", s3:"#13132a", s4:"#18182e",
  b1:"rgba(255,255,255,.06)", b2:"rgba(255,255,255,.11)",
  t1:"#e4e4ff", t2:"#6565a0", t3:"#363658",
  grn:"#00d47e", red:"#ff3d5a", amb:"#f59e0b",
  blu:"#4f8eff", pur:"#a855f7", cya:"#06b6d4", gld:"#fbbf24"
};

const style = (obj) => obj;

// ── STOCK DATA ───────────────────────────────────────────────────────
const STOCKS = [
  { id:"amzn", tk:"AMZN", name:"Amazon", price:"$250", color:"#f5a623", bg:"#5a2a08",
    rec:"STRONG BUY", recC:"#00d47e", what:"AWS #1 · E-Commerce · Ads $75B", target:"$291–320", pos:"12–15%",
    cap:"$2.66T", pe:"35x", beta:"1.38", desc:"E-Commerce · AWS #1 Cloud · Advertising · Seattle WA · 1994 · 1.5M עובדים",
    tags:[["#f5a623","Wide Moat"],["#00d47e","AWS +24%"],["#ff3d5a","FCF לחוץ"],["#4f8eff","Buffett 5.5/9"]],
    margins:[["גולמי","50%","#f5a623",50],["AWS Op","36%","#00d47e",36],["תפעולי","11.2%","#00d47e",11],["נקי","10.8%","#00d47e",11],["ROE","22.3%","#00d47e",22],["ROIC","14.2%","#f59e0b",14]],
    bs:[["מזומן","$94.2B","#f59e0b"],["חוב","$135.4B","#ff3d5a"],["D/E","0.43","#f59e0b"],["Net Debt","-$41B","#ff3d5a"],["FCF FY25","$11B ↓","#ff3d5a"],["OCF","$130.7B","#00d47e"],["Current","1.05","#f59e0b"],["Backlog","$200B+","#00d47e"]],
    buff:"5.5", buffS:"★★★☆☆", buffC:"#f59e0b", buffV:"MIXED — Sum-of-Parts $275-340",
    bc:[["✅","עסק מובן","Retail+Cloud+Ads"],["✅","היסטוריה","30 שנה"],["✅","עתיד","80% IT on-premise"],["✅","הנהלה","Jassy 8.5/10"],["✅","ROE 22.3%",""],["⚠️","שוליים 11%","עולה"],["⚠️","D/E 0.43",""],["❌","FCF $11B ↓","CapEx"],["⚠️","P/E 35x",""]],
    adv:["AWS Flywheel — 1,500+ services, switching cost 2-5 שנים","Logistics — 3K מחסנים, Same-day 75% ארה\"ב","Advertising Closed-loop — יודעת מה קנית = CPM premium","Prime 200M+ members × $139 = Lock-in ecosystem"],
    risks:["CapEx $200B ROI לא מוכח — FCF מ-$38B ל-$11B","Regulatory/FTC vs Amazon","AWS Deceleration — Azure+GCP צומחות מהר","Current Ratio 1.05 — נזילות גבולית"],
    ceo:"Andy Jassy — CEO 2021 · Harvard BA+MBA · בנה AWS מ-$0 ל-$128B · ציון 8.5/10",
    kpis:[["FY25","$716.9B","+12%"],["AWS","$128.7B","+20%"],["Op Inc","$80B","11.2%"],["Ads","$75B","+23%"],["EPS","$8.05",""],["יעד avg","$291","72 Buy"]],
    w52l:"$165", w52p:88, verdict:"BUY — Sum-of-Parts $275-340", entry:"$240–255", stop:"$222",
    thesis:"Earnings 29 אפר׳. AWS guidance Q2. FCF recovery H2 2026. AI ARR $15B→$25B."
  },
  { id:"msft", tk:"MSFT", name:"Microsoft", price:"$422", color:"#4f8eff", bg:"#1b3a6b",
    rec:"BUY", recC:"#00d47e", what:"Azure +39% · Backlog $625B · D/E 0.15", target:"$550–590", pos:"15–20%",
    cap:"$3.14T", pe:"24x Fwd", beta:"1.11", desc:"Azure Cloud · Office 365 · Windows · LinkedIn · GitHub · Redmond WA · 228K עובדים",
    tags:[["#4f8eff","Wide Moat"],["#ff3d5a","▼24% מהשיא"],["#00d47e","Azure +39%"],["#f59e0b","Backlog $625B"]],
    margins:[["גולמי","69.4%","#4f8eff",69],["EBITDA","57.7%","#4f8eff",57],["תפעולי","46.7%","#00d47e",46],["נקי","39.0%","#00d47e",39],["FCF Margin","25.3%","#f59e0b",25],["ROE","34.4%","#00d47e",34]],
    bs:[["מזומן","$94.6B","#00d47e"],["LT Debt","~$50B","#00d47e"],["D/E","0.15","#00d47e"],["Net Cash","+$44B","#00d47e"],["Assets","$619B","#6565a0"],["Equity","$343B","#6565a0"],["FCF TTM","$77.4B","#00d47e"],["Backlog","$625B","#4f8eff"]],
    buff:"7.4", buffS:"★★★★½", buffC:"#00d47e", buffV:"PASS — Buffett Quality Stock",
    bc:[["✅","עסק מובן",""],["✅","היסטוריה","50 שנה"],["✅","עתיד","Cloud+AI"],["✅","Nadella 9.5/10",""],["✅","ROE 34.4%",""],["✅","שולי 39%",""],["✅","D/E 0.15","Net Cash"],["⚠️","FCF $77B","↓CapEx"],["✅","P/E 24x","▼24%"]],
    adv:["Lock-in — Teams+SharePoint+Azure AD, switching cost גבוה","Network Effects — LinkedIn 950M, GitHub 100M","Scale — 73% Windows, 60+ Azure regions, Copilot $30/user","OpenAI 49% — $13B = כבר שווה $100B+"],
    risks:["CapEx $94B FY26 ROI לא מוכח","OpenAI concentration — 40% מ-Backlog","Azure deceleration — ירידה מ-40% ל-39%","EU DMA + Antitrust"],
    ceo:"Satya Nadella — CEO 2014 · Hyderabad India · EE+CS+MBA · Microsoft מ-1992 · ציון 9.5/10",
    kpis:[["Q2 FY26","$81.3B","+17%"],["EPS","$4.14","+24%"],["Azure","+39%",""],["FCF","$77.4B",""],["Copilot","15M seats",""],["יעד","$590","41/49 Buy"]],
    w52l:"$355", w52p:33, verdict:"BUY — Buffett 7.4/9 · ▼24% Discount", entry:"$400–430", stop:"$388",
    thesis:"▼24% מהשיא. Azure AI → $25B. Backlog $625B = נראות 2-3 שנים. Earnings 29 אפר׳."
  },
  { id:"meta", tk:"META", name:"Meta", price:"$662", color:"#3d8bff", bg:"#13204a",
    rec:"STRONG BUY", recC:"#00d47e", what:"3.58B DAP · PEG 0.94 · FCF $46B", target:"$838–856", pos:"20–25%",
    cap:"$1.67T", pe:"21x Fwd / PEG 0.94", beta:"1.22", desc:"Facebook · Instagram · WhatsApp · Threads · Menlo Park CA · 2004 · 78.8K עובדים",
    tags:[["#00d47e","Wide Moat"],["#4f8eff","3.58B DAP"],["#a855f7","PEG 0.94!"],["#f59e0b","Buffett 8.0/9"]],
    margins:[["גולמי (Apps)","82%","#3d8bff",82],["תפעולי Q4","41%","#00d47e",41],["נקי","22.5%","#00d47e",22],["FCF Margin","22.9%","#f59e0b",23],["ROE","30.2%","#00d47e",30],["ROIC","27.8%","#00d47e",27]],
    bs:[["מזומן","$81.6B","#00d47e"],["חוב","$58.7B","#00d47e"],["D/E","0.39","#00d47e"],["Net Cash","+$22.9B","#00d47e"],["FCF FY25","$46.1B","#00d47e"],["OCF","$115.8B","#00d47e"],["Current","2.60","#00d47e"],["EV/EBITDA","15.6x","#00d47e"]],
    buff:"8.0", buffS:"★★★★★", buffC:"#00d47e", buffV:"STRONG PASS — Best Idea בתיק",
    bc:[["✅","עסק מובן","פרסום"],["✅","היסטוריה","20 שנה"],["✅","עתיד","AI Ads"],["✅","Zuck 8.5/10",""],["✅","ROE 30.2%",""],["✅","Op 41%",""],["✅","D/E 0.39","Net Cash"],["⚠️","FCF $46B","↓CapEx"],["✅","PEG 0.94!",""]],
    adv:["Network Effect — WhatsApp+Instagram+Facebook לא ניתן לשכפל","Advantage+ AI Flywheel — $60B ARR, self-reinforcing","MTIA Custom Chip — 2nm, עצמאות מ-Nvidia","3 Platforms — FB+IG+WA = שלושה revenue streams"],
    risks:["EU DMA — EU revenue ~25%, targeting limited","CapEx $115-135B 2026 — FCF לחוץ","Reality Labs הפסד $6B/Q","97% Ad Concentration — מיתון = חשיפה"],
    ceo:"Mark Zuckerberg — Co-Founder CEO 2004 · Harvard dropout · Class B 61% הצבעה · ציון 8.5/10",
    kpis:[["Q4 2025","$59.9B","+24%"],["FY25","$201B","+22%"],["EPS Q4","$8.88","+11%"],["DAP","3.58B","+7%"],["Net Cash","+$22.9B",""],["יעד","$855","+29%"]],
    w52l:"$479", w52p:61, verdict:"STRONG BUY — Best Idea · PEG 0.94", entry:"$650–670", stop:"$580",
    thesis:"PEG 0.94 = הזדמנות נדירה. Earnings 29 אפר׳. EPS $6.63, Rev ~$55B. Beat = $720-750."
  },
  { id:"ibit", tk:"IBIT", name:"Bitcoin ETF", price:"$44", color:"#fbbf24", bg:"#3a2700",
    rec:"HOLD/BUY", recC:"#f59e0b", what:"BlackRock · AUM $63B · BTC ~$76K", target:"$65–90", pos:"5–10%",
    cap:"$63B AUM", pe:"N/A", beta:"~1.8", desc:"iShares Bitcoin Trust ETF · BlackRock $10T AUM · Custody Coinbase Prime · NYSE 2024",
    tags:[["#fbbf24","#1 Bitcoin ETF"],["#00d47e","AUM $63B"],["#4f8eff","Halving 50%"],["#ff3d5a","BTC ▼40% ATH"]],
    margins:[["AUM Growth","$0→$63B","#00d47e",80],["BTC vs ATH","▼40%","#ff3d5a",40],["Halving","50.84%","#fbbf24",50],["Expense","0.25%","#00d47e",20]],
    bs:[["NAV","~$44","#fbbf24"],["AUM","$63B","#00d47e"],["BTC מוחזק","~574K","#fbbf24"],["Expense","0.25%","#00d47e"],["BTC נוכחי","~$76K","#fbbf24"],["BTC ATH","$126,198","#ff3d5a"],["Halving","50.84%","#00d47e"],["Next Halving","אפר׳ 2028","#6565a0"]],
    buff:"2.5", buffS:"★★☆☆☆", buffC:"#f59e0b", buffV:"NOT Buffett — Digital Gold נכס שונה",
    bc:[["❌","עסק מובן","BTC≠מניה"],["⚠️","היסטוריה","4 cycles"],["⚠️","עתיד","ספקולטיבי"],["⚠️","BlackRock A+","מנהל"],["❌","ROE","N/A"],["❌","שוליים","N/A"],["✅","D/E","0 חוב"],["❌","FCF","N/A"],["⚠️","תמחור","Cycle"]],
    adv:["BlackRock Legitimacy — $10T AUM, institutional credibility","Halving Scarcity — 3.125 BTC/block, inflation <1%","Digital Gold — Inflation+debasement hedge","NYSE Listed — IRA eligible, no custody risk"],
    risks:["▼40% מ-ATH $126K — cycle מתון vs +300% קודם","Beta ~1.8 — amplified drawdowns","Regulatory — global scenarios","Miner selling — post-halving revenue -50%"],
    ceo:"BlackRock / Larry Fink — #1 Asset Manager $10T AUM · IBIT: $50B ב-11 חודשים = שיא היסטורי",
    kpis:[["IBIT","$44",""],["BTC","~$76K",""],["AUM","$63B","#1"],["Expense","0.25%",""],["Halving","50.84%",""],["יעד מוסדי","$150-250K",""]],
    w52l:"$35.30", w52p:38, verdict:"HOLD / BUY DIPS — Halving Cycle Play", entry:"$38–48", stop:"$30",
    thesis:"Halving 50% complete. BTC $76K vs ATH $126K. Institutional demand. Accumulate dips."
  },
  { id:"vcx", tk:"VCX", name:"Fundrise VC", price:"$89", color:"#a855f7", bg:"#1a1a3a",
    rec:"SPEC BUY", recC:"#a855f7", what:"Anthropic+OpenAI+SpaceX+24 more", target:"$110–130", pos:"≤7%",
    cap:"$2.4B", pe:"N/A", beta:"N/A", desc:"Fundrise Innovation Fund · Publicly Traded VC · Late-Stage Private Tech · Washington DC",
    tags:[["#a855f7","Anthropic+OpenAI"],["#00d47e","+22% שנה"],["#4f8eff","28 חברות"],["#ff3d5a","NAV Self-Reported"]],
    margins:[["ביצועים שנה","+22%","#a855f7",22],["Anthropic Val","$61B","#f59e0b",60],["OpenAI Val","$300B+","#f59e0b",80],["Dividend","0.2%","#6565a0",1]],
    bs:[["NAV","~$89","#a855f7"],["AUM","$2.4B","#00d47e"],["Holdings","28 חברות","#a855f7"],["ביצועים","+22%","#00d47e"],["Anthropic","$61B","#f59e0b"],["OpenAI","$300B+","#f59e0b"],["Dividend","0.2%","#6565a0"],["Erebor","אפר׳ 2026","#06b6d4"]],
    buff:"2.5", buffS:"★★☆☆☆", buffC:"#a855f7", buffV:"NOT Buffett — Pure VC Speculation",
    bc:[["❌","עסק מובן","28 opaque"],["⚠️","היסטוריה","2 שנים"],["✅","עתיד","AI עתיד"],["⚠️","הנהלה","ניגוד עניינים"],["❌","ROE","N/A"],["❌","שוליים","N/A"],["✅","D/E","0"],["❌","FCF","N/A"],["⚠️","NAV","self-reported"]],
    adv:["Pre-IPO Access — Anthropic+OpenAI+SpaceX לפני IPO","IPO Catalyst — Databricks מתוכנן","NYSE Listed — נזיל, אין accredited requirement","AI Decade — 28 חברות AI+BioTech+FinTech"],
    risks:["NAV self-reported — ניגוד עניינים מבני","IPO Risk — down-round scenario","AI Valuations גבוהות — OpenAI $300B על $4B revenue","Volume נמוך — thin market"],
    ceo:"Fundrise / Ben Miller — Pioneer קמעונאי crowdfunding · $3B+ AUM total",
    kpis:[["מחיר","$89",""],["AUM","$2.4B",""],["Holdings","28","חברות"],["Anthropic","$61B","Top"],["ביצועים","+22%","שנה"],["Catalyst","IPO 2026-27",""]],
    w52l:"~$72", w52p:71, verdict:"SPEC BUY ≤7% — Pre-IPO AI Exposure", entry:"$78–85", stop:"$72",
    thesis:"Anthropic+OpenAI+SpaceX pre-IPO. Catalyst: Databricks IPO. NAV self-reported = סיכון."
  },
  { id:"ceg", tk:"CEG", name:"Constellation", price:"$275", color:"#06b6d4", bg:"#0a1f2e",
    rec:"BUY", recC:"#06b6d4", what:"גרעין #1 · Calpine 23GW · EPS $11-12", target:"$330–367", pos:"8–12%",
    cap:"$99.3B", pe:"23.9x", beta:"1.15", desc:"גרעין #1 ארה\"ב · Calpine (ינואר 2026) · Natural Gas · Retail Energy · Baltimore MD",
    tags:[["#06b6d4","גרעין #1 21GW"],["#00d47e","Q1 Beat +5.8%"],["#ff3d5a","▼33% מ-ATH"],["#f59e0b","Calpine $22B"]],
    margins:[["גולמי","~30%","#06b6d4",30],["תפעולי","~18%","#00d47e",18],["נקי Q1","14.3%","#00d47e",14],["ROE","~12%","#f59e0b",12],["FCFbG FY26-27","$8.4B","#00d47e",60],["FCFbG FY28-29","$13B","#00d47e",80]],
    bs:[["Total Assets","$96.9B","#06b6d4"],["LT Debt","$17B","#ff3d5a"],["D/E","~0.85","#f59e0b"],["Goodwill","$11.1B","#ff3d5a"],["FCFbG FY26","$8.4B","#00d47e"],["FCFbG FY28","$11.5-13B","#00d47e"],["Credit","BBB+/Baa1","#00d47e"],["Dividend","0.62%","#6565a0"]],
    buff:"5.5", buffS:"★★★☆☆", buffC:"#06b6d4", buffV:"BUY — AI Power Infrastructure",
    bc:[["✅","עסק מובן","גרעין+גז"],["✅","היסטוריה","Exelon legacy"],["✅","עתיד","AI Power 10+ שנה"],["✅","Dominguez 8/10","MS PPA"],["⚠️","ROE ~12%",""],["⚠️","שוליים 14%",""],["⚠️","D/E ~0.85","Calpine"],["✅","FCFbG $8.4B","→$13B"],["✅","P/E 24x","▼33%"]],
    adv:["גרעין = MOAT בלתי ניתן לשכפול — $15-30B ו-15-20 שנה","AI Power — Data Centers צריכים 24/7 clean power","Microsoft PPA 20 שנה — template לכל hyperscaler","EPS $11-12, FCFbG $8.4B→$13B — visibility ברורה"],
    risks:["Goodwill $11.1B — Calpine overpay? Impairment risk","D/E עלה — Interest expense ×2 ל-$253M/Q","DOJ PJM Divestitures — $5B נכסים נמכרים","▼33% — AI Power narrative אולי מתומחר"],
    ceo:"Joe Dominguez — CEO 2022 · Georgetown Law JD · Microsoft PPA 20Y · Calpine $22B · ציון 8/10",
    kpis:[["Q1 2026","$11.12B","+64%"],["GAAP EPS","$4.49","Beat"],["Adj EPS","$2.74",""],["FY26 Guide","$11-12","EPS"],["FCFbG","$8.4B","FY26-27"],["יעד avg","$367","+33%"]],
    w52l:"$243", w52p:35, verdict:"BUY — AI Power · RSI Oversold · ▼33%", entry:"$255–280", stop:"$240",
    thesis:"RSI ~38 = Oversold. Q1 Beat +5.8%. EPS $11-12. FCFbG $8.4B→$13B. Microsoft PPA template."
  },
  { id:"dram", tk:"DRAM", name:"Memory ETF", price:"$51", color:"#e879f9", bg:"#1a0a2e",
    rec:"SPEC BUY", recC:"#e879f9", what:"Samsung+Micron+SK Hynix · +100%", target:"$60–75", pos:"≤8%",
    cap:"$6.2B AUM", pe:"6.4x", beta:"גבוה", desc:"Roundhill Memory ETF · Actively Managed · Launched April 2 2026 · NYSE · AI Memory Supercycle",
    tags:[["#e879f9","+100% ב-36 ימים"],["#00d47e","AUM $6.2B"],["#ff3d5a","Korea Risk"],["#4f8eff","AI Supercycle"]],
    margins:[["מהשקה","+100%","#e879f9",100],["P/E Holdings","6.4x","#00d47e",40],["Korea Exposure","גבוה","#ff3d5a",65],["Expense","0.65%","#f59e0b",20]],
    bs:[["מחיר","~$51","#e879f9"],["AUM","$6.2B+","#00d47e"],["מהשקה","+100%","#00d47e"],["52W","$26/$56","#6565a0"],["P/E Holdings","6.4x","#00d47e"],["Expense","0.65%","#f59e0b"],["Korea %","גבוה","#ff3d5a"],["Signal","Strong Buy","#00d47e"]],
    buff:"2.5", buffS:"★★☆☆☆", buffC:"#e879f9", buffV:"SPEC — Thematic Momentum Play",
    bc:[["⚠️","עסק מובן","Memory מורכב"],["❌","היסטוריה","6 שבועות!"],["✅","עתיד","AI Supercycle"],["⚠️","Roundhill OK","Thematic"],["✅","P/E 6.4x","זול"],["⚠️","שוליים","מתרחבים"],["✅","D/E","0"],["❌","FCF","N/A ETF"],["❌","תמחור","+100% FOMO"]],
    adv:["AI Memory Supercycle — כל H100 = 80GB HBM, demand רב-שנתי","P/E 6.4x = Deep value, re-rating potential 12-15x","Diversified — Samsung+SK Hynix+Micron+SanDisk+WDC+STX","WDC+STX +200% YTD — AI Storage captured"],
    risks:["+100% ב-36 ימים = FOMO, reversal likely","Korea Concentration — Samsung+SKH dominant","Memory Cyclicality — 2022: DRAM prices ▼75%","Expense 0.65% vs SMH 0.35%"],
    ceo:"Roundhill / Will Hershey — Thematic ETF specialist · BETZ,CHAT,YBTC,DRAM",
    kpis:[["מחיר","$51","May 2026"],["AUM","$6.2B+","36 ימים"],["מהשקה","+100%",""],["P/E","6.4x","Cheap"],["WDC/STX","+200% YTD",""],["Signal","Strong Buy",""]],
    w52l:"$26 Launch", w52p:85, verdict:"SPEC BUY ≤8% — Dips Only $42-46", entry:"$42–46", stop:"$36",
    thesis:"P/E 6.4x = Memory זול. AI HBM demand multi-year. Korea risk. כנס בתיקון $42-46 בלבד."
  },
];

const THESIS_CTX = {
  AMZN:"AWS $200B backlog, CapEx $200B, FCF $11B, Ads $75B, BUY $291",
  MSFT:"Azure +39%, Backlog $625B, D/E 0.15, BUY $590",
  META:"PEG 0.94, FCF $46B, Buffett 8/9, STRONG BUY $855",
  IBIT:"BTC $76K ATH $126K, Halving 50%, HOLD $65-90",
  VCX:"Anthropic+OpenAI, NAV $89, SPEC $110-130",
  CEG:"גרעין, Calpine, EPS $11-12, RSI38, BUY $367",
  DRAM:"Memory+100%, P/E 6.4x, Korea risk, SPEC $60-75",
};

// ── CLAUDE API ────────────────────────────────────────────────────────
async function callClaude(sys, usr) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: sys,
      messages: [{ role: "user", content: usr }],
      tools: [{ type: "web_search_20250305", name: "web_search" }]
    })
  });
  if (!res.ok) throw new Error("API " + res.status);
  const d = await res.json();
  return d.content.filter(b => b.type === "text").map(b => b.text).join("\n");
}

function fmtAI(t) {
  return t
    .replace(/\*\*(.*?)\*\*/g, "<b style='color:#e4e4ff'>$1</b>")
    .replace(/🟢/g, "<span style='color:#00d47e'>🟢</span>")
    .replace(/🔴/g, "<span style='color:#ff3d5a'>🔴</span>")
    .replace(/⚠️/g, "<span style='color:#f59e0b'>⚠️</span>")
    .replace(/\n/g, "<br/>");
}

// ── CSS INJECTION ─────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#040408;--s1:#09090f;--s2:#0e0e18;--s3:#13132a;--s4:#18182e;
  --b1:rgba(255,255,255,.06);--b2:rgba(255,255,255,.11);
  --t1:#e4e4ff;--t2:#6565a0;--t3:#363658;
  --grn:#00d47e;--red:#ff3d5a;--amb:#f59e0b;--blu:#4f8eff;--pur:#a855f7;--cya:#06b6d4;--gld:#fbbf24;
  --fn:'Heebo',sans-serif;--fm:'JetBrains Mono',monospace;
}
body{font-family:var(--fn);background:var(--bg);color:var(--t1);direction:rtl}
.app{display:flex;flex-direction:column;height:100vh;overflow:hidden}
.hdr{background:var(--s1);border-bottom:1px solid var(--b1);padding:0 16px;
  height:46px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.logo{width:30px;height:30px;background:linear-gradient(135deg,#4f8eff,#a855f7);
  border-radius:7px;display:flex;align-items:center;justify-content:center;
  font-family:var(--fm);font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
.nav{background:var(--s1);border-bottom:1px solid var(--b1);display:flex;
  overflow-x:auto;scrollbar-width:none;flex-shrink:0;padding:0 8px}
.nav::-webkit-scrollbar{display:none}
.nb{display:flex;align-items:center;gap:6px;padding:9px 11px;cursor:pointer;
  background:none;border:none;color:var(--t3);font-family:var(--fn);
  font-size:11px;font-weight:600;border-bottom:2px solid transparent;
  white-space:nowrap;transition:all .15s}
.nb:hover{color:var(--t2)}
.nb.on{color:var(--t1);border-bottom-color:var(--blu)}
.ntk{font-family:var(--fm);font-size:9px;padding:2px 6px;border-radius:3px;font-weight:700}
.ticker{background:var(--s1);border-bottom:1px solid var(--b1);height:34px;
  display:flex;align-items:center;overflow-x:auto;scrollbar-width:none;
  padding:0 12px;gap:0;flex-shrink:0}
.ticker::-webkit-scrollbar{display:none}
.tick{display:flex;align-items:center;gap:6px;padding:0 13px;height:34px;
  cursor:pointer;border-right:1px solid var(--b1);transition:background .12s;flex-shrink:0}
.tick:hover{background:var(--s2)}
.content{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--b2) transparent}
.content::-webkit-scrollbar{width:5px}
.content::-webkit-scrollbar-track{background:transparent}
.content::-webkit-scrollbar-thumb{background:var(--b2);border-radius:3px}
.inner{padding:16px;max-width:1200px;margin:0 auto}
.panel{background:var(--s2);border:1px solid var(--b1);border-radius:11px;padding:15px 18px;margin-bottom:12px}
.panel.hig{border-color:rgba(0,212,126,.18);background:rgba(0,212,126,.025)}
.panel.hir{border-color:rgba(255,61,90,.18);background:rgba(255,61,90,.025)}
.sec{font-size:9px;letter-spacing:2px;color:var(--t3);font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.secb{width:3px;height:11px;border-radius:2px;flex-shrink:0}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:11px}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:14px}
.card{background:var(--s2);border:1px solid var(--b1);border-radius:11px;padding:12px;
  cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.card:hover{transform:translateY(-2px);border-color:var(--b2);background:var(--s3)}
.ctop{position:absolute;top:0;left:0;right:0;height:2px}
.tbl-w{background:var(--s2);border:1px solid var(--b1);border-radius:10px;overflow:hidden;margin-bottom:13px}
.tbl{width:100%;border-collapse:collapse;font-size:11px}
.tbl thead tr{background:var(--s3)}
.tbl th{padding:8px 11px;font-size:9px;letter-spacing:1.8px;color:var(--t3);font-weight:700;text-align:right;white-space:nowrap}
.tbl tbody tr{border-top:1px solid var(--b1)}
.tbl tbody tr:hover{background:var(--s3)}
.tbl td{padding:9px 11px;white-space:nowrap}
.mrow{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.mlbl{font-size:11px;color:var(--t2);min-width:150px;text-align:right}
.mbar{flex:1;height:4px;background:var(--b1);border-radius:2px;overflow:hidden}
.mfill{height:100%;border-radius:2px}
.mval{font-size:11px;font-family:var(--fm);font-weight:600;min-width:55px}
.bsg{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.bsi{background:var(--s3);border-radius:7px;padding:8px 11px}
.bsl{font-size:9px;letter-spacing:1px;color:var(--t3);font-weight:600;margin-bottom:3px}
.bsv{font-size:13px;font-weight:700;font-family:var(--fm)}
.buff-g{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:9px}
.bi{background:var(--s3);border-radius:7px;padding:7px 9px;display:flex;align-items:flex-start;gap:6px}
.bin{font-size:10px;color:var(--t2);font-weight:600;margin-bottom:1px}
.bit{font-size:9px;color:var(--t3)}
.buff-tot{background:linear-gradient(135deg,var(--s3),var(--s4));border-radius:9px;padding:11px 13px;display:flex;align-items:center;gap:13px;border:1px solid var(--b2)}
.ai-item{display:flex;align-items:flex-start;gap:7px;padding:7px 10px;background:rgba(0,212,126,.07);border:1px solid rgba(0,212,126,.14);border-radius:7px;margin-bottom:5px;font-size:11px;color:var(--t2);line-height:1.6}
.ri-item{display:flex;align-items:flex-start;gap:7px;padding:7px 10px;background:var(--s3);border-radius:7px;margin-bottom:5px;font-size:11px;color:var(--t2);line-height:1.6}
.dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:3px}
.kpig{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px}
.kpi{background:var(--s2);border:1px solid var(--b1);border-radius:9px;padding:9px 12px}
.kl{font-size:9px;letter-spacing:1.2px;color:var(--t3);font-weight:600;margin-bottom:3px}
.kv{font-size:14px;font-weight:700;font-family:var(--fm)}
.ks{font-size:9px;color:var(--t3);margin-top:2px}
.verd{border-radius:11px;padding:12px 16px;display:flex;gap:10px;align-items:flex-start;border:1px solid;margin-bottom:10px}
.ag{background:var(--s3);border-radius:7px;padding:9px 11px;text-align:center}
.agl{font-size:9px;color:var(--t3);letter-spacing:1.2px;margin-bottom:3px}
.agv{font-size:13px;font-weight:700;font-family:var(--fm)}
.hero{border-radius:14px;border:1px solid var(--b2);padding:18px 22px;margin-bottom:14px;position:relative;overflow:hidden}
.htopline{position:absolute;top:0;left:0;right:0;height:3px}
.ls{display:flex;align-items:center;gap:9px;margin-top:9px;padding:8px 11px;background:rgba(0,0,0,.25);border-radius:8px;flex-wrap:wrap}
.rn-btn{padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid;background:none;font-family:var(--fn);transition:all .15s}
.rf-btn{padding:4px 12px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid rgba(0,212,126,.3);background:rgba(0,212,126,.07);color:var(--grn);font-family:var(--fn);white-space:nowrap;margin-left:8px}
.rf-btn:disabled{opacity:.4;cursor:not-allowed}
.ai-card{background:var(--s2);border:1px solid var(--b1);border-radius:11px;overflow:hidden}
.ai-head{padding:12px 16px 10px;display:flex;align-items:center;gap:9px;border-bottom:1px solid var(--b1)}
.ai-body{padding:12px 16px}
.ai-out{background:var(--s3);border-radius:8px;padding:11px 14px;min-height:80px;font-size:11px;color:var(--t2);line-height:1.75;max-height:280px;overflow-y:auto}
.run-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 13px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;border:none;color:#fff;font-family:var(--fn);margin-bottom:8px}
.run-btn:disabled{opacity:.4;cursor:not-allowed}
.ts-btn{font-family:var(--fm);font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;border:1px solid;cursor:pointer;background:none;margin:0 2px 3px 0;transition:all .12s}
.ts-btn.off{opacity:.35}
.sel{background:var(--s3);border:1px solid var(--b2);border-radius:6px;padding:5px 9px;font-size:11px;color:var(--t1);font-family:var(--fn);cursor:pointer;margin-left:8px}
.spin{display:inline-block;width:10px;height:10px;border:2px solid rgba(255,255,255,.15);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle}
@keyframes spin{to{transform:rotate(360deg)}}
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:700}
.ldot{width:5px;height:5px;border-radius:50%;background:var(--grn);animation:pu 2s infinite}
@keyframes pu{0%,100%{opacity:1}50%{opacity:.3}}
.pri-item{display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:8px;border:1px solid;margin-bottom:5px;font-size:11px;color:var(--t2)}
@media(max-width:780px){
  .cards{grid-template-columns:repeat(2,1fr)}
  .buff-g{grid-template-columns:repeat(2,1fr)}
  .kpig{grid-template-columns:repeat(2,1fr)}
  .g2{grid-template-columns:1fr}
}
`;

// ── COMPONENTS ─────────────────────────────────────────────────────────
function MarginBar({ label, val, color, pct }) {
  return (
    <div className="mrow">
      <div className="mlbl">{label}</div>
      <div className="mbar"><div className="mfill" style={{ width: Math.min(pct, 100) + "%", background: color }} /></div>
      <div className="mval" style={{ color }}>{val}</div>
    </div>
  );
}

function BSItem({ label, val, color }) {
  return (
    <div className="bsi">
      <div className="bsl">{label}</div>
      <div className="bsv" style={{ color }}>{val}</div>
    </div>
  );
}

function BuffettItem({ ico, name, note }) {
  return (
    <div className="bi">
      <div style={{ fontSize: 13 }}>{ico}</div>
      <div><div className="bin">{name}</div><div className="bit">{note}</div></div>
    </div>
  );
}

function LiveStrip({ s, price, chg, ts, onRefresh }) {
  return (
    <div className="ls">
      <span style={{ fontSize: 11, color: C.t3 }}>מחיר עדכני:</span>
      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 20, fontWeight: 900, color: s.color }}>{price}</span>
      {chg && <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, padding: "2px 7px", borderRadius: 4, background: chg.startsWith("+") ? "rgba(0,212,126,.12)" : "rgba(255,61,90,.12)", color: chg.startsWith("+") ? C.grn : C.red }}>{chg}</span>}
      <span style={{ fontSize: 9, color: C.t3, marginRight: "auto" }}>{ts || "לחץ לרענון"}</span>
      <button className="rn-btn" style={{ borderColor: s.color + "44", color: s.color }} onClick={onRefresh}>🔄 רענן</button>
    </div>
  );
}

function StockPage({ s, livePx, liveChg, liveTs, onRefresh }) {
  const px = livePx || s.price;
  return (
    <div className="inner">
      <div className="hero" style={{ background: `linear-gradient(135deg,${s.color}0d,${s.color}05)` }}>
        <div className="htopline" style={{ background: s.color }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 11, background: s.color + "25", border: `1px solid ${s.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: s.color, fontSize: 10, fontWeight: 900, fontFamily: "JetBrains Mono" }}>{s.tk}</span>
            </div>
            <div>
              <div style={{ background: s.bg, color: s.color, fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, display: "inline-block", marginBottom: 4 }}>{s.tk}</div>
              <div style={{ fontSize: 21, fontWeight: 900, letterSpacing: -.4, marginBottom: 3 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: C.t2 }}>{s.desc}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 7 }}>
                {s.tags.map(([cl, t], i) => <span key={i} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, fontWeight: 600, background: cl + "18", color: cl, border: `1px solid ${cl}40` }}>{t}</span>)}
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 30, fontWeight: 900, letterSpacing: -1, color: s.color, textAlign: "left" }}>{px}</div>
            <div style={{ fontSize: 10, color: C.t2, textAlign: "left", marginTop: 3 }}>P/E {s.pe} · Beta {s.beta}</div>
          </div>
        </div>
        <LiveStrip s={s} price={px} chg={liveChg} ts={liveTs} onRefresh={onRefresh} />
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, color: C.t3, fontWeight: 600, marginBottom: 4 }}>52 WEEK RANGE — {s.w52l} → (שיא)</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "JetBrains Mono", fontSize: 10, color: C.t3, marginBottom: 4 }}>
            <span>{s.w52l}</span><span style={{ color: s.color }}>● {px}</span><span>שיא</span>
          </div>
          <div style={{ height: 6, background: C.b1, borderRadius: 3, position: "relative" }}>
            <div style={{ height: "100%", borderRadius: 3, background: "linear-gradient(90deg,#ff3d5a,#f59e0b,#00d47e)" }} />
            <div style={{ width: 12, height: 12, background: "#fff", borderRadius: "50%", position: "absolute", top: -3, left: s.w52p + "%", transform: "translateX(-50%)", border: "2px solid var(--bg)", boxShadow: `0 0 0 2px ${C.blu}` }} />
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="panel">
          <div className="sec"><span className="secb" style={{ background: C.grn }} />שולי רווח + ROE</div>
          {s.margins.map(([l, v, c, p], i) => <MarginBar key={i} label={l} val={v} color={c} pct={p} />)}
        </div>
        <div className="panel">
          <div className="sec"><span className="secb" style={{ background: C.amb }} />מאזן · D/E · FCF</div>
          <div className="bsg">{s.bs.map(([l, v, c], i) => <BSItem key={i} label={l} val={v} color={c} />)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="sec"><span className="secb" style={{ background: C.gld }} />הנהלה · מנכ"ל</div>
        <div style={{ padding: "9px 12px", background: C.s3, borderRadius: 8, fontSize: 12, color: C.t2, lineHeight: 1.75 }}>
          <strong style={{ color: C.t1 }}>{s.ceo}</strong>
        </div>
      </div>

      <div className="panel">
        <div className="sec"><span className="secb" style={{ background: C.gld }} />הערכת שווי וורן באפט</div>
        <div className="buff-g">{s.bc.map(([ico, n, t], i) => <BuffettItem key={i} ico={ico} name={n} note={t} />)}</div>
        <div className="buff-tot">
          <div>
            <div style={{ fontSize: 34, fontWeight: 900, fontFamily: "JetBrains Mono", letterSpacing: -2, color: s.buffC }}>{s.buff}</div>
            <div style={{ fontSize: 9, color: C.t3 }}>מתוך 9.0</div>
          </div>
          <div>
            <div style={{ fontSize: 15, color: C.gld }}>{s.buffS}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: s.buffC }}>{s.buffV}</div>
          </div>
        </div>
      </div>

      <div className="g2">
        <div className="panel hig">
          <div className="sec"><span className="secb" style={{ background: C.grn }} />יתרונות תחרותיים</div>
          {s.adv.map((a, i) => <div key={i} className="ai-item"><div className="dot" style={{ background: C.grn }} /><span>{a}</span></div>)}
        </div>
        <div className="panel hir">
          <div className="sec"><span className="secb" style={{ background: C.red }} />סיכונים עיקריים</div>
          {s.risks.map((r, i) => <div key={i} className="ri-item"><div className="dot" style={{ background: C.red }} /><span>{r}</span></div>)}
        </div>
      </div>

      <div className="kpig">
        {s.kpis.map(([k, v, sub], i) => (
          <div key={i} className="kpi">
            <div className="kl">{k}</div>
            <div className="kv" style={{ color: s.color }}>{v}</div>
            <div className="ks">{sub}</div>
          </div>
        ))}
      </div>

      <div className="verd" style={{ background: s.color + "0a", borderColor: s.color + "44" }}>
        <div style={{ fontSize: 24 }}>{s.rec.includes("SPEC") ? "🟣" : s.rec.includes("BUY") ? "🟢" : "🟡"}</div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, fontFamily: "JetBrains Mono", letterSpacing: -.4, color: s.color }}>{s.verdict}</div>
          <div style={{ fontSize: 11, color: C.t2, marginTop: 4, lineHeight: 1.65 }}>{s.thesis}</div>
        </div>
      </div>

      <div className="panel">
        <div className="sec"><span className="secb" style={{ background: C.grn }} />פעולה</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 7 }}>
          {[["כניסה", s.entry, C.grn], ["Stop Loss", s.stop, C.red], ["יעד 12M", s.target, s.color], ["פוזיציה", s.pos, C.amb]].map(([l, v, c]) => (
            <div key={l} className="ag">
              <div className="agl">{l}</div>
              <div className="agv" style={{ color: c }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Overview({ stocks, prices, onCardClick }) {
  const pris = [
    ["META", "#3d8bff", "PEG 0.94, FCF $46B, Buffett 8.0/9. Best Idea. Earnings 29 אפר׳. כנס 20-25%."],
    ["MSFT", "#4f8eff", "▼24% מהשיא, D/E 0.15, FCF $77B, Backlog $625B. Earnings 29 אפר׳. כנס 15-20%."],
    ["AMZN", "#f5a623", "AWS $200B+ Backlog, Ads $75B. Earnings 29 אפר׳. כנס 12-15%."],
    ["CEG", "#06b6d4", "גרעין #1, RSI Oversold ~38, EPS $11-12. BUY יעד $367."],
    ["IBIT", "#fbbf24", "Halving 50%, BTC $76K. Accumulate dips $38-48."],
    ["VCX", "#a855f7", "Anthropic+OpenAI+SpaceX pre-IPO. ≤7% ספקולציה."],
    ["DRAM", "#e879f9", "Memory ETF +100%. P/E 6.4x. כנס בתיקון $42-46 בלבד. ≤8%."],
  ];
  return (
    <div className="inner">
      <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -.5, marginBottom: 5 }}>
        תיק השקעות — <span style={{ color: C.blu }}>7 נכסים</span>
      </div>
      <div style={{ fontSize: 11, color: C.t2, marginBottom: 14 }}>
        D/E · שולי רווח · ROE · FCF · מאזן · Buffett · מנכ"ל · יתרונות · סיכונים · מחירים בזמן אמת
      </div>
      <div className="cards">
        {stocks.map(s => (
          <div key={s.id} className="card" onClick={() => onCardClick(s.id)}>
            <div className="ctop" style={{ background: s.color }} />
            <div className="ntk" style={{ background: s.bg, color: s.color, marginBottom: 7 }}>{s.tk}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 900, color: s.color, marginBottom: 3 }}>
              {prices[s.tk]?.px || s.price}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, display: "inline-block", marginBottom: 6, background: s.color + "18", color: s.recC }}>{s.rec}</div>
            <div style={{ fontSize: 10, color: C.t2, lineHeight: 1.45, marginBottom: 5 }}>{s.what}</div>
            <div style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: s.recC }}>יעד {s.target}</div>
          </div>
        ))}
      </div>
      <div className="tbl-w">
        <table className="tbl">
          <thead>
            <tr>
              <th>מניה</th><th>מחיר</th><th>שם</th><th>שווי</th><th>P/E</th><th>המלצה</th><th>יעד</th><th>פוזיציה</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(s => (
              <tr key={s.id} style={{ cursor: "pointer" }} onClick={() => onCardClick(s.id)}>
                <td><span className="ntk" style={{ background: s.bg, color: s.color }}>{s.tk}</span></td>
                <td style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: s.color }}>{prices[s.tk]?.px || s.price}</td>
                <td style={{ color: C.t2 }}>{s.name}</td>
                <td style={{ color: C.t2 }}>{s.cap}</td>
                <td style={{ fontFamily: "JetBrains Mono", color: C.t2 }}>{s.pe}</td>
                <td style={{ fontWeight: 700, fontSize: 10, color: s.recC }}>{s.rec}</td>
                <td style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: C.grn }}>{s.target}</td>
                <td style={{ fontFamily: "JetBrains Mono", color: C.amb }}>{s.pos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div className="sec"><span className="secb" style={{ background: C.grn }} />סדר עדיפויות</div>
        {pris.map(([tk, cl, txt], i) => (
          <div key={i} className="pri-item" style={{ background: cl + "08", borderColor: cl + "22" }}>
            <span style={{ fontSize: 16, fontWeight: 900, fontFamily: "JetBrains Mono", color: cl, minWidth: 20 }}>#{i + 1}</span>
            <span><strong style={{ color: cl }}>{tk}</strong> — {txt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmartAI({ stocks }) {
  const [newsSelected, setNewsSelected] = useState(new Set(stocks.map(s => s.tk)));
  const [anomSelected, setAnomSelected] = useState(new Set(stocks.map(s => s.tk)));
  const [thesisTkr, setThesisTkr] = useState("META");
  const [newsOut, setNewsOut] = useState("בחר מניות ולחץ...");
  const [anomOut, setAnomOut] = useState("לחץ לסריקה...");
  const [thesisOut, setThesisOut] = useState("בחר מניה ולחץ...");
  const [rankOut, setRankOut] = useState(null);
  const [loading, setLoading] = useState({});

  const setLoad = (k, v) => setLoading(p => ({ ...p, [k]: v }));

  const toggleTkr = (set, setFn, tk) => {
    const next = new Set(set);
    next.has(tk) ? next.delete(tk) : next.add(tk);
    setFn(next);
  };

  async function runNews() {
    const tkrs = [...newsSelected];
    if (!tkrs.length) return;
    setLoad("news", true); setNewsOut("מחפש...");
    try {
      const r = await callClaude(
        "אנליסט. עברית. 2-3 נקודות לכל מניה, 48-72 שעות. **TICKER**: 🟢חיובי / 🔴שלילי / ⚠️ניטרלי",
        `חדשות (earnings, upgrades, news) עבור: ${tkrs.join(", ")}. תאריך: ${new Date().toLocaleDateString("he-IL")}.`
      );
      setNewsOut(r);
    } catch(e) { setNewsOut("שגיאה: " + e.message); }
    setLoad("news", false);
  }

  async function runAnomaly() {
    const tkrs = [...anomSelected];
    if (!tkrs.length) return;
    setLoad("anom", true); setAnomOut("סורק...");
    try {
      const r = await callClaude(
        "Anomaly detection. עברית. 🔴חמור / ⚠️חשוד / 🟢תקין. נפח, תנועות, options, insider.",
        `אנומליות 48 שעות: ${tkrs.join(", ")}.`
      );
      setAnomOut(r);
    } catch(e) { setAnomOut("שגיאה: " + e.message); }
    setLoad("anom", false);
  }

  async function runThesis() {
    setLoad("thesis", true); setThesisOut("מרענן...");
    try {
      const r = await callClaude(
        "אנליסט בכיר. רענן תזה 150-200 מילים בעברית. מה השתנה? 🟢BUY/🔴SELL/⚠️HOLD. Conviction 1-10.",
        `תזה: ${THESIS_CTX[thesisTkr]}. חפש ${thesisTkr} חדשות+earnings 30 ימים.`
      );
      setThesisOut(r);
    } catch(e) { setThesisOut("שגיאה: " + e.message); }
    setLoad("thesis", false);
  }

  async function runRanking() {
    setLoad("rank", true); setRankOut(null);
    try {
      const r = await callClaude(
        'דרג 7 נכסים. JSON בלבד: [{"ticker":"X","score":8.5,"reason":"קצר"},...] ממוין desc.',
        "דרג: AMZN(P/E 35x), MSFT(P/E 24x,▼24%), META(PEG 0.94), IBIT(BTC $76K), VCX(VC), CEG(גרעין,RSI38), DRAM(+100%,P/E6.4x)."
      );
      const m = r.match(/\[[\s\S]*?\]/);
      if (m) {
        try {
          const data = JSON.parse(m[0]).sort((a, b) => b.score - a.score);
          setRankOut(data);
        } catch(e2) { setRankOut([{ ticker: "—", score: "—", reason: r }]); }
      } else { setRankOut([{ ticker: "—", score: "—", reason: r }]); }
    } catch(e) { setRankOut([{ ticker: "—", score: "—", reason: "שגיאה: " + e.message }]); }
    setLoad("rank", false);
  }

  const TkrSel = ({ selected, onToggle }) => (
    <div style={{ display: "flex", flexWrap: "wrap", marginBottom: 9 }}>
      {stocks.map(s => (
        <button key={s.tk} className={"ts-btn" + (selected.has(s.tk) ? "" : " off")}
          style={{ borderColor: s.color, color: s.color }}
          onClick={() => onToggle(s.tk)}>
          {s.tk}
        </button>
      ))}
    </div>
  );

  const AICard = ({ icon, title, sub, children }) => (
    <div className="ai-card">
      <div className="ai-head">
        <div style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, background: "rgba(79,142,255,.1)" }}>{icon}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 10, color: C.t3 }}>{sub}</div>
        </div>
      </div>
      <div className="ai-body">{children}</div>
    </div>
  );

  return (
    <div className="inner">
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 5 }}>🤖 Smart AI Dashboard</div>
      <div style={{ fontSize: 11, color: C.t2, marginBottom: 14 }}>חדשות · Anomaly · תזה · דירוג — Claude API + Web Search</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AICard icon="📰" title="מה חדש?" sub="חדשות · Earnings · Upgrades">
          <TkrSel selected={newsSelected} onToggle={tk => toggleTkr(newsSelected, setNewsSelected, tk)} />
          <button className="run-btn" style={{ background: "linear-gradient(135deg,#1b3a6b,#4f8eff)" }} disabled={loading.news} onClick={runNews}>
            {loading.news && <span className="spin" />} 🔍 בדוק עכשיו
          </button>
          <div className="ai-out" dangerouslySetInnerHTML={{ __html: fmtAI(newsOut) }} />
        </AICard>
        <AICard icon="⚠️" title="Anomaly Detection" sub="נפח חריג · מחיר · Options Flow">
          <TkrSel selected={anomSelected} onToggle={tk => toggleTkr(anomSelected, setAnomSelected, tk)} />
          <button className="run-btn" style={{ background: "linear-gradient(135deg,#5c0a18,#ff3d5a)" }} disabled={loading.anom} onClick={runAnomaly}>
            {loading.anom && <span className="spin" />} 🔬 סרוק
          </button>
          <div className="ai-out" dangerouslySetInnerHTML={{ __html: fmtAI(anomOut) }} />
        </AICard>
        <AICard icon="🔄" title="רענון תזה חודשי" sub="עדכון בהתבסס על נתונים חדשים">
          <div style={{ display: "flex", gap: 8, marginBottom: 9, flexWrap: "wrap" }}>
            <select className="sel" value={thesisTkr} onChange={e => setThesisTkr(e.target.value)}>
              {stocks.map(s => <option key={s.tk} value={s.tk}>{s.tk} — {s.name}</option>)}
            </select>
            <button className="run-btn" style={{ background: "linear-gradient(135deg,#5a3500,#f59e0b)", marginBottom: 0 }} disabled={loading.thesis} onClick={runThesis}>
              {loading.thesis && <span className="spin" />} ⚡ רענן
            </button>
          </div>
          <div className="ai-out" dangerouslySetInnerHTML={{ __html: fmtAI(thesisOut) }} />
        </AICard>
        <AICard icon="🏆" title="Smart Ranking" sub="מכפילים + אנליסטים + מומנטום + סנטימנט">
          <button className="run-btn" style={{ background: "linear-gradient(135deg,#0a2a10,#00d47e)" }} disabled={loading.rank} onClick={runRanking}>
            {loading.rank && <span className="spin" />} 📊 עדכן דירוג
          </button>
          <div className="ai-out">
            {rankOut ? rankOut.map((d, i) => {
              const st = STOCKS.find(s => s.tk === d.ticker);
              const cl = st?.color || "#888";
              const sc = parseFloat(d.score || 0);
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: C.s3, borderRadius: 7, marginBottom: 5 }}>
                  <span style={{ fontSize: 15, fontWeight: 900, fontFamily: "JetBrains Mono", color: cl, minWidth: 18 }}>{i + 1}</span>
                  <span className="ntk" style={{ background: st?.bg || "#222", color: cl }}>{d.ticker}</span>
                  <div style={{ flex: 1, height: 4, background: C.b1, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: cl, borderRadius: 2, width: sc * 10 + "%" }} />
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: cl, fontSize: 12, minWidth: 28 }}>{d.score}</span>
                  <span style={{ fontSize: 10, color: C.t2 }}>{d.reason}</span>
                </div>
              );
            }) : <span style={{ color: C.t3 }}>לחץ לדירוג AI חכם...</span>}
          </div>
        </AICard>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("ov");
  const [prices, setPrices] = useState({});
  const [liveTs, setLiveTs] = useState({});
  const [rfLoading, setRfLoading] = useState(false);
  const [tsLabel, setTsLabel] = useState("לחץ לעדכון");

  function goTab(id) { setTab(id); }

  async function refreshAll() {
    setRfLoading(true); setTsLabel("טוען...");
    try {
      const raw = await callClaude(
        "Return ONLY JSON array, no markdown: [{\"ticker\":\"X\",\"price\":\"123.45\",\"change\":\"+1.2%\"},...] for all 7.",
        "Current prices for: AMZN, MSFT, META, IBIT (iShares Bitcoin ETF), VCX (Fundrise Innovation Fund NYSE), CEG (Constellation Energy), DRAM (Roundhill Memory ETF NYSE). Search each now."
      );
      let data = null;
      const m = raw.match(/\[[\s\S]*?\]/);
      if (m) { try { data = JSON.parse(m[0]); } catch(e) {} }
      if (!data) {
        const objs = [...raw.matchAll(/\{[^{}]+\}/g)];
        if (objs.length) { try { data = objs.map(o => JSON.parse(o[0])); } catch(e) {} }
      }
      const ts = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
      if (data && Array.isArray(data)) {
        const next = {};
        const nextTs = {};
        data.forEach(item => {
          if (!item.ticker || !item.price) return;
          const px = "$" + String(item.price).replace("$", "").replace(",", "");
          next[item.ticker] = { px, chg: item.change || "" };
          nextTs[item.ticker] = "⏱ " + ts;
        });
        setPrices(p => ({ ...p, ...next }));
        setLiveTs(t => ({ ...t, ...nextTs }));
      }
      setTsLabel("עודכן " + new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }));
    } catch(e) { setTsLabel("שגיאה — נסה שוב"); }
    setRfLoading(false);
  }

  async function refreshSingle(tkr) {
    const s = STOCKS.find(x => x.tk === tkr);
    try {
      const raw = await callClaude(
        'Return ONLY JSON: {"ticker":"X","price":"123.45","change":"+1.2%"} no markdown.',
        `Current price of ${s?.name || tkr} ticker ${tkr}. ${tkr === "VCX" ? "Search Fundrise Innovation Fund VCX NYSE" : ""} ${tkr === "DRAM" ? "Search Roundhill Memory ETF DRAM NYSE" : ""} Return JSON.`
      );
      const m = raw.match(/\{[\s\S]*?\}/);
      if (m) {
        const d = JSON.parse(m[0]);
        if (d.price) {
          const px = "$" + String(d.price).replace("$", "").replace(",", "");
          const ts = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
          setPrices(p => ({ ...p, [tkr]: { px, chg: d.change || "" } }));
          setLiveTs(t => ({ ...t, [tkr]: "⏱ " + ts }));
        }
      }
    } catch(e) {}
  }

  useEffect(() => { setTimeout(refreshAll, 600); }, []);

  const tabs = [
    { id: "ov", label: "⊞ תיק" },
    ...STOCKS.map(s => ({ id: s.id, label: null, s })),
    { id: "smart", label: "🤖 Smart AI" },
  ];

  const curStock = STOCKS.find(s => s.id === tab);

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* HEADER */}
        <div className="hdr">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="logo">IR</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>יומן תיק — Alpha Research</div>
              <div style={{ fontSize: 9, color: C.t3, letterSpacing: 2 }}>7 נכסים · MAY 2026</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
            <div className="badge" style={{ background: "rgba(0,212,126,.1)", border: "1px solid rgba(0,212,126,.22)", color: C.grn }}><div className="ldot" />Live</div>
            <div className="badge" style={{ background: "rgba(255,61,90,.1)", border: "1px solid rgba(255,61,90,.22)", color: C.red }}>⚡ Earnings 29 אפר' — AMZN·MSFT·META</div>
          </div>
        </div>

        {/* TICKER STRIP */}
        <div className="ticker">
          <button className="rf-btn" disabled={rfLoading} onClick={refreshAll}>
            {rfLoading ? <span className="spin" /> : "⚡"} עדכן מחירים
          </button>
          <span style={{ fontSize: 9, color: C.t3, marginLeft: 8, flexShrink: 0 }}>{tsLabel}</span>
          {STOCKS.map(s => (
            <div key={s.tk} className="tick" onClick={() => goTab(s.id)}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, fontWeight: 700, color: s.color }}>{s.tk}</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: s.color }}>{prices[s.tk]?.px || s.price}</span>
              {prices[s.tk]?.chg && <span style={{ fontFamily: "JetBrains Mono", fontSize: 9, color: prices[s.tk].chg.startsWith("+") ? C.grn : C.red }}>{prices[s.tk].chg}</span>}
            </div>
          ))}
        </div>

        {/* NAV */}
        <nav className="nav">
          <button className={"nb" + (tab === "ov" ? " on" : "")} onClick={() => goTab("ov")}>⊞ תיק</button>
          {STOCKS.map(s => (
            <button key={s.id} className={"nb" + (tab === s.id ? " on" : "")} onClick={() => goTab(s.id)}>
              <span className="ntk" style={{ background: s.bg, color: s.color }}>{s.tk}</span>{s.name}
            </button>
          ))}
          <button className={"nb" + (tab === "smart" ? " on" : "")} onClick={() => goTab("smart")}>
            <span className="ntk" style={{ background: "#0a2a1a", color: C.grn }}>🤖</span>Smart AI
          </button>
        </nav>

        {/* CONTENT */}
        <div className="content">
          {tab === "ov" && <Overview stocks={STOCKS} prices={prices} onCardClick={goTab} />}
          {curStock && (
            <StockPage
              s={curStock}
              livePx={prices[curStock.tk]?.px}
              liveChg={prices[curStock.tk]?.chg}
              liveTs={liveTs[curStock.tk]}
              onRefresh={() => refreshSingle(curStock.tk)}
            />
          )}
          {tab === "smart" && <SmartAI stocks={STOCKS} />}
        </div>
      </div>
    </>
  );
}
