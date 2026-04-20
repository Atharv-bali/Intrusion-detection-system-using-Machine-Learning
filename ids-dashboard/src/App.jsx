import React, { useState, useEffect } from 'react';
import {io} from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const socket = io('http://localhost:8080'); // Connect to our backend server

const IncidentDashboard = () => {
  const [status, setStatus] = useState("System Idle");
  const [alerts, setAlerts] = useState([]);
  const [chartData, setChartData] = useState([]); // Stores history for the graph
  const [loading, setLoading] = useState(false);

  const downloadCSV = () => {
  const headers = "Timestamp,Type,Confidence,Status\n";
  const rows = alerts.map(a => `${new Date(a.id).toLocaleString()},${a.type},${a.score}%,${a.score > 80 ? 'CRITICAL' : 'WARNING'}`).join("\n");
  const blob = new Blob([headers + rows], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', 'Security_Report.csv');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

  const attackData = [0.9, 0.8, 0.9, 0.1, 0.0, 0.0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.8, 0.9, 0.9, 0.1, 0.1, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.9, 0.9, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0];

  const fetchLatestLogs = async () => {
  try {
    // We now GET the logs that the sniffer saved
    const response = await fetch('http://127.0.0.1:8080/api/logs', {
      headers: { 'auth-token': localStorage.getItem('token') } // Stay secure!
    });
    
    const logs = await response.json();
    
    if (logs.length > 0) {
      // 1. Transform the WHOLE array for the chart
      const formattedHistory = logs.reverse().map(log => ({
        time: new Date(log.timestamp).toLocaleTimeString(),
        score: log.confidence
      }));
      
      // 2. Set the state to the WHOLE array
      setChartData(formattedHistory);

      // 3. Update the Alerts list with all malicious logs found
      const malicious = logs.filter(l => l.isAnomaly).map(l => ({
        id: l._id,
        msg: `Historical Alert: ${l.confidence}% Anomaly`
      }));
      setAlerts(malicious);
    }
  } catch (error) {
    setStatus("Server Offline");
  }
};

useEffect(() => {
    // 1. Fetch old logs so the chart isn't empty on refresh
    fetchLatestLogs();

    // 2. Listen for NEW real-time data
    socket.on('new-thread-data', (newLog) => {
      console.log("Real-time data received:", newLog);
      
      const newDataPoint = { 
        time: new Date(newLog.timestamp).toLocaleTimeString(), 
        score: newLog.confidence 
      };
      
      setChartData(prev => [...prev.slice(-9), newDataPoint]);

      if (newLog.isAnomaly) {
        setStatus("THREAT DETECTED");
        setAlerts(prev => [{ id: Date.now(), msg: `Live Alert: ${newLog.confidence}% Anomaly` }, ...prev]);
      } else {
        setStatus("Monitoring: Network Secure");
      }
    });

    return () => socket.off('new-thread-data');
}, []);

  return (
  <div className="p-10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white min-h-screen font-sans">
    
    {/* Header */}
    <div className="flex justify-between items-center border-b border-slate-700 pb-5 mb-10">
      <h1 className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-400 to-yellow-400 drop-shadow-lg">
        WIPRO SECURE-NET AI
      </h1>

      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${
          status === "Server Offline"
            ? "bg-gray-500"
            : "bg-green-400 animate-ping shadow-[0_0_10px_#22c55e]"
        }`}></div>

        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
          Live Engine Active
        </span>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* System Risk */}
      <div className={`p-7 rounded-2xl border transition-all duration-500 backdrop-blur-lg ${
        status === "THREAT DETECTED"
          ? 'bg-red-900/30 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
          : 'bg-slate-800/60 border-slate-700 hover:shadow-xl hover:scale-[1.02]'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xs uppercase text-slate-400 font-semibold tracking-widest">
              System Risk Level
            </h3>

            <div className={`text-5xl font-black mt-3 font-mono ${
              status === "THREAT DETECTED"
                ? "text-red-500 drop-shadow-[0_0_10px_#ef4444]"
                : "text-green-400 drop-shadow-[0_0_10px_#22c55e]"
            }`}>
              {status === "THREAT DETECTED" ? "CRITICAL" : "SECURE"}
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:scale-105 hover:shadow-lg text-white px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
          >
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700 shadow-inner hover:shadow-xl transition-all">
        <h3 className="text-sm mb-6 text-slate-400 uppercase font-semibold tracking-widest flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"></span>
          Threat Confidence Trend
        </h3>

        <div style={{ width: '100%', height: '220px' }}>
          {chartData.length > 0 ? (
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickMargin={10} />
                <YAxis stroke="#64748b" domain={[0, 100]} fontSize={11} />

                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid #334155',
                    borderRadius: '10px'
                  }}
                  itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={false}
                  animationDuration={400}
                  style={{ filter: "drop-shadow(0px 0px 6px #ef4444)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 italic text-sm animate-pulse">
              Analyzing incoming packets...
            </div>
          )}
        </div>
      </div>

      {/* Logs */}
      <div className="lg:col-span-3 bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
        
        <div className="bg-slate-700/40 px-6 py-3 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-xs uppercase font-semibold tracking-widest text-slate-300">
            Live Incident Logs
          </h3>

          <span className="text-[10px] bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/40 shadow-sm">
            {alerts.length} Total Hits
          </span>
        </div>

        <div className="p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
          {alerts.length > 0 ? (
            alerts.map((a, index) => (
              <div
                key={a.id}
                className={`flex gap-4 p-2 rounded-lg transition-all ${
                  index === 0
                    ? 'bg-red-500/10 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                    : 'hover:bg-slate-700/40'
                }`}
              >
                <span className="text-slate-500">
                  [{new Date(a.id).toLocaleTimeString()}]
                </span>

                <span className={
                  a.msg.includes('Anomaly')
                    ? 'text-red-400 font-semibold'
                    : 'text-green-400'
                }>
                  {a.msg}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-600 tracking-widest uppercase text-[10px]">
              No threats detected in current session
            </div>
          )}
        </div>
      </div>

    </div>
  </div>
);
}
export default IncidentDashboard;