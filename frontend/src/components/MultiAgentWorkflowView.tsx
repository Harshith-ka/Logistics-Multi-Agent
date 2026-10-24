import React, { useState, useEffect } from 'react';
import {
  Cpu, GitMerge, CheckCircle, Clock, AlertTriangle, ArrowRight,
  ShieldCheck, Wrench, FileCode, Play, Sparkles, ChevronRight, CornerDownRight
} from 'lucide-react';
import { WorkflowData, WorkflowNode, AgentRun, Incident } from '../types';
import { fetchWorkflowGraph, fetchAgentRuns } from '../api';

interface MultiAgentWorkflowViewProps {
  incidents: Incident[];
  onNavigateToRecovery: () => void;
}

export const MultiAgentWorkflowView: React.FC<MultiAgentWorkflowViewProps> = ({
  incidents,
  onNavigateToRecovery
}) => {
  const activeIncident = incidents.find(i => i.status !== 'resolved') || incidents[0];
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('orchestrator');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeIncident) return;
    setIsLoading(true);
    fetchWorkflowGraph(activeIncident.id)
      .then(data => {
        setWorkflowData(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [activeIncident?.id]);

  const selectedNode = workflowData?.nodes.find(n => n.id === selectedNodeId) || workflowData?.nodes[0];

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300';
      case 'running':
        return 'border-sky-500/60 bg-sky-950/30 text-sky-300 animate-pulse';
      case 'awaiting_approval':
        return 'border-amber-500/60 bg-amber-950/30 text-amber-300 animate-pulse';
      case 'failed':
        return 'border-rose-500/60 bg-rose-950/30 text-rose-300';
      default:
        return 'border-slate-800 bg-slate-900/60 text-slate-400';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Completed</span>;
      case 'running':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">Thinking</span>;
      case 'awaiting_approval':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Awaiting Approval</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-500">Standby</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Incident Header Context */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Multi-Agent Workflow Execution Engine</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300 font-mono">Incident: {activeIncident ? activeIncident.id : 'SHP-1024 Baseline'}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">
              Closed-Loop Disruption Resolution Graph (9 Specialized Agents)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToRecovery}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-sky-900/40 transition"
          >
            <span>Review Synthesized Recovery Plan</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Graph Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Interactive Node Topology Canvas */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Agent Orchestration Pipeline
            </span>
            <span className="text-[11px] text-slate-400">Click any agent to inspect reasoning & tools</span>
          </div>

          {/* Structured Visual Pipeline Flow */}
          <div className="space-y-4">
            {/* Level 1: Central Orchestrator */}
            <div className="flex justify-center">
              {workflowData?.nodes.filter(n => n.id === 'orchestrator').map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full max-w-md p-3.5 rounded-xl border cursor-pointer transition shadow-lg ${
                    selectedNodeId === node.id ? 'ring-2 ring-sky-400 shadow-sky-500/20' : ''
                  } ${getNodeColor(node.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-sky-400" />
                      <span className="font-bold text-xs text-white">{node.name}</span>
                    </div>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">{node.role}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span>Tools: <strong>{node.tool_calls.length}</strong></span>
                    <span>Latency: <strong>{node.latency_ms} ms</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center text-slate-600">
              <CornerDownRight className="h-5 w-5 animate-pulse" />
            </div>

            {/* Level 2: Monitoring & Disruption Analysis */}
            <div className="grid grid-cols-2 gap-4">
              {workflowData?.nodes.filter(n => n.id === 'monitoring' || n.id === 'disruption').map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition shadow-lg ${
                    selectedNodeId === node.id ? 'ring-2 ring-sky-400 shadow-sky-500/20' : ''
                  } ${getNodeColor(node.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{node.name}</span>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">{node.role}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span>Tools: <strong>{node.tool_calls.length}</strong></span>
                    <span>Latency: <strong>{node.latency_ms} ms</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center text-slate-600">
              <CornerDownRight className="h-5 w-5 animate-pulse" />
            </div>

            {/* Level 3: Parallel Specialists (Inventory, Route, Cost) */}
            <div className="grid grid-cols-3 gap-3">
              {workflowData?.nodes.filter(n => ['inventory', 'route', 'cost'].includes(n.id)).map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition shadow-lg ${
                    selectedNodeId === node.id ? 'ring-2 ring-sky-400 shadow-sky-500/20' : ''
                  } ${getNodeColor(node.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-white truncate">{node.name.split('.')[1]}</span>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 truncate">{node.role}</div>
                  <div className="mt-2 flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Tools: <strong>{node.tool_calls.length}</strong></span>
                    <span>{node.latency_ms}ms</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center text-slate-600">
              <CornerDownRight className="h-5 w-5 animate-pulse" />
            </div>

            {/* Level 4: Recovery Planning & Validation Gate */}
            <div className="grid grid-cols-2 gap-4">
              {workflowData?.nodes.filter(n => ['recovery', 'validation'].includes(n.id)).map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition shadow-lg ${
                    selectedNodeId === node.id ? 'ring-2 ring-sky-400 shadow-sky-500/20' : ''
                  } ${getNodeColor(node.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{node.name}</span>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">{node.role}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span>Tools: <strong>{node.tool_calls.length}</strong></span>
                    <span>Latency: <strong>{node.latency_ms} ms</strong></span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center text-slate-600">
              <CornerDownRight className="h-5 w-5 animate-pulse" />
            </div>

            {/* Level 5: Execution Agent (Gated by Human Approval) */}
            <div className="flex justify-center">
              {workflowData?.nodes.filter(n => n.id === 'execution').map(node => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full max-w-md p-3.5 rounded-xl border cursor-pointer transition shadow-lg ${
                    selectedNodeId === node.id ? 'ring-2 ring-sky-400 shadow-sky-500/20' : ''
                  } ${getNodeColor(node.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="font-bold text-xs text-white">{node.name}</span>
                    </div>
                    {getStatusBadge(node.status)}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    {node.role} — Gated by Human Approval Policy FR-08
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span>Audit Trail: <strong>SHA-256 Hash</strong></span>
                    <span>Status: <strong>{node.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Deep-Dive Agent Inspector Drawer */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col h-full bg-[#0d1424]">
          {selectedNode ? (
            <div className="space-y-4 flex-1 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-sky-400" />
                    <span>{selectedNode.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedNode.role}</p>
                </div>
                {getStatusBadge(selectedNode.status)}
              </div>

              {/* Reasoning Summary Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                  Reasoning & Decision Trace
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedNode.reasoning || "Agent executed deterministic decision model. Operational checks verified."}
                </p>
              </div>

              {/* Tool Calls List */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5 text-slate-400" />
                  <span>Authorized Tool Calls ({selectedNode.tool_calls.length})</span>
                </span>

                {selectedNode.tool_calls.length > 0 ? (
                  <div className="space-y-2">
                    {selectedNode.tool_calls.map((tc, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                        <div className="font-mono font-semibold text-emerald-400">{tc.tool}</div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          <strong>Args:</strong> {JSON.stringify(tc.args)}
                        </div>
                        <div className="mt-1 text-[11px] text-sky-300">
                          <strong>Output:</strong> {JSON.stringify(tc.result)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-xs text-slate-500">
                    No active external tool invocations for this step.
                  </div>
                )}
              </div>

              {/* Architectural Rule Callout */}
              <div className="mt-auto p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 text-xs text-slate-300">
                <strong className="text-sky-300 block mb-0.5">Architectural Rule Compliance:</strong>
                LLMs interpret situations, coordinate tasks, and explain recommendations. Deterministic software handles route constraints, inventory reservations, and financial calculations.
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              Select an agent from the workflow graph to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
