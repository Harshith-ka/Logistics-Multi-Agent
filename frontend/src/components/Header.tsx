import React, { useState } from 'react';
import {
  LayoutDashboard, MapPin, Cpu, ShieldAlert, Boxes, LineChart,
  Play, Pause, RotateCcw, Zap, Sparkles, Activity
} from 'lucide-react';
import { triggerFlagshipDemo, resetSimulation, toggleSimulationPause, setSimulationSpeed } from '../api';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeDisruptionCount: number;
  isSimRunning: boolean;
  onSimToggle: (running: boolean) => void;
  onTriggerDisruptionModal: () => void;
  onRefreshData: () => void;
  wsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeDisruptionCount,
  isSimRunning,
  onSimToggle,
  onTriggerDisruptionModal,
  onRefreshData,
  wsConnected
}) => {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isDemoTriggering, setIsDemoTriggering] = useState<boolean>(false);

  const handlePauseResume = async () => {
    try {
      await toggleSimulationPause(isSimRunning);
      onSimToggle(!isSimRunning);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeedToggle = async () => {
    const nextSpeed = speedMultiplier === 1 ? 2 : speedMultiplier === 2 ? 4 : 1;
    setSpeedMultiplier(nextSpeed);
    try {
      await setSimulationSpeed(nextSpeed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTriggerFlagship = async () => {
    setIsDemoTriggering(true);
    try {
      await triggerFlagshipDemo();
      onRefreshData();
      onSelectTab('recovery');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDemoTriggering(false);
    }
  };

  const handleReset = async () => {
    if (confirm("Reset simulation to initial seed state?")) {
      await resetSimulation();
      onRefreshData();
    }
  };

  const navItems = [
    { id: 'control_tower', label: 'Control Tower', icon: LayoutDashboard },
    { id: 'tracking', label: 'Shipment Tracking', icon: MapPin },
    { id: 'workflow', label: 'Multi-Agent Workflow', icon: Cpu, badge: '9 Agents' },
    { id: 'recovery', label: 'Recovery Center', icon: ShieldAlert, alertBadge: activeDisruptionCount },
    { id: 'inventory', label: 'Warehouses & Stock', icon: Boxes },
    { id: 'analytics', label: 'Analytics & Audit', icon: LineChart }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1e]/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-[#080d1a] rounded-[10px] flex items-center justify-center">
                <Activity className="h-5 w-5 text-sky-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                  AgentForge
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  Logistics AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block">
                Autonomous Multi-Agent Supply Chain Recovery System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-sm shadow-sky-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.alertBadge !== undefined && item.alertBadge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                      {item.alertBadge}
                    </span>
                  )}
                  {item.badge && !item.alertBadge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Simulation & Quick Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs">
              <span className={`h-2 w-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-[11px] text-slate-400">{wsConnected ? 'Live Stream' : 'Polling'}</span>
            </div>

            {/* Sim Play/Pause */}
            <button
              onClick={handlePauseResume}
              title={isSimRunning ? "Pause Simulation" : "Resume Simulation"}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs transition"
            >
              {isSimRunning ? <Pause className="h-4 w-4 text-amber-400" /> : <Play className="h-4 w-4 text-emerald-400" />}
            </button>

            {/* Speed Multiplier */}
            <button
              onClick={handleSpeedToggle}
              title="Simulation Speed Multiplier"
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-semibold transition"
            >
              {speedMultiplier}x
            </button>

            {/* Quick Demo Disruption Injection */}
            <button
              onClick={handleTriggerFlagship}
              disabled={isDemoTriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium transition shadow-sm shadow-rose-900/40 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5 text-rose-400" />
              <span className="hidden md:inline">Demo NH48 Collision</span>
              <span className="md:hidden">Collision</span>
            </button>

            {/* Custom Fault Injection Modal */}
            <button
              onClick={onTriggerDisruptionModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-md shadow-indigo-600/30"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
              <span className="hidden sm:inline">Inject Disruption</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset Simulation State"
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Row */}
        <div className="lg:hidden flex overflow-x-auto space-x-2 py-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap transition ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.alertBadge !== undefined && item.alertBadge > 0 && (
                  <span className="px-1 py-0.1 text-[9px] font-bold rounded-full bg-rose-500 text-white">
                    {item.alertBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
