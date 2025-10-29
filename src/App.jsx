import React, { useEffect, useMemo, useState } from "react";

/**
 * Phoenix Dispatch Solutions — PDS CPM Calculator Pro (v3+)
 * Vite + React + Tailwind (no backend required)
 *
 * Features
 * - 🔐 Master password gate (client-side hash)
 * - 🔑 Random per-session access code (shared login option)
 * - 📨 "Request Access" email capture (EmailJS placeholders)
 * - 🧮 Dual calculators: Per-Load & Monthly
 * - ⛽ State-based fuel price selector (uses editable in-app table; manual override available)
 * - 📄 Print/Download (window.print())
 * - 💾 LocalStorage caching of inputs
 *
 * NOTES ABOUT FUEL PRICES
 * EIA's official API usually requires an API key. To keep this 100% free & client-only,
 * this app ships with an editable, in-code state price table (STATE_DIESEL_PRICE_USD).
 * You can update it anytime (e.g., on Mondays) or wire in your own fetch if you later use
 * an API key or host your JSON.
 *
 * SECURITY NOTE
 * This is a static app. The password gate and session codes are client-side convenience gates.
 * For true security (revocable users, expiring links, analytics), add an AWS backend later.
 */

// ====== AUTH CONFIG ==========================================================
// SHA-256 of master password: "Ri$e@ndH@ul$ecure25"
const STORED_HASH = "e8fd15ce57d31902f1299ebefb48f94616d46f489cab57d50501b815b0181f8c";
const LS_AUTH_KEY = "pds_cpm_auth_v3";
const LS_CODE_KEY = "pds_cpm_session_code_v1";

// ====== EMAILJS PLACEHOLDERS =================================================
// Replace with your EmailJS values (https://www.emailjs.com/)
const EMAILJS_SERVICE_ID = "YOUR_EMAILJS_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_EMAILJS_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_EMAILJS_PUBLIC_KEY";

// ====== STATE FUEL PRICES (EDITABLE) =========================================
// Default values are placeholders. Update them weekly from DOE/EIA weekly diesel report.
// Prices are in USD per gallon.
const STATE_DIESEL_PRICE_USD = {
  AL: 3.85, AK: 4.25, AZ: 3.97, AR: 3.79, CA: 5.12, CO: 4.01, CT: 4.19, DE: 3.99, DC: 4.25,
  FL: 3.95, GA: 3.89, HI: 5.20, ID: 4.09, IL: 4.15, IN: 3.99, IA: 3.92, KS: 3.80, KY: 3.88,
  LA: 3.78, ME: 4.05, MD: 3.99, MA: 4.02, MI: 3.98, MN: 3.90, MS: 3.77, MO: 3.76, MT: 4.02,
  NE: 3.85, NV: 4.35, NH: 4.01, NJ: 3.99, NM: 3.95, NY: 4.15, NC: 3.89, ND: 3.92, OH: 3.92,
  OK: 3.76, OR: 4.25, PA: 4.28, RI: 4.01, SC: 3.84, SD: 3.92, TN: 3.86, TX: 3.78, UT: 4.02,
  VT: 4.05, VA: 3.90, WA: 4.70, WV: 3.98, WI: 3.88, WY: 3.95,
};

// ====== UTILS ================================================================
async function sha256Hex(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function currency(n) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function genSessionCode() {
  const bytes = new Uint8Array(3); // 24 bits ~ up to 16m: plenty for 6 digits
  crypto.getRandomValues(bytes);
  const num = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  const six = (num % 1000000).toString().padStart(6, "0");
  return `PDS-${six}`;
}

// ====== UI PRIMITIVES ========================================================
function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-300">{label}</span>
      {children}
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </label>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="text-neutral-400 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-neutral-400 text-xs">{sub}</div>}
    </div>
  );
}

