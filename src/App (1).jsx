import React, { useEffect, useMemo, useState } from "react";
import { RequestAccessForm } from "./RequestAccessForm";

/**
 * Phoenix Dispatch Solutions — PDS CPM Calculator Pro (v3+)
 * Vite + React + Tailwind (no backend required)
 *
 * Changes in this build (safe + targeted):
 * - Fixed Monthly calculator math (CPM/Break-even CPM now in $/mile, not cents)
 * - Kept all original fields/styles
 * - Removed the “Loads per Month (projection)” input and the Monthly Projection card from Per‑Load
 * - Added gradient borders + hover glow/scale to landing cards
 */

// ====== AUTH CONFIG ==========================================================
// SHA-256 of master password: "Ri$e@ndH@ul$ecure25"
const STORED_HASH = "e8fd15ce57d31902f1299ebefb48f94616d46f489cab57d50501b815b0181f8c";
const LS_AUTH_KEY = "pds_cpm_auth_v3";
const LS_CODE_KEY = "pds_cpm_session_code_v1";

// ====== STATE FUEL PRICES (EDITABLE) =========================================
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
  const bytes = new Uint8Array(3);
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

// ====== AUTH GATE ============================================================
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

// ====== SHARED FUEL PICKER ===================================================
function FuelPicker({ stateCode, setStateCode, price, setPrice, mpg, setMpg, miles, setMiles, milesLabel="Miles (this load)" }) {
  return (
    <div className="grid sm:grid-cols-3 gap-3">
      <Field label={milesLabel} hint={milesLabel.includes("Monthly") ? "" : "Hub miles inc. deadhead if desired"}>
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
          <select value={stateCode} onChange={e=>{ const sc = e.target.value; setStateCode(sc); if (STATE_DIESEL_PRICE_USD[sc] != null) setPrice(String(STATE_DIESEL_PRICE_USD[sc])); }} className="rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3">
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

// ====== PER-LOAD CALCULATOR ==================================================
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
  }, [gross, acc, truck, trail, ins, mpg, miles, stateCode, price, driver, maint, misc]);

  const totals = useMemo(() => {
    const p = {
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
    };

    const fuelCost = p.mpg > 0 ? (p.miles / p.mpg) * p.price : 0;
    const totalExpenses = p.truck + p.trail + p.ins + fuelCost + p.maint + p.misc + p.driver;
    const grossTotal = p.gross + p.acc;
    const netProfit = grossTotal - totalExpenses;

    // $ per mile (not cents)
    const actualCPM = p.miles > 0 ? grossTotal / p.miles : 0;      // revenue per mile
    const breakEvenCPM = p.miles > 0 ? totalExpenses / p.miles : 0; // cost per mile

    return { fuelCost, totalExpenses, grossTotal, netProfit, actualCPM, breakEvenCPM };
  }, [gross, acc, truck, trail, ins, mpg, miles, price, driver, maint, misc]);

  const reset = () => {
    setGross(""); setAcc(""); setTruck(""); setTrail(""); setIns(""); setMpg("7");
    setMiles(""); setStateCode(""); setPrice(""); setDriver(""); setMaint(""); setMisc("");
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
          <div className="flex gap-3 items-end">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-900">Reset</button>
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
            <Stat label="Actual CPM" value={isFinite(totals.actualCPM) ? totals.actualCPM.toFixed(2) : "—"} />
            <Stat label="Break-even CPM" value={isFinite(totals.breakEvenCPM) ? totals.breakEvenCPM.toFixed(2) : "—"} />
          </div>
        </div>
        <RequestAccessForm />
      </div>
    </div>
  );
}

// ====== MONTHLY CALCULATOR ===================================================
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

  // ✅ Correct monthly math (all $/mile in dollars, not cents)
  const totals = useMemo(() => {
    const p = {
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

    const fuelCost = p.mpg > 0 ? (p.miles / p.mpg) * p.price : 0;
    const expenses = p.truck + p.trail + p.ins + fuelCost + p.maint + p.misc + p.driver;
    const net = p.gross - expenses;

    const actualCPM = p.miles > 0 ? p.gross / p.miles : 0;      // revenue per mile
    const beCpm = p.miles > 0 ? expenses / p.miles : 0;         // cost per mile
    const margin = p.gross > 0 ? (net / p.gross) * 100 : 0;

    return { fuelCost, expenses, net, cpm: actualCPM, beCpm, margin };
  }, [gross, miles, truck, trail, ins, mpg, price, driver, maint, misc]);

  const reset = () => {
    setGross(""); setMiles(""); setTruck(""); setTrail(""); setIns(""); setMpg("7"); setStateCode("");
    setPrice(""); setDriver(""); setMaint(""); setMisc("");
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
            <FuelPicker
              stateCode={stateCode} setStateCode={setStateCode}
              price={price} setPrice={setPrice}
              mpg={mpg} setMpg={setMpg}
              miles={miles} setMiles={setMiles}
              milesLabel="Miles (Monthly Total)"
            />
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
            <Stat label="Actual CPM" value={isFinite(totals.cpm) ? totals.cpm.toFixed(2) : "—"} />
            <Stat label="Break-even CPM" value={isFinite(totals.beCpm) ? totals.beCpm.toFixed(2) : "—"} />
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
            {/* Per-Load Card */}
            <div className="rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px]">
              <div className="rounded-2xl bg-neutral-950 p-6 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,100,0,0.4)]">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Per-Load CPM Calculator</h2>
                  <p className="text-neutral-400 text-sm">Build a load-level pro forma: fuel, driver pay, fixed costs per load, and real CPM.</p>
                </div>
                <button onClick={()=>setMode("perload")} className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Start</button>
              </div>
            </div>
            {/* Monthly Card */}
            <div className="rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px]">
              <div className="rounded-2xl bg-neutral-950 p-6 flex flex-col justify-between transition-transform duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(255,100,0,0.4)]">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Monthly Expense CPM</h2>
                  <p className="text-neutral-400 text-sm">Enter monthly totals to see net profit, CPM, break-even CPM, and margin.</p>
                </div>
                <button onClick={()=>setMode("monthly")} className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Start</button>
              </div>
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
