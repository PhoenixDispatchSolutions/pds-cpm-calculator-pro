
import React, { useState, useEffect, useMemo } from "react";
import { RequestAccessForm } from "./RequestAccessForm";

function currency(n) {
  if (!isFinite(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
      <div className="text-neutral-400 text-xs uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function useCPMCalculator(cacheKey = "cpm_data") {
  const [gross, setGross] = useState(localStorage.getItem(`${cacheKey}_gross`) || "");
  const [truck, setTruck] = useState(localStorage.getItem(`${cacheKey}_truck`) || "");
  const [trail, setTrail] = useState(localStorage.getItem(`${cacheKey}_trail`) || "");
  const [ins, setIns] = useState(localStorage.getItem(`${cacheKey}_ins`) || "");
  const [maint, setMaint] = useState(localStorage.getItem(`${cacheKey}_maint`) || "");
  const [misc, setMisc] = useState(localStorage.getItem(`${cacheKey}_misc`) || "");
  const [driver, setDriver] = useState(localStorage.getItem(`${cacheKey}_driver`) || "");
  const [miles, setMiles] = useState(localStorage.getItem(`${cacheKey}_miles`) || "");
  const [mpg, setMpg] = useState(localStorage.getItem(`${cacheKey}_mpg`) || "");
  const [price, setPrice] = useState(localStorage.getItem(`${cacheKey}_price`) || "");

  useEffect(() => {
    localStorage.setItem(`${cacheKey}_gross`, gross);
    localStorage.setItem(`${cacheKey}_truck`, truck);
    localStorage.setItem(`${cacheKey}_trail`, trail);
    localStorage.setItem(`${cacheKey}_ins`, ins);
    localStorage.setItem(`${cacheKey}_maint`, maint);
    localStorage.setItem(`${cacheKey}_misc`, misc);
    localStorage.setItem(`${cacheKey}_driver`, driver);
    localStorage.setItem(`${cacheKey}_miles`, miles);
    localStorage.setItem(`${cacheKey}_mpg`, mpg);
    localStorage.setItem(`${cacheKey}_price`, price);
  }, [gross, truck, trail, ins, maint, misc, driver, miles, mpg, price, cacheKey]);

  const totals = useMemo(() => {
    const parsed = {
      gross: parseFloat(gross) || 0,
      truck: parseFloat(truck) || 0,
      trail: parseFloat(trail) || 0,
      ins: parseFloat(ins) || 0,
      maint: parseFloat(maint) || 0,
      misc: parseFloat(misc) || 0,
      driver: parseFloat(driver) || 0,
      miles: parseFloat(miles) || 0,
      mpg: parseFloat(mpg) || 0,
      price: parseFloat(price) || 0,
    };

    const fuelCost =
      parsed.mpg > 0 && parsed.price > 0
        ? (parsed.miles / parsed.mpg) * parsed.price
        : 0;

    const totalExpenses =
      parsed.truck +
      parsed.trail +
      parsed.ins +
      parsed.maint +
      parsed.misc +
      parsed.driver +
      fuelCost;

    const netProfit = parsed.gross - totalExpenses;
    const breakEvenCPM = parsed.miles > 0 ? totalExpenses / parsed.miles : 0;
    const margin = parsed.gross > 0 ? (netProfit / parsed.gross) * 100 : 0;

    return { fuelCost, totalExpenses, netProfit, breakEvenCPM, margin };
  }, [gross, truck, trail, ins, maint, misc, driver, miles, mpg, price]);

  const reset = () => {
    setGross("");
    setTruck("");
    setTrail("");
    setIns("");
    setMaint("");
    setMisc("");
    setDriver("");
    setMiles("");
    setMpg("");
    setPrice("");
  };

  return {
    gross, setGross,
    truck, setTruck,
    trail, setTrail,
    ins, setIns,
    maint, setMaint,
    misc, setMisc,
    driver, setDriver,
    miles, setMiles,
    mpg, setMpg,
    price, setPrice,
    totals,
    reset,
  };
}

function PerLoadCalculator() {
  const {
    gross, setGross,
    truck, setTruck,
    trail, setTrail,
    ins, setIns,
    maint, setMaint,
    misc, setMisc,
    driver, setDriver,
    miles, setMiles,
    mpg, setMpg,
    price, setPrice,
    totals,
    reset,
  } = useCPMCalculator("cpm_data");

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Per-Load Inputs</h2>
          <input placeholder="Gross Revenue ($)" value={gross} onChange={(e)=>setGross(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Truck Payment ($)" value={truck} onChange={(e)=>setTruck(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Trailer Payment ($)" value={trail} onChange={(e)=>setTrail(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Insurance ($)" value={ins} onChange={(e)=>setIns(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Maintenance ($)" value={maint} onChange={(e)=>setMaint(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Miscellaneous ($)" value={misc} onChange={(e)=>setMisc(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Driver Pay ($)" value={driver} onChange={(e)=>setDriver(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Miles (this load)" value={miles} onChange={(e)=>setMiles(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Fuel MPG" value={mpg} onChange={(e)=>setMpg(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Fuel Price ($/gal)" value={price} onChange={(e)=>setPrice(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>

          <div className="flex gap-3 mt-4">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800">Reset</button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white">Recalculate</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Clear All</button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px] rounded-2xl">
          <div className="bg-neutral-950 rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold mb-4">Per-Load Results</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Fuel Cost" value={currency(totals.fuelCost)} />
              <Stat label="Total Expenses" value={currency(totals.totalExpenses)} />
              <Stat label="Net Profit" value={currency(totals.netProfit)} />
              <Stat label="Break-Even CPM" value={`$${(totals.breakEvenCPM || 0).toFixed(2)}`} />
              <Stat label="Profit Margin" value={`${(totals.margin || 0).toFixed(1)}%`} />
            </div>
          </div>
        </div>
        <RequestAccessForm />
      </div>
    </div>
  );
}

function MonthlyCalculator() {
  const { gross, setGross, miles, setMiles, totals, reset } = useCPMCalculator("cpm_data");

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Monthly Inputs</h2>
          <input placeholder="Monthly Gross ($)" value={gross} onChange={(e)=>setGross(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>
          <input placeholder="Monthly Miles" value={miles} onChange={(e)=>setMiles(e.target.value)} className="w-full rounded-xl bg-neutral-950 border border-neutral-700 px-4 py-3"/>

          <div className="flex gap-3 mt-4">
            <button onClick={reset} className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-neutral-800">Reset</button>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white">Recalculate</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Clear All</button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px] rounded-2xl">
          <div className="bg-neutral-950 rounded-2xl p-5 shadow-lg">
            <h2 className="font-semibold mb-4">Monthly Results</h2>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total Expenses" value={currency(totals.totalExpenses)} />
              <Stat label="Net Profit" value={currency(totals.netProfit)} />
              <Stat label="Break-Even CPM" value={`$${(totals.breakEvenCPM || 0).toFixed(2)}`} />
              <Stat label="Profit Margin" value={`${(totals.margin || 0).toFixed(1)}%`} />
            </div>
          </div>
        </div>
        <RequestAccessForm />
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("choose");

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {mode === "choose" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-amber-400 p-[1px] transition transform hover:scale-[1.02]">
              <div className="rounded-2xl bg-neutral-950 p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Per-Load CPM Calculator</h2>
                  <p className="text-neutral-400 text-sm">Build a load-level pro forma and see your true CPM.</p>
                </div>
                <button onClick={()=>setMode("perload")} className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Start</button>
              </div>
            </div>
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between transition transform hover:scale-[1.02]">
              <div>
                <h2 className="text-xl font-semibold mb-2">Monthly Expense CPM</h2>
                <p className="text-neutral-400 text-sm">Enter your totals to see monthly net profit and break-even CPM.</p>
              </div>
              <button onClick={()=>setMode("monthly")} className="mt-4 rounded-lg border border-neutral-800 px-4 py-2 hover:bg-neutral-900">Start</button>
            </div>
          </div>
        )}

        {mode !== "choose" && (
          <div className="flex items-center gap-3">
            <button onClick={()=>setMode("choose")} className="text-xs px-3 py-2 rounded-lg border border-neutral-800 hover:bg-neutral-900">← Back</button>
            <div className="text-xs text-neutral-500">Switch calculators anytime</div>
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