// ====== AUTH GATE & ACCESS FLOW =============================================
function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(LS_AUTH_KEY);
    if (token && token === STORED_HASH) onUnlock();
  }, [onUnlock]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const h = await sha256Hex(password);
      if (h === STORED_HASH) {
        localStorage.setItem(LS_AUTH_KEY, h);
        onUnlock();
      } else setError("Incorrect password.");
    } catch {
      setError("Crypto unsupported in this browser.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px] rounded-3xl shadow-2xl">
          <div className="bg-neutral-950 rounded-3xl p-8">
            <h1 className="text-xl font-bold">PDS CPM Calculator Pro (v3+)</h1>
            <p className="text-sm text-neutral-400 mb-4">Secure Access</p>
            <form onSubmit={submit} className="space-y-3">
              <input type="password" className="w-full rounded-xl bg-neutral-900 border border-neutral-700 px-4 py-3 focus:ring-2 focus:ring-orange-400" placeholder="Enter master password" value={password} onChange={e=>setPassword(e.target.value)} />
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <button className="w-full rounded-xl py-3 font-semibold bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 text-neutral-950">{loading?"Checking…":"Unlock"}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessBar({ onLock, sessionCode, onRefreshCode }) {
  return (
    <div className="bg-neutral-950/70 backdrop-blur border-b border-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:gap-6 md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 rounded-xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 items-center justify-center font-black">🔥</span>
          <div>
            <div className="font-semibold">PDS CPM Calculator Pro (v3+)</div>
            <div className="text-xs text-neutral-400 -mt-0.5">Rising Above, Soaring Beyond</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">🔑 Access Code: <span className="font-mono">{sessionCode}</span></div>
          <button onClick={onRefreshCode} className="text-xs px-3 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900">New Code</button>
          <button onClick={onLock} className="text-xs px-3 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900">Lock</button>
          <button onClick={()=>window.print()} className="text-xs px-3 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900">Print/Save PDF</button>
        </div>
      </div>
    </div>
  );
}

function RequestAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      // Lazy-load EmailJS only when needed to keep initial bundle small
      const emailjs = await import("@emailjs/browser");
      await emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        name, email, company, notes, submitted_at: new Date().toISOString()
      });
      setStatus("ok");
    } catch (err) {
      console.error(err);
      setStatus("err");
    }
  };

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-5">
      <h3 className="font-semibold mb-2">Request Access Link</h3>
      <p className="text-sm text-neutral-400 mb-3">Enter your details and we'll email your dispatcher to issue a new access code.</p>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
        <input className="rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 sm:col-span-2" placeholder="Company (optional)" value={company} onChange={e=>setCompany(e.target.value)} />
        <textarea className="rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3 sm:col-span-2" placeholder="Notes (e.g., load info, availability)" value={notes} onChange={e=>setNotes(e.target.value)} />
        <div className="sm:col-span-2 flex gap-3 items-center">
          <button className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-900">Send Request</button>
          {status === "sending" && <span className="text-xs text-neutral-400">Sending…</span>}
          {status === "ok" && <span className="text-xs text-green-400">Sent! Check your email.</span>}
          {status === "err" && <span className="text-xs text-red-400">Error sending. Check EmailJS keys.</span>}
        </div>
      </form>
    </div>
  );
}

// ====== CALCULATORS ==========================================================
function FuelPicker({ stateCode, setStateCode, price, setPrice, mpg, setMpg, miles, setMiles }) {
  // show state select + manual override
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Field label="Miles (this load)" hint="Hub miles inc. deadhead if desired">
        <input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={miles} onChange={e=>setMiles(e.target.value)} />
      </Field>
      <Field label="MPG (loaded avg)">
        <input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={mpg} onChange={e=>setMpg(e.target.value)} />
      </Field>
      <Field label="Fuel Price ($/gal)" hint="Auto-filled by state; you can override">
        <input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={price} onChange={e=>setPrice(e.target.value)} step="0.01" />
      </Field>
      <div className="sm:col-span-3">
        <div className="flex items-center gap-3">
          <select value={stateCode} onChange={e=>{
            const sc = e.target.value; setStateCode(sc); if (STATE_DIESEL_PRICE_USD[sc] != null) setPrice(String(STATE_DIESEL_PRICE_USD[sc]));
          }} className="rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3">
            <option value="">Select state for auto price…</option>
            {Object.keys(STATE_DIESEL_PRICE_USD).sort().map(sc => (
              <option key={sc} value={sc}>{sc} — ${STATE_DIESEL_PRICE_USD[sc].toFixed(2)}</option>
            ))}
          </select>
          <div className="text-xs text-neutral-500">Pick state to auto-fill price (editable).</div>
        </div>
      </div>
    </div>
  );
}

