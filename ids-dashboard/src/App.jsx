import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const IncidentDashboard = () => {
  const [status, setStatus] = useState("System Idle");
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]); // Stores history for the graph
  const [loading, setLoading] = useState(false);

  const attackData = [0.9, 0.8, 0.9, 0.1, 0.0, 0.0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.8, 0.9, 0.9, 0.1, 0.1, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

  const checkNetwork = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: attackData })
      });
      
      const result = await response.json();
      
      // Update Chart Data (Keep last 10 scans)
      const newDataPoint = { time: new Date().toLocaleTimeString(), score: result.confidence };
      setChartData(prev => [...prev.slice(-9), newDataPoint]);

      if (result.is_anomaly) {
        setStatus("THREAT DETECTED");
        setAlerts(prev => [{ id: Date.now(), msg: `Alert: Anomaly detected (${result.confidence}%)` }, ...prev]);
      } else {
        setStatus("Network Secure");
      }
    } catch (error) {
      setStatus("Offline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-slate-900 text-white min-h-screen font-sans">
      <h1 className="text-3xl font-black border-b border-red-500 pb-2 mb-8">WIPRO SECURE-NET AI</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Metric 1: Status Banner */}
        <div className={`p-6 rounded-xl border-2 ${status === "THREAT DETECTED" ? 'bg-red-900/20 border-red-600' : 'bg-green-900/20 border-green-600'}`}>
          <h3 className="text-sm uppercase text-slate-400">Threat Engine</h3>
          <div className="text-2xl font-mono mt-2">{status}</div>
        </div>

        {/* Metric 2: Live Chart */}
        <div className="lg:col-span-2 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner" style={{ minHeight: '300px' }}>
          <h3 className="text-sm mb-4 text-slate-400 uppercase font-bold tracking-widest">Threat Confidence Trend</h3>
          
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tick={{fill: '#94a3b8'}} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    domain={[0, 100]} 
                    tick={{fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px'}} 
                    itemStyle={{color: '#ef4444'}}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#ef4444" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 8 }}
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-500 italic">
              Waiting for scan data to generate chart...
            </div>
          )}
        </div>

        {/* Action Button & Logs */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <button onClick={checkNetwork} className="bg-red-600 hover:bg-red-700 h-16 rounded-xl font-bold text-xl uppercase tracking-widest">
            Execute Security Scan
          </button>
          
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 max-h-40 overflow-y-auto">
            {alerts.map(a => <div key={a.id} className="text-red-400 text-sm mb-1">● {a.msg}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDashboard;