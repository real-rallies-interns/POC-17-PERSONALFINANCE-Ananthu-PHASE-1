'use client';
import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function RealRailsDashboard() {
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState(90);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false); 
  
  // NEW: Toggle between Past (History) and Future (Forecast)
  const [activeView, setActiveView] = useState<'history' | 'forecast'>('history');

  useEffect(() => {
    setIsMounted(true);
    fetch('http://127.0.0.1:8000/intelligence/rail-data')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Connection Error:", err));
  }, []);

  if (!data) return (
    <div className="h-screen bg-[#030712] flex items-center justify-center text-[#38BDF8] font-mono animate-pulse">
      CALCULATING_PREDICTIVE_RUNWAY...
    </div>
  );

  const filteredTransactions = data.main_stage.transactions.filter((tx: any) => 
    tx.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.category.some((cat: string) => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- HISTORICAL DATA LOGIC ---
  const sortedChartData = data.main_stage.transactions.slice().sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestDateObj = sortedChartData.length > 0 ? new Date(sortedChartData[sortedChartData.length - 1].date) : new Date();
  const cutoffTime = latestDateObj.getTime() - (timeRange * 24 * 60 * 60 * 1000);

  const dailyTotals: Record<string, number> = {};
  for (let i = timeRange - 1; i >= 0; i--) {
    const d = new Date(latestDateObj);
    d.setDate(d.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    dailyTotals[dateString] = 0;
  }

  const dynamicTransactions = sortedChartData.filter((tx: any) => new Date(tx.date).getTime() >= cutoffTime);
  const expenseChartData = dynamicTransactions.filter((tx: any) => !tx.category.includes('Income'));
  
  expenseChartData.forEach((tx: any) => {
    if (dailyTotals[tx.date] !== undefined) {
      dailyTotals[tx.date] += tx.amount;
    } else {
      dailyTotals[tx.date] = tx.amount;
    }
  });

  const finalChartData = Object.keys(dailyTotals).map(date => ({
    date,
    amount: dailyTotals[date]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // --- DYNAMIC MATH ---
  const dynamicIncome = dynamicTransactions
    .filter((tx: any) => tx.category.includes('Income'))
    .reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const dynamicOutflow = expenseChartData.reduce((sum: number, tx: any) => sum + tx.amount, 0);

  const mockCurrentBalance = 150000; 
  const dailyBurnRate = dynamicOutflow / timeRange;
  const dynamicRunway = dailyBurnRate > 0 ? Math.round(mockCurrentBalance / dailyBurnRate) : 999;

  // --- NEW: FORECAST DATA GENERATOR (PHASE 2) ---
  const forecastData = [];
  // Cap the visualization at 365 days to prevent browser lag if burn rate is tiny
  const renderDays = Math.min(dynamicRunway, 365); 
  
  for (let i = 0; i <= renderDays; i += Math.ceil(renderDays / 30)) { // Skip dates to make chart smooth
    const d = new Date();
    d.setDate(d.getDate() + i);
    forecastData.push({
      date: d.toISOString().split('T')[0],
      balance: Math.max(0, mockCurrentBalance - (dailyBurnRate * i))
    });
  }
  // Ensure the final day hits exactly zero
  if (dynamicRunway <= 365) {
    const finalDate = new Date();
    finalDate.setDate(finalDate.getDate() + dynamicRunway);
    forecastData.push({
      date: finalDate.toISOString().split('T')[0],
      balance: 0
    });
  }

  const drilldownTransactions = selectedDate 
    ? data.main_stage.transactions.filter((tx: any) => tx.date === selectedDate) 
    : [];

  return (
    <main className="flex h-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#38BDF8] selection:text-[#030712]">
      
      {/* DAILY DRILLDOWN MODAL */}
      {selectedDate && activeView === 'history' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0B1117] border border-[#38BDF8]/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_40px_rgba(56,189,248,0.15)] relative">
            <button onClick={() => setSelectedDate(null)} className="absolute top-5 right-5 text-gray-500 hover:text-[#38BDF8] transition-colors">✕</button>
            <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">Daily Drilldown</p>
            <h3 className="text-2xl font-black text-white mb-6">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {drilldownTransactions.length > 0 ? (
                drilldownTransactions.map((tx: any) => (
                  <div key={tx.transaction_id} className="flex justify-between items-center p-4 bg-[#030712] border border-[#1F2937] rounded-lg hover:border-[#38BDF8]/30 transition-colors">
                    <div>
                      <p className="font-bold text-gray-300">{tx.name}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">{tx.category[0]}</p>
                    </div>
                    <p className={`font-mono font-black text-lg ${tx.category.includes('Income') ? 'text-green-400' : 'text-[#38BDF8]'}`}>
                      {tx.category.includes('Income') ? '+' : ''}₹{tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-sm text-center py-4">No activity recorded on this day.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MAIN STAGE (70%) */}
      <section className="w-[70%] p-10 border-r border-[#1F2937] flex flex-col relative overflow-y-auto">
        <header className="mb-10 shrink-0 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"></div>
              <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.3em] uppercase">System Live</p>
            </div>
            <h1 className="text-white font-black text-6xl tracking-tighter italic uppercase">Finance<span className="text-[#38BDF8]">_Rail</span></h1>
          </div>
          
          {/* NEW: TERMINAL VIEW TOGGLE */}
          <div className="flex bg-[#0B1117] border border-[#1F2937] p-1 rounded-lg">
            <button 
              onClick={() => setActiveView('history')}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${activeView === 'history' ? 'bg-[#38BDF8] text-[#030712] shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'text-gray-500 hover:text-white'}`}
            >
              Historical Flow
            </button>
            <button 
              onClick={() => setActiveView('forecast')}
              className={`px-6 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${activeView === 'forecast' ? 'bg-[#818CF8] text-[#030712] shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'text-gray-500 hover:text-white'}`}
            >
              Runway Forecast
            </button>
          </div>
        </header>

        {/* ANALYTICS CONTAINER */}
        <div className="h-[400px] shrink-0 bg-[#0B1117] border border-[#1F2937] rounded-xl p-8 relative shadow-2xl overflow-hidden group mb-8">
          
          {/* DYNAMIC HEADER BASED ON VIEW */}
          {activeView === 'history' ? (
            <div className="absolute top-6 left-8 right-8 z-10 flex justify-between items-start pointer-events-none">
              <div>
                <p className="text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase opacity-60">{timeRange}D_SPENDING_VELOCITY</p>
                <h3 className="text-2xl font-bold mt-1">Institutional Flow</h3>
                <p className="text-xs text-gray-500 mt-1 pointer-events-auto">Click any point to view daily drilldown</p>
              </div>
              <div className="flex gap-2 pointer-events-auto">
                {[7, 30, 60, 90].map(days => (
                  <button key={days} onClick={() => setTimeRange(days)} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${timeRange === days ? 'bg-[#38BDF8] text-[#030712] shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-[#030712] text-gray-500 border border-[#1F2937] hover:border-[#38BDF8] hover:text-[#38BDF8]'}`}>
                    {days} Days
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="absolute top-6 left-8 z-10 pointer-events-none">
              <p className="text-[#818CF8] text-[10px] font-bold tracking-widest uppercase opacity-60">PREDICTIVE_MODELING</p>
              <h3 className="text-2xl font-bold mt-1">Cash Runway Burn-Down</h3>
              <p className="text-xs text-gray-400 mt-1 italic w-2/3">
                Based on your {timeRange}-day average spending of ₹{dailyBurnRate.toFixed(0)}/day and upcoming bills, you have {dynamicRunway} days of cash remaining.
              </p>
            </div>
          )}
          
          {isMounted && (
            <ResponsiveContainer width="100%" height="100%" className={activeView === 'history' ? "cursor-pointer" : ""}>
              {activeView === 'history' ? (
                <AreaChart data={finalChartData} margin={{ top: 70, right: 0, left: -20, bottom: 0 }} onClick={(e: any) => { if (e && e.activeLabel) { setSelectedDate(e.activeLabel); } }}>
                  <defs>
                    <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }} itemStyle={{ color: '#38BDF8', fontWeight: 'bold' }} cursor={{ stroke: '#38BDF8', strokeWidth: 1 }} formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Daily Disbursement']} />
                  <Area type="monotone" dataKey="amount" stroke="#38BDF8" fillOpacity={1} fill="url(#cyanGradient)" strokeWidth={3} animationDuration={1000} activeDot={{ r: 6, fill: '#030712', stroke: '#38BDF8', strokeWidth: 2 }} />
                </AreaChart>
              ) : (
                <AreaChart data={forecastData} margin={{ top: 90, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818CF8" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value.toLocaleString()}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }} itemStyle={{ color: '#818CF8', fontWeight: 'bold' }} cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: "5 5" }} formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Projected Balance']} />
                  <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: 'Zero Liquidity Line', fill: '#ef4444', fontSize: 10 }} />
                  <Area type="monotone" dataKey="balance" stroke="#818CF8" fillOpacity={1} fill="url(#indigoGradient)" strokeWidth={3} animationDuration={1500} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* PHASE 1 CATEGORIZATION TABLE */}
        <div className="bg-[#0B1117] border border-[#1F2937] rounded-xl p-8 shadow-2xl shrink-0">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase opacity-60">Phase 1 Baseline</p>
              <h3 className="text-2xl font-bold mt-1">Transaction Ledger</h3>
            </div>
            <input type="text" placeholder="Search merchants or categories..." className="bg-[#030712] border border-[#1F2937] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-[#38BDF8] transition-colors w-72 text-sm placeholder-gray-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#818CF8] text-[10px] uppercase tracking-widest border-b border-[#1F2937]">
                <tr>
                  <th className="pb-3 font-bold">Date</th>
                  <th className="pb-3 font-bold">Merchant</th>
                  <th className="pb-3 font-bold">Category</th>
                  <th className="pb-3 text-right font-bold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50">
                {filteredTransactions.map((tx: any) => (
                  <tr key={tx.transaction_id} className="hover:bg-[#1F2937]/20 transition-colors group">
                    <td className="py-4 text-gray-500 font-mono text-xs">{tx.date}</td>
                    <td className="py-4 font-bold text-gray-300 group-hover:text-white transition-colors">{tx.name}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 bg-[#030712] border ${tx.category.includes('Income') ? 'border-green-400/50 text-green-400' : 'border-[#1F2937] text-gray-400'} rounded text-[9px] font-bold uppercase tracking-wider`}>
                        {tx.category[0]}
                      </span>
                    </td>
                    <td className={`py-4 text-right font-mono font-bold ${tx.category.includes('Income') ? 'text-green-400' : 'text-[#38BDF8]'}`}>
                      {tx.category.includes('Income') ? '+' : ''}₹{tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* INTELLIGENCE SIDEBAR (30%) */}
      <aside className="w-[30%] bg-[#0B1117] p-10 border-l border-[#1F2937] overflow-y-auto flex flex-col gap-10">
        
        {/* DYNAMIC NET CASHFLOW GAP */}
        <section>
          <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.2em] mb-4 uppercase">Net Cashflow Gap</p>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{timeRange}D Income</p>
              <h2 className="text-4xl font-black text-green-400">₹{dynamicIncome.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
            </div>
            <div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">{timeRange}D Outflow</p>
              <h2 className="text-4xl font-black text-white">₹{dynamicOutflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
        </section>

        {/* PREDICTIVE ADVISOR */}
        <section className="bg-[#030712] p-6 border border-[#1F2937] rounded-lg relative overflow-hidden group hover:border-[#818CF8]/50 transition-colors">
          <div className={`absolute top-0 left-0 w-1 h-full ${activeView === 'forecast' ? 'bg-[#818CF8] shadow-[0_0_15px_#818CF8]' : 'bg-[#38BDF8]'} transition-all`}></div>
          <h3 className="text-[#818CF8] text-[10px] font-bold mb-2 uppercase tracking-[0.15em]">Predictive Advisor</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-white text-5xl font-black tracking-tighter">{dynamicRunway}</p>
            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Days Left</span>
          </div>
          <p className="text-gray-500 text-[10px] mt-3 leading-relaxed">
            Calculated Cash Runway based on current liquidity divided by your {timeRange}-day average burn rate.
          </p>
        </section>

        {/* GHOST RAILS */}
        <section className="flex-1">
          <h3 className="text-[#38BDF8] text-[10px] font-bold mb-5 uppercase tracking-[0.15em]">Ghost Rails Detected</h3>
          <div className="space-y-4">
            {data.sidebar.insights.map((sub: any) => (
              <div key={sub.name} className="p-5 bg-[#030712] border border-[#1F2937] rounded-lg hover:border-[#38BDF8]/50 transition-all group cursor-pointer shadow-inner">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-tight">Recurring Leak</p>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] group-hover:animate-ping"></div>
                </div>
                <h4 className="text-white text-lg font-bold group-hover:text-[#38BDF8] transition-colors">{sub.name}</h4>
                <div className="flex justify-between items-end mt-2 border-t border-[#1F2937]/50 pt-2">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Per Charge</p>
                    <p className="text-xl font-black text-[#818CF8]">₹{sub.amount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-red-500/80 font-bold uppercase tracking-widest mb-0.5">90D Total Drain</p>
                    <p className="text-xl font-black text-red-400">₹{sub.total_spent_90d.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </main>
  );
}