function PerLoadCalculator({ cacheKey = "perload_v1" }) {
  const [gross, setGross] = useState(localStorage.getItem(`${cacheKey}_gross`) || "");
  const [acc, setAcc] = useState(localStorage.getItem(`${cacheKey}_acc`) || "");
  const [truck, setTruck] = useState(localStorage.getItem(`${cacheKey}_truck`) || "");
  const [trail, setTrail] = useState(localStorage.getItem(`${cacheKey}_trail`) || "");
  const [ins, setIns] = useState(localStorage.getItem(`${cacheKey}_ins`) || "");
  const [mpg, setMpg] = useState(localStorage.getItem(`${cacheKey}_mpg`) || "7");
  const [miles, setMiles] = useState(localStorage.getItem(`${cacheKey}_miles`) || "");
  const [stateCode, setStateCode] = useState(localStorage.getItem(`${cacheKey}_state`) || "");
  const [price, setPrice] = useState(localStorage.getItem(`${cacheKey}_price`) || "");
  const [driver, setDriver] = useState(localStorage.getItem(`${cacheKey}_driver`) || "");
  const [maint, setMaint] = useState(localStorage.getItem(`${cacheKey}_maint`) || "");
  const [misc, setMisc] = useState(localStorage.getItem(`${cacheKey}_misc`) || "");
  const [loadsPerMonth, setLoadsPerMonth] = useState(localStorage.getItem(`${cacheKey}_lpm`) || "12");

  useEffect(() => {
    localStorage.setItem(`${cacheKey}_gross`, gross);
    localStorage.setItem(`${cacheKey}_acc`, acc);
    localStorage.setItem(`${cacheKey}_truck`, truck);
    localStorage.setItem(`${cacheKey}_trail`, trail);
    localStorage.setItem(`${cacheKey}_ins`, ins);
    localStorage.setItem(`${cacheKey}_mpg`, mpg);
    localStorage.setItem(`${cacheKey}_miles`, miles);
    localStorage.setItem(`${cacheKey}_state`, stateCode);
    localStorage.setItem(`${cacheKey}_price`, price);
    localStorage.setItem(`${cacheKey}_driver`, driver);
    localStorage.setItem(`${cacheKey}_maint`, maint);
    localStorage.setItem(`${cacheKey}_misc`, misc);
    localStorage.setItem(`${cacheKey}_lpm`, loadsPerMonth);
  }, [gross, acc, truck, trail, ins, mpg, miles, stateCode, price, driver, maint, misc, loadsPerMonth]);

  const parsed = {
    gross: parseFloat(gross) || 0,
    acc: parseFloat(acc) || 0,
    truck: parseFloat(truck) || 0,
    trail: parseFloat(trail) || 0,
    ins: parseFloat(ins) || 0,
    mpg: parseFloat(mpg) || 0,
    miles: parseFloat(miles) || 0,
    price: parseFloat(price) || 0,
    driver: parseFloat(driver) || 0,
    maint: parseFloat(maint) || 0,
    misc: parseFloat(misc) || 0,
    lpm: parseFloat(loadsPerMonth) || 0,
  };

  const totals = useMemo(() => {
    const fuelCost = parsed.mpg > 0 ? (parsed.miles / parsed.mpg) * parsed.price : NaN;
    const totalExpenses = parsed.truck + parsed.trail + parsed.ins + (isFinite(fuelCost) ? fuelCost : 0) + parsed.maint + parsed.misc + parsed.driver;
    const grossTotal = parsed.gross + parsed.acc;
    const netProfit = grossTotal - totalExpenses;
    const actualRPM = parsed.miles > 0 ? grossTotal / parsed.miles : NaN;
    const actualCPM = isFinite(actualRPM) ? actualRPM * 100 : NaN;
    const breakEvenRPM = parsed.miles > 0 ? totalExpenses / parsed.miles : NaN;
    const breakEvenCPM = isFinite(breakEvenRPM) ? breakEvenRPM * 100 : NaN;

    // Monthly projection
    const monthlyGross = isFinite(parsed.lpm) ? grossTotal * parsed.lpm : NaN;
    const monthlyNet = isFinite(parsed.lpm) ? netProfit * parsed.lpm : NaN;
    const monthlyMiles = isFinite(parsed.lpm) ? parsed.miles * parsed.lpm : NaN;
    const monthlyCPM = isFinite(monthlyMiles) && monthlyMiles > 0 ? (monthlyGross / monthlyMiles) * 100 : NaN;

    return { fuelCost, totalExpenses, grossTotal, netProfit, actualCPM, breakEvenCPM, monthlyGross, monthlyNet, monthlyMiles, monthlyCPM };
  }, [parsed]);

  const reset = () => {
    setGross(""); setAcc(""); setTruck(""); setTrail(""); setIns(""); setMpg("7"); setMiles(""); setStateCode(""); setPrice(""); setDriver(""); setMaint(""); setMisc(""); setLoadsPerMonth("12");
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Income</h2>
          <Field label="Gross / Linehaul ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={gross} onChange={e=>setGross(e.target.value)} placeholder="e.g., 1850"/></Field>
          <Field label="Accessorials ($)" hint="Detention, layover, TONU, lumper"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={acc} onChange={e=>setAcc(e.target.value)} placeholder="e.g., 150"/></Field>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Expenses (Per Load)</h2>
          <Field label="Truck Payment ($)" hint="Weekly note / expected loads this week"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={truck} onChange={e=>setTruck(e.target.value)} /></Field>
          <Field label="Trailer Payment ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={trail} onChange={e=>setTrail(e.target.value)} /></Field>
          <Field label="Insurance ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={ins} onChange={e=>setIns(e.target.value)} /></Field>
          <div>
            <div className="text-sm text-neutral-300 mb-2">Fuel (auto)</div>
            <FuelPicker stateCode={stateCode} setStateCode={setStateCode} price={price} setPrice={setPrice} mpg={mpg} setMpg={setMpg} miles={miles} setMiles={setMiles} />
            <div className="text-xs text-neutral-500 mt-2">Fuel Cost auto = (Miles ÷ MPG) × Price</div>
          </div>
          <Field label="Driver Pay Goal ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={driver} onChange={e=>setDriver(e.target.value)} /></Field>
          <Field label="Maintenance ($)" hint="Oil, tires, DEF, set-aside per load"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={maint} onChange={e=>setMaint(e.target.value)} /></Field>
          <Field label="Miscellaneous ($)" hint="Food, parking, tolls, 2290, permits"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={misc} onChange={e=>setMisc(e.target.value)} /></Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Loads per Month (projection)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={loadsPerMonth} onChange={e=>setLoadsPerMonth(e.target.value)} /></Field>
            <div className="flex items-end"><button onClick={reset} className="w-full rounded-lg border border-neutral-700 px-4 py-2 hover:bg-neutral-900">Reset</button></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Per-Load Results</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Fuel Cost" value={currency(totals.fuelCost)} />
            <Stat label="Total Expenses" value={currency(totals.totalExpenses)} />
            <Stat label="Gross (incl. access.)" value={currency(totals.grossTotal)} />
            <Stat label="Net Profit" value={currency(totals.netProfit)} />
            <Stat label="Actual CPM" value={isFinite(totals.actualCPM) ? totals.actualCPM.toFixed(1) : "—"} />
            <Stat label="Break-even CPM" value={isFinite(totals.breakEvenCPM) ? totals.breakEvenCPM.toFixed(1) : "—"} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px] rounded-2xl">
          <div className="bg-neutral-950 rounded-2xl p-5">
            <h3 className="font-semibold">Monthly Projection (Based on Per-Load)</h3>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Stat label="Monthly Gross" value={currency(totals.monthlyGross)} />
              <Stat label="Monthly Net" value={currency(totals.monthlyNet)} />
              <Stat label="Monthly Miles" value={isFinite(totals.monthlyMiles) ? totals.monthlyMiles.toLocaleString() : "—"} />
              <Stat label="Monthly CPM" value={isFinite(totals.monthlyCPM) ? totals.monthlyCPM.toFixed(1) : "—"} />
            </div>
          </div>
        </div>
        <RequestAccessForm />
      </div>
    </div>
  );
}

