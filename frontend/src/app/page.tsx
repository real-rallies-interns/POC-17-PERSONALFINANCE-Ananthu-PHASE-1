'use client';
import { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export default function RealRailsDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/intelligence/rail-data')
      .then(res => res.json())
      .then(json => setData(json))
      .catch(err => console.error("Connection Error:", err));
  }, []);

  if (!data) return (
    <div className="h-screen bg-[#030712] flex items-center justify-center text-[#38BDF8] font-mono animate-pulse">
      INITIALIZING_FINANCE_RAIL_PROTOCOL...
    </div>
  );

  return (
    <main className="flex h-screen bg-[#030712] overflow-hidden text-white font-sans selection:bg-[#38BDF8] selection:text-[#030712]">
      
      {/* MAIN STAGE (70%) - Interactive Visualization [cite: 26] */}
      <section className="w-[70%] p-10 border-r border-[#1F2937] flex flex-col relative">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]"></div>
            <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.3em] uppercase">System Live</p>
          </div>
          <h1 className="text-white font-black text-6xl tracking-tighter italic uppercase">
            Finance<span className="text-[#38BDF8]">_Rail</span>
          </h1>
        </header>

        {/* ANALYTICS CONTAINER  */}
        <div className="flex-1 bg-[#0B1117] border border-[#1F2937] rounded-xl p-8 relative shadow-2xl overflow-hidden group">
          <div className="absolute top-6 left-8 z-10">
            <p className="text-[#38BDF8] text-[10px] font-bold tracking-widest uppercase opacity-60">90D_SPENDING_VELOCITY</p>
            <h3 className="text-2xl font-bold mt-1">Institutional Flow</h3>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.main_stage.transactions.slice().sort((a:any, b:any) => new Date(a.date).getTime() - new Date(b.date).getTime())}>
              <defs>
                <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#4B5563" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B1117', border: '1px solid #1F2937', borderRadius: '8px' }}
                itemStyle={{ color: '#38BDF8', fontWeight: 'bold' }}
                cursor={{ stroke: '#38BDF8', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#38BDF8" 
                fillOpacity={1} 
                fill="url(#cyanGradient)" 
                strokeWidth={3}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* INTELLIGENCE SIDEBAR (30%) [cite: 27] */}
      <aside className="w-[30%] bg-[#0B1117] p-10 border-l border-[#1F2937] overflow-y-auto flex flex-col gap-12">
        
        {/* Section A: Title & High-level Metric [cite: 28] */}
        <section>
          <p className="text-[#38BDF8] text-[10px] font-bold tracking-[0.2em] mb-3 uppercase">Net Disbursement</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-6xl font-black text-white tracking-tighter">${data.sidebar.metrics.total_spent.toLocaleString()}</h2>
            <span className="text-[#38BDF8] text-sm font-bold">USD</span>
          </div>
        </section>

        {/* Section B: Why This Matters [cite: 29] */}
        <section className="bg-[#030712] p-6 border border-[#1F2937] rounded-lg">
          <h3 className="text-[#38BDF8] text-[10px] font-bold mb-3 uppercase tracking-[0.15em]">Why This Matters</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{data.sidebar.why_it_matters}</p>
        </section>

        {/* Section C: Who Controls the Rail [cite: 30] */}
        <section>
          <h3 className="text-[#818CF8] text-[10px] font-bold mb-3 uppercase tracking-[0.15em]">Institutional Context</h3>
          <p className="text-gray-400 text-sm leading-relaxed italic">{data.sidebar.governance}</p>
        </section>

        {/* Section D: Functional Filters/Insights [cite: 31] */}
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
                <p className="text-2xl font-black text-[#818CF8] mt-1">${sub.amount}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section E: Action [cite: 32] */}
        <button className="w-full py-5 bg-[#38BDF8] text-[#030712] font-black text-[10px] uppercase tracking-[0.3em] rounded shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:shadow-[#38BDF8] hover:bg-white transition-all">
          Generate Full Protocol Report
        </button>
      </aside>
    </main>
  );
}