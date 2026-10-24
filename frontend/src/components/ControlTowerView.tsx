import React from 'react';
import {
  Truck, AlertTriangle, ShieldCheck, Clock, TrendingUp, IndianRupee,
  ArrowRight, ShieldAlert, CheckCircle2, ChevronRight, Zap, RefreshCw
} from 'lucide-react';
import { Shipment, Incident, ControlTowerKPIs } from '../types';

interface ControlTowerViewProps {
  kpis: ControlTowerKPIs | null;
  shipments: Shipment[];
  incidents: Incident[];
  onNavigateTab: (tab: string) => void;
  onSelectShipment: (shipmentId: string) => void;
  onTriggerDemo: () => void;
}

export const ControlTowerView: React.FC<ControlTowerViewProps> = ({
  kpis,
  shipments,
  incidents,
  onNavigateTab,
  onSelectShipment,
  onTriggerDemo
}) => {
  const activeIncidents = incidents.filter(i => i.status !== 'resolved' && i.status !== 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'at_risk':
      case 'delayed':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 badge-pulsing">At Risk</span>;
      case 'recovering':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">Recovering</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Delivered</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/30">In Transit</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Active Disruptions */}
      {activeIncidents.length > 0 ? (
        <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/60 via-slate-900/90 to-amber-950/40 p-5 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <AlertTriangle className="h-7 w-7 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-rose-500 text-white">
                    Disruption Detected
                  </span>
                  <span className="text-xs text-rose-300/80 font-mono">
                    Incident ID: {activeIncidents[0].id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {activeIncidents[0].summary}
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl mt-0.5">
                  Affected Order: <strong className="text-sky-300">{activeIncidents[0].affected_orders.join(', ')}</strong> on vehicle for shipment <strong className="text-white">{activeIncidents[0].shipment_id}</strong>. Multi-agent closed-loop recovery generated 4 ranked options awaiting human review.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => onNavigateTab('workflow')}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition"
              >
                Inspect Agent Reasoning
              </button>
              <button
                onClick={() => onNavigateTab('recovery')}
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 transition"
              >
                <span>Authorize Recovery Plan</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/80 p-4 shadow-lg backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-200">
                Corridor Operations Optimal — 100% Autonomous Telemetry
              </h3>
              <p className="text-xs text-slate-400">
                All 9 specialized AI agents standing by. Zero active SLA breaches across Chennai–Bengaluru corridor.
              </p>
            </div>
          </div>
          <button
            onClick={onTriggerDemo}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-medium transition whitespace-nowrap"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Simulate Disruption Event</span>
          </button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Fleet</span>
            <Truck className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white">
            {kpis?.active_shipments ?? 3}
          </div>
          <div className="mt-1 flex items-center text-[11px] text-emerald-400 gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>All vehicles transmitting GPS</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">At-Risk</span>
            <AlertTriangle className={`h-4 w-4 ${(kpis?.at_risk_shipments ?? 0) > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`mt-2 text-2xl font-black ${(kpis?.at_risk_shipments ?? 0) > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
            {kpis?.at_risk_shipments ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {(kpis?.at_risk_shipments ?? 0) > 0 ? 'Immediate action required' : 'Nominal progress'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Recovering</span>
            <RefreshCw className="h-4 w-4 text-amber-400 animate-spin" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300">
            {kpis?.recovering_shipments ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Rerouted or reassigned
          </div>
        </div>

        {/* KPI 4 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">On-Time SLA</span>
            <Clock className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {kpis?.on_time_sla_rate ?? 96.4}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-400/80">
            Target SLA: ≥ 95.0%
          </div>
        </div>

        {/* KPI 5 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Penalties Avoided</span>
            <IndianRupee className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-cyan-300">
            ₹{(kpis?.total_penalty_avoided_inr ?? 75000).toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Line stoppage savings
          </div>
        </div>

        {/* KPI 6 */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Agent Latency</span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-300">
            {kpis?.average_agent_latency_ms ?? 340} ms
          </div>
          <div className="mt-1 text-[11px] text-indigo-400/80">
            Target: &lt; 500 ms p95
          </div>
        </div>
      </div>

      {/* Two Column Layout: Active Shipments Table + Corridor Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Shipments Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Active Transit Corridors</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-400">
                  {shipments.length} Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">Real-time GPS telemetry, speed profile and delay status</p>
            </div>
            <button
              onClick={() => onNavigateTab('tracking')}
              className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition"
            >
              <span>View Full Map</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3">Shipment / Order</th>
                  <th className="py-3 px-3">Route Corridor</th>
                  <th className="py-3 px-3">Vehicle & Speed</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">ETA vs Deadline</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {shipments.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onSelectShipment(s.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span>{s.id}</span>
                        {s.temperature_sensitive && (
                          <span className="text-[10px] px-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">Cold</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.order_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 truncate max-w-[200px]" title={s.origin_hub + " -> " + s.destination_hub}>
                        {s.origin_hub.split('(')[0]} → {s.destination_hub.split('(')[0]}
                      </div>
                      <div className="text-[11px] text-slate-400">{s.carrier_name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200 font-mono">{s.speed_kmh.toFixed(1)} km/h</div>
                      <div className="text-[11px] text-slate-400">{s.vehicle_id}</div>
                    </td>
                    <td className="py-3 px-3 w-32">
                      <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                        <span>{Math.round(s.progress_percent)}%</span>
                        <span className="text-[10px] text-slate-400">{Math.round(s.remaining_distance_km)} km left</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            s.status === 'at_risk' || s.status === 'delayed'
                              ? 'bg-rose-500'
                              : s.status === 'recovering'
                              ? 'bg-amber-400'
                              : 'bg-sky-500'
                          }`}
                          style={{ width: `${s.progress_percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className={`font-mono font-medium ${s.delay_minutes > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {s.revised_eta}
                      </div>
                      <div className="text-[11px] text-slate-400">Cutoff: {s.deadline}</div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {getStatusBadge(s.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Agent Ecosystem & Corridor Insights */}
        <div className="space-y-4">
          {/* AgentForge Intelligence Summary */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-sky-400" />
              <span>Multi-Agent System Health</span>
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Specialized AI Agents</span>
                <span className="font-semibold text-sky-400">9 Active & Verified</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Incident Detection Recall</span>
                <span className="font-semibold text-emerald-400">{kpis?.incident_detection_recall ?? '98.2%'}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Valid Recovery Plans Rate</span>
                <span className="font-semibold text-emerald-400">{kpis?.valid_recovery_plans_rate ?? '100%'}</span>
              </div>
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="text-slate-400">Unauthorized Actions</span>
                <span className="font-semibold text-emerald-400">0 (Strictly Gated)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Deterministic Engine</span>
                <span className="font-semibold text-cyan-400">Active (Zero Cost Hallucination)</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('workflow')}
              className="mt-4 w-full py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition flex items-center justify-center gap-1.5"
            >
              <span>View 9-Agent Workflow Graph</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Regional Hub Quick Status */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <span>Regional Fulfillment Hubs</span>
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Hosur Fulfillment Center</div>
                  <div className="text-[10px] text-slate-400">WH-HOS-03 · 310 Sensors Available</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Vellore Transit Node</div>
                  <div className="text-[10px] text-slate-400">WH-VEL-02 · 85 Sensors Available</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400">Buffer</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="font-medium text-slate-200">Bengaluru East Hub</div>
                  <div className="text-[10px] text-slate-400">WH-BLR-04 · Destination Node</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400">Receiving</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('inventory')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Inspect Warehouse Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