function MonthlyCalculator({ cacheKey = "monthly_v1" }) {
  const [gross, setGross] = useState(localStorage.getItem(`${cacheKey}_gross`) || "");
  const [miles, setMiles] = useState(localStorage.getItem(`${cacheKey}_miles`) || "");
  const [truck, setTruck] = useState(localStorage.getItem(`${cacheKey}_truck`) || "");
  const [trail, setTrail] = useState(localStorage.getItem(`${cacheKey}_trail`) || "");
  const [ins, setIns] = useState(localStorage.getItem(`${cacheKey}_ins`) || "");
  const [mpg, setMpg] = useState(localStorage.getItem(`${cacheKey}_mpg`) || "7");
  const [stateCode, setStateCode] = useState(localStorage.getItem(`${cacheKey}_state`) || "");
  const [price, setPrice] = useState(localStorage.getItem(`${cacheKey}_price`) || "");
  const [driver, setDriver] = useState(localStorage.getItem(`${cacheKey}_driver`) || "");
  const [maint, setMaint] = useState(localStorage.getItem(`${cacheKey}_maint`) || "");
  const [misc, setMisc] = useState(localStorage.getItem(`${cacheKey}_misc`) || "");

  useEffect(() => {
    localStorage.setItem(`${cacheKey}_gross`, gross);
    localStorage.setItem(`${cacheKey}_miles`, miles);
    localStorage.setItem(`${cacheKey}_truck`, truck);
    localStorage.setItem(`${cacheKey}_trail`, trail);
    localStorage.setItem(`${cacheKey}_ins`, ins);
    localStorage.setItem(`${cacheKey}_mpg`, mpg);
    localStorage.setItem(`${cacheKey}_state`, stateCode);
    localStorage.setItem(`${cacheKey}_price`, price);
    localStorage.setItem(`${cacheKey}_driver`, driver);
    localStorage.setItem(`${cacheKey}_maint`, maint);
    localStorage.setItem(`${cacheKey}_misc`, misc);
  }, [gross, miles, truck, trail, ins, mpg, stateCode, price, driver, maint, misc]);

  const parsed = {
    gross: parseFloat(gross) || 0,
    miles: parseFloat(miles) || 0,
    truck: parseFloat(truck) || 0,
    trail: parseFloat(trail) || 0,
    ins: parseFloat(ins) || 0,
    mpg: parseFloat(mpg) || 0,
    price: parseFloat(price) || 0,
    driver: parseFloat(driver) || 0,
    maint: parseFloat(maint) || 0,
    misc: parseFloat(misc) || 0,
  };

  const totals = useMemo(() => {
  const fuelCost = parsed.mpg > 0 ? (parsed.miles / parsed.mpg) * parsed.price : NaN;
  const expenses = parsed.truck + parsed.trail + parsed.ins + (isFinite(fuelCost) ? fuelCost : 0) + parsed.maint + parsed.misc + parsed.driver;
  const net = parsed.gross - expenses;

  // Calculations
  const revenuePerMile = parsed.miles > 0 ? parsed.gross / parsed.miles : NaN;
  const costPerMile = parsed.miles > 0 ? expenses / parsed.miles : NaN;
  const profitPerMile = parsed.miles > 0 ? net / parsed.miles : NaN;

  // Converted to CPM (cents per mile)
  const revenueCPM = isFinite(revenuePerMile) ? revenuePerMile * 100 : NaN;
  const costCPM = isFinite(costPerMile) ? costPerMile * 100 : NaN;
  const profitCPM = isFinite(profitPerMile) ? profitPerMile * 100 : NaN;

  const margin = parsed.gross > 0 ? (net / parsed.gross) * 100 : NaN;

  return { fuelCost, expenses, net, revenueCPM, costCPM, profitCPM, margin };
}, [parsed]);


  const reset = () => {
    setGross(""); setMiles(""); setTruck(""); setTrail(""); setIns(""); setMpg("7"); setStateCode(""); setPrice(""); setDriver(""); setMaint(""); setMisc("");
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Revenue & Miles (Monthly)</h2>
          <Field label="Total Monthly Gross ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={gross} onChange={e=>setGross(e.target.value)} /></Field>
          <Field label="Total Monthly Miles"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={miles} onChange={e=>setMiles(e.target.value)} /></Field>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Expenses (Monthly)</h2>
          <Field label="Truck Payment ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={truck} onChange={e=>setTruck(e.target.value)} /></Field>
          <Field label="Trailer Payment ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={trail} onChange={e=>setTrail(e.target.value)} /></Field>
          <Field label="Insurance ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={ins} onChange={e=>setIns(e.target.value)} /></Field>
          <div>
            <div className="text-sm text-neutral-300 mb-2">Fuel (auto)</div>
            <FuelPicker stateCode={stateCode} setStateCode={setStateCode} price={price} setPrice={setPrice} mpg={mpg} setMpg={setMpg} miles={miles} setMiles={setMiles} />
          </div>
          <Field label="Driver Pay ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={driver} onChange={e=>setDriver(e.target.value)} /></Field>
          <Field label="Maintenance ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={maint} onChange={e=>setMaint(e.target.value)} /></Field>
          <Field label="Miscellaneous ($)"><input type="number" className="mt-1 w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3" value={misc} onChange={e=>setMisc(e.target.value)} /></Field>
          <div className="flex gap-3"><button onClick={reset} className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-900">Reset</button></div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Monthly Results</h2>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Fuel Cost" value={currency(totals.fuelCost)} />
            <Stat label="Total Expenses" value={currency(totals.expenses)} />
            <Stat label="Net Profit" value={currency(totals.net)} />
            <Stat label="Revenue CPM" value={isFinite(totals.revenueCPM) ? totals.revenueCPM.toFixed(1) : "—"} />
            <Stat label="Cost CPM" value={isFinite(totals.costCPM) ? totals.costCPM.toFixed(1) : "—"} />
            <Stat label="Profit CPM" value={isFinite(totals.profitCPM) ? totals.profitCPM.toFixed(1) : "—"} />
            <Stat label="Profit Margin" value={isFinite(totals.margin) ? `${totals.margin.toFixed(1)}%` : "—"} />
          </div>
        </div>
        <RequestAccessForm />
      </div>
    </div>
  );
}

