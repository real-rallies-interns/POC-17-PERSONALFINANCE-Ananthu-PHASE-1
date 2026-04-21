'use client';
import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function RealRailsDashboard() {
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activeView, setActiveView] = useState<'history' | 'forecast'>('history');
  const [rightTab, setRightTab] = useState<'LEDGER' | 'INSIGHTS' | 'EXPORT'>('LEDGER');

  useEffect(() => {
    setIsMounted(true);
    fetch('http://127.0.0.1:8000/intelligence/rail-data')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Connection Error:", err));
  }, []);

  const downloadCSV = () => {
    const txs = data.main_stage.transactions;
    const headers = "Date,Merchant,Category,Amount\n";
    const rows = txs.map((t: any) => `${t.date},"${t.name}",${t.category[0]},${t.amount}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RealRails_Retail_Ledger.csv`;
    a.click();
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RealRails_Institutional_Protocol.json`;
    a.click();
  };

  if (!data) return (
    <div className="h-screen bg-[#030712] flex items-center justify-center text-[#38BDF8] font-mono animate-pulse">
      INITIALIZING_FINANCE_RAIL_PROTOCOL...
    </div>
  );

  const sortedChartData = data.main_stage.transactions.slice().sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestDateObj = sortedChartData.length > 0 ? new Date(sortedChartData[sortedChartData.length - 1].date) : new Date();
  const cutoffTime = latestDateObj.getTime() - (timeRange * 24 * 60 * 60 * 1000);

  const dynamicTransactions = sortedChartData.filter((tx: any) => new Date(tx.date).getTime() >= cutoffTime);
  const expenseTransactions = dynamicTransactions.filter((tx: any) => !tx.category.includes('Income'));

  const filteredTableTransactions = data.main_stage.transactions.filter((tx: any) =>
    tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getBankName = (accountId: string) => {
    const act = data.sidebar.accounts.find((a: any) => a.account_id === accountId);
    return act ? act.name : '';
  };

  const dynamicIncome = dynamicTransactions.filter((tx: any) => tx.category.includes('Income')).reduce((sum: number, tx: any) => sum + tx.amount, 0);
  const dynamicOutflow = expenseTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const savingsRate = dynamicIncome > 0 ? ((dynamicIncome - dynamicOutflow) / dynamicIncome) * 100 : 0;
  const topCategory = [...new Set(expenseTransactions.map((t: any) => t.category[0]))]
    .map(cat => ({ name: cat, total: expenseTransactions.filter((t: any) => t.category[0] === cat).reduce((s: number, t: any) => s + t.amount, 0) }))
    .sort((a, b) => b.total - a.total)[0]?.name || "N/A";

  const mockCurrentBalance = 150000;
  const dailyBurnRate = dynamicOutflow / timeRange;
  const dynamicRunway = dailyBurnRate > 0 ? Math.round(mockCurrentBalance / dailyBurnRate) : 999;

  const depletionDate = new Date(new Date().getTime() + (dynamicRunway * 24 * 60 * 60 * 1000));
  const depletionDateString = depletionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const forecastData = [];
  let currentSimBalance = mockCurrentBalance;
  let dayCount = 0;
  const recurringBillsByDay: Record<number, any[]> = {};
  data.sidebar.insights.forEach((sub: any) => {
    const billDay = new Date(sub.last_date).getDate();
    if (!recurringBillsByDay[billDay]) recurringBillsByDay[billDay] = [];
    recurringBillsByDay[billDay].push(sub);
  });
  const dailyNoiseRate = data.sidebar.metrics.daily_noise_rate || dailyBurnRate;
  const currentDate = new Date();
  while (currentSimBalance > 0 && dayCount <= 365) {
    const simDate = new Date(currentDate); simDate.setDate(simDate.getDate() + dayCount);
    const simDayOfMonth = simDate.getDate();
    currentSimBalance -= dailyNoiseRate;
    let billsToday = 0; let billsHit: any[] = [];
    if (recurringBillsByDay[simDayOfMonth]) {
      recurringBillsByDay[simDayOfMonth].forEach(bill => { billsToday += bill.amount; billsHit.push(bill); });
      currentSimBalance -= billsToday;
    }
    forecastData.push({ date: simDate.toISOString().split('T')[0], balance: Math.max(0, currentSimBalance), isBillDay: billsToday > 0, billsHit: billsHit, totalDrainedToday: dailyNoiseRate + billsToday });
    dayCount++;
  }

  const dynamicInsights = data.sidebar.insights.map((sub: any) => {
    const windowTxs = dynamicTransactions.filter((tx: any) => tx.name === sub.name);
    if (windowTxs.length === 0) return null;
    return { ...sub, occurrencesInWindow: windowTxs.length, total_spent_window: windowTxs.reduce((sum: number, tx: any) => sum + tx.amount, 0) };
  }).filter(Boolean);

  const historyDrilldown = selectedDate && activeView === 'history' ? data.main_stage.transactions.filter((tx: any) => tx.date === selectedDate) : [];
  const forecastDrilldown = selectedDate && activeView === 'forecast' ? forecastData.find(d => d.date === selectedDate) : null;

  return (
    <main className="flex flex-col h-screen bg-[#080B12] overflow-hidden text-white font-sans selection:bg-[#06b6d4] selection:text-[#080B12]">

      {selectedDate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#080B12]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className={`bg-[#0A0E17] border ${activeView === 'history' ? 'border-[#06b6d4]/50 shadow-[0_0_40px_rgba(6,182,212,0.15)]' : 'border-[#818CF8]/50 shadow-[0_0_40px_rgba(129,140,248,0.15)]'} rounded-2xl p-8 max-w-md w-full relative`}>
            <button onClick={() => setSelectedDate(null)} className={`absolute top-5 right-5 text-gray-500 transition-colors ${activeView === 'history' ? 'hover:text-[#06b6d4]' : 'hover:text-[#818CF8]'}`}>✕</button>
            <p className={`${activeView === 'history' ? 'text-[#06b6d4]' : 'text-[#818CF8]'} text-[10px] font-bold tracking-[0.2em] uppercase mb-1`}>{activeView === 'history' ? 'Daily Drilldown' : 'Forecasted Drain'}</p>
            <h3 className="text-2xl font-black text-white mb-6">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {activeView === 'history' ? historyDrilldown.map((tx: any) => (
                <div key={tx.transaction_id} className="flex justify-between items-center p-4 bg-[#080B12] border border-[#1F2937] rounded-lg hover:border-[#06b6d4]/30 transition-colors">
                  <div><p className="font-bold text-gray-300">{tx.name}</p><p className="text-[9px] text-gray-500 uppercase mt-0.5">{tx.category[0]}</p></div>
                  <p className={`font-mono font-black text-lg ${tx.category.includes('Income') ? 'text-emerald-400' : 'text-[#06b6d4]'}`}>{tx.category.includes('Income') ? '+' : ''}₹{tx.amount.toFixed(2)}</p>
                </div>
              )) : forecastDrilldown ? (
                <>
                  <div className="flex justify-between items-center p-4 bg-[#080B12] border border-[#1F2937] rounded-lg"><div><p className="font-bold text-gray-300">Daily Average Spend</p></div><p className="font-mono font-black text-gray-400 text-lg">₹{dailyNoiseRate.toFixed(2)}</p></div>
                  {forecastDrilldown.billsHit.map((bill: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-[#080B12] border border-[#ef4444]/50 rounded-lg"><div><p className="font-bold text-white">{bill.name}</p></div><p className="font-mono font-black text-[#ef4444] text-lg">₹{bill.amount.toFixed(2)}</p></div>
                  ))}
                </>
              ) : <p className="text-gray-500 italic text-sm text-center py-4">No activity.</p>}
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="flex-none flex items-center justify-between px-8 py-5 border-b border-[#1F2937] bg-[#0A0E17]">
        <div className="flex flex-col">
          <p className="text-[#06b6d4] text-[10px] font-bold tracking-widest uppercase mb-1">REAL RAILS INTELLIGENCE LIBRARY</p>
          <h1 className="text-white font-bold text-3xl tracking-tight">Finance_Rail</h1>
        </div>
        <div className="flex gap-2">
          {/* Main Layout Tabs */}
          <button onClick={() => setActiveView('history')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all border ${activeView === 'history' ? 'border-[#06b6d4] text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-transparent text-gray-500 hover:text-white border-[#1F2937]'}`}>Historical Flow</button>
          <button onClick={() => setActiveView('forecast')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all border ${activeView === 'forecast' ? 'border-[#818CF8] text-white shadow-[0_0_10px_rgba(129,140,248,0.3)]' : 'border-transparent text-gray-500 hover:text-white border-[#1F2937]'}`}>Runway Forecast</button>
        </div>
      </header>

      {/* TWO PANEL LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* MAIN STAGE (70%) */}
        <section className="w-[70%] bg-[#040608] relative overflow-hidden flex flex-col pt-6 pb-2">

          <div className="flex flex-col items-start gap-3 px-8 shrink-0 z-10">
            <div>
              <p className={`${activeView === 'history' ? 'text-[#06b6d4]' : 'text-[#818CF8]'} text-[10px] font-bold tracking-widest uppercase opacity-80`}>{activeView === 'history' ? `${timeRange}D_SPENDING_VELOCITY` : 'DETERMINISTIC_MODELING'}</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{activeView === 'history' ? 'Institutional Flow' : 'Cash Runway Burn-Down'}</h3>
            </div>
            {activeView === 'history' && (
              <div className="flex gap-2 bg-[#080B12] p-1 border border-[#1F2937] rounded-lg">
                {[7, 30, 60, 90].map(days => (
                  <button key={days} onClick={() => setTimeRange(days)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${timeRange === days ? 'bg-[#06b6d4] text-[#040608]' : 'bg-transparent text-gray-500 hover:text-white'}`}>{days} Days</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 w-full h-full relative -mt-6">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" className="cursor-pointer">
                {activeView === 'history' ? (
                  <AreaChart data={dynamicTransactions} margin={{ top: 70, right: 30, left: 60, bottom: 20 }} onClick={(e: any) => { if (e && e.activeLabel) setSelectedDate(e.activeLabel); }}>
                    <defs><linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} /><XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} /><Tooltip contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }} itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }} cursor={{ stroke: '#06b6d4', strokeWidth: 1 }} formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Daily Disbursement']} /><Area type="monotone" dataKey="amount" stroke="#06b6d4" fillOpacity={1} fill="url(#cyanGradient)" strokeWidth={3} animationDuration={1000} activeDot={{ r: 6, fill: '#030712', stroke: '#06b6d4', strokeWidth: 2 }} />
                  </AreaChart>
                ) : (
                  <AreaChart data={forecastData} margin={{ top: 90, right: 30, left: 60, bottom: 20 }} onClick={(e: any) => { if (e && e.activeLabel) setSelectedDate(e.activeLabel); }}>
                    <defs><linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#818CF8" stopOpacity={0.5} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} /><XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} /><YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }}
                      itemStyle={{ color: '#818CF8', fontWeight: 'bold' }}
                      cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: "5 5" }}
                      formatter={(value: any, name: any, props: any) => [
                        `₹${Number(value).toLocaleString()}`,
                        props.payload.isBillDay ? 'Balance (Automated Bill Hit!)' : 'Projected Liquidity'
                      ]}
                    />
                    <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Zero Liquidity Line', fill: '#ef4444', fontSize: 10 }} />
                    <Area type="monotone" dataKey="balance" stroke="#818CF8" fillOpacity={1} fill="url(#indigoGradient)" strokeWidth={3} animationDuration={1500} activeDot={{ r: 6, fill: '#030712', stroke: '#818CF8', strokeWidth: 2 }} dot={(props: any) => props.payload.isBillDay ? <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" stroke="#0B1117" strokeWidth={2} /> : null} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* INTELLIGENCE SIDEBAR (30%) */}
        <aside className="w-[30%] bg-[#0E141C] border-l border-[#1F2937] flex flex-col h-full overflow-hidden">

          <div className="p-6 shrink-0 border-b border-[#1F2937]">
            <p className="text-[#06b6d4] text-[9px] font-bold tracking-widest uppercase mb-1">SECTION A - OVERVIEW</p>
            <h2 className="text-xl font-bold text-white mb-2">Finance Flow Intelligence</h2>
            <p className="text-xs text-gray-400 mb-6">Global instant tracking metrics and liquidity runway forecasting.</p>

            <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-3">GLOBAL RAIL METRICS</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1 */}
              <div className="bg-[#141E28] border border-[#1F2937] rounded-lg p-4">
                <h4 className="text-2xl font-black text-[#06b6d4]">{dynamicRunway}</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Days Left</p>
              </div>
              {/* Card 2 */}
              <div className="bg-[#141E28] border border-[#1F2937] rounded-lg p-4">
                <h4 className="text-2xl font-black text-[#06b6d4]">{Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 1 }).format(dynamicIncome - dynamicOutflow)}</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Net Gap ({timeRange}D)</p>
              </div>
              {/* Card 3 */}
              <div className="bg-[#141E28] border border-[#1F2937] rounded-lg p-4">
                <h4 className="text-2xl font-black text-[#06b6d4]">{savingsRate.toFixed(1)}%</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Current Efficiency</p>
              </div>
              {/* Card 4 */}
              <div className="bg-[#141E28] border border-[#1F2937] rounded-lg p-4">
                <h4 className="text-2xl font-black text-[#06b6d4]">{Intl.NumberFormat('en-IN', { notation: "compact", maximumFractionDigits: 1 }).format(dailyBurnRate)}</h4>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">Daily Burn</p>
              </div>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-[#1F2937] shrink-0 pt-4 px-6 gap-6">
            <button onClick={() => setRightTab('LEDGER')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${rightTab === 'LEDGER' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>LEDGER</button>
            <button onClick={() => setRightTab('INSIGHTS')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${rightTab === 'INSIGHTS' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>INSIGHTS</button>
            <button onClick={() => setRightTab('EXPORT')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${rightTab === 'EXPORT' ? 'border-[#06b6d4] text-[#06b6d4]' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>EXPORT</button>
          </div>

          {/* Tab Content Box */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

            {rightTab === 'LEDGER' && (
              <div>
                <p className="text-gray-500 text-[10px] font-bold tracking-widest uppercase mb-4">PAYMENT RAIL INDEX (PHASE 1 BASELINE)</p>
                <div className="mb-4">
                  <input type="text" placeholder="Search merchants..." className="w-full bg-[#141E28] border border-[#1F2937] text-white px-3 py-2 text-xs rounded focus:border-[#06b6d4] outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="space-y-1">
                  {filteredTableTransactions.map((tx: any) => (
                    <div key={tx.transaction_id} className="flex items-center justify-between py-3 border-b border-[#1F2937]/50 group">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${tx.category.includes('Income') ? 'bg-emerald-500' : 'bg-[#06b6d4]'}`}></div>
                        <div>
                          <p className="text-sm font-bold text-gray-200">{tx.name}</p>
                          <p className="text-[10px] text-gray-500 uppercase mt-0.5">
                            {tx.category[0]} {getBankName(tx.account_id) && <span className="text-gray-600"> • {getBankName(tx.account_id)}</span>}
                          </p>
                        </div>
                      </div>
                      <p className={`text-xs font-mono font-bold ${tx.category.includes('Income') ? 'text-emerald-400' : 'text-[#06b6d4]'}`}>
                        {tx.category.includes('Income') ? '+' : ''}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rightTab === 'INSIGHTS' && (
              <div className="space-y-6">
                {/* STORYLINE SECTION */}
                <div>
                  <p className="text-[#06b6d4] text-[10px] font-bold tracking-[0.2em] mb-4 uppercase">Institutional Storyline</p>
                  <div className="p-4 bg-[#141E28] border border-[#1F2937] rounded-lg relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${dynamicOutflow > dynamicIncome ? 'bg-red-500' : 'bg-[#06b6d4]'}`}></div>
                    <p className="text-white text-xs leading-relaxed">
                      Your {timeRange}-day <span className="text-[#06b6d4] italic">{String(topCategory)}</span> volume is the primary driver of institutional outflow.
                      {dynamicOutflow > dynamicIncome ? (
                        <span className="block mt-2 text-red-400">CRITICAL: Your disbursement rate is {Math.abs(savingsRate).toFixed(1)}% higher than income. Liquidity correction recommended.</span>
                      ) : (
                        <span className="block mt-2 text-emerald-400">EFFICIENCY: You are retaining {savingsRate.toFixed(1)}% of your institutional flow.</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="bg-[#141E28] p-4 border border-[#1F2937] rounded-lg">
                  <h3 className="text-[#06b6d4] text-[10px] font-bold mb-3 uppercase tracking-[0.15em]">Why This Matters</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{data.sidebar.why_it_matters}</p>
                </div>

                <div className="bg-[#141E28] p-4 border border-red-500/30 rounded-lg relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 text-xs textShadow">❌</span>
                    <h3 className="text-white text-[10px] font-bold uppercase tracking-[0.15em]">Who Controls the Rail</h3>
                    <span className="ml-auto text-[9px] font-bold text-red-400 uppercase tracking-widest border border-red-500/30 px-1.5 py-0.5 rounded bg-red-500/10">Missing</span>
                  </div>
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    This is a mandatory protocol requirement that identifies the data aggregators <span className="text-gray-300 italic">(e.g., Plaid/TrueLayer)</span> and governance <span className="text-gray-300 italic">(e.g., RBI framework)</span>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#06b6d4] text-[10px] font-bold mb-4 uppercase tracking-[0.15em]">Ghost Rails ({timeRange}D)</h3>
                  <div className="space-y-3">
                    {dynamicInsights.length > 0 ? dynamicInsights.map((sub: any) => (
                      <div key={sub.name} className="p-4 bg-[#141E28] border border-[#1F2937] rounded-lg flex justify-between items-center">
                        <div>
                          <h4 className="text-white text-sm font-bold">{sub.name}</h4>
                          <p className="text-[9px] text-gray-500 uppercase mt-1">Hit {sub.occurrencesInWindow}x / ₹{sub.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-red-500/80 font-bold uppercase">Total Leak</p>
                          <p className="text-sm font-black text-red-400">₹{sub.total_spent_window.toFixed(0)}</p>
                        </div>
                      </div>
                    )) : <p className="text-gray-600 text-[10px] italic py-2 uppercase tracking-widest">No leaks detected.</p>}
                  </div>
                </div>
              </div>
            )}

            {rightTab === 'EXPORT' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase">Data Portability</p>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={downloadCSV} className="py-3 bg-[#141E28] border border-[#1F2937] text-white font-bold text-[10px] uppercase rounded hover:border-[#06b6d4] transition-colors">Export Excel / CSV</button>
                  <button onClick={downloadJSON} className="py-3 bg-[#141E28] border border-[#1F2937] text-white font-bold text-[10px] uppercase rounded hover:border-[#06b6d4] transition-colors">Export Institutional JSON</button>
                  <button className="w-full mt-3 py-4 bg-[#06b6d4] text-[#030712] font-black text-[10px] uppercase rounded shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-white transition-all" onClick={() => window.print()}>Generate Protocol Report</button>
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </main>
  );
}