// ====== MAIN APP =============================================================
export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [sessionCode, setSessionCode] = useState(localStorage.getItem(LS_CODE_KEY) || genSessionCode());
  const [mode, setMode] = useState("choose"); // choose | perload | monthly

  useEffect(() => {
    localStorage.setItem(LS_CODE_KEY, sessionCode);
  }, [sessionCode]);

  if (!unlocked) return <PasswordGate onUnlock={() => { setUnlocked(true); setSessionCode(genSessionCode()); }} />;

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <AccessBar
        sessionCode={sessionCode}
        onRefreshCode={() => setSessionCode(genSessionCode())}
        onLock={() => { localStorage.removeItem(LS_AUTH_KEY); localStorage.removeItem(LS_CODE_KEY); location.reload(); }}
      />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {mode === "choose" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px]">
              <div className="rounded-2xl bg-neutral-950 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Per-Load CPM Calculator</h2>
                  <p className="text-neutral-400 text-sm">Build a load-level pro forma: fuel, driver pay, fixed costs per load, and real CPM.</p>
                </div>
                <button onClick={()=>setMode("perload")} className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Start</button>
              </div>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">Monthly Expense CPM</h2>
                <p className="text-neutral-400 text-sm">Enter monthly totals to see net profit, CPM, break-even CPM, and margin.</p>
              </div>
              <button onClick={()=>setMode("monthly")} className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Start</button>
            </div>
          </div>
        )}

        {mode !== "choose" && (
          <div className="flex items-center gap-3">
            <button onClick={()=>setMode("choose")} className="text-xs px-3 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900">← Mode Select</button>
            <div className="text-xs text-neutral-500">Tip: switch modes anytime.</div>
          </div>
        )}

        {mode === "perload" && <PerLoadCalculator />}
        {mode === "monthly" && <MonthlyCalculator />}
      </main>

      <footer className="py-8 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Phoenix Dispatch Solutions — dispatch@riseandhaul.com
      </footer>
    </div>
  );
}
