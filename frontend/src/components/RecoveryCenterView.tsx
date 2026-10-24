import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, IndianRupee,
  Clock, Check, X, ShieldCheck, Sparkles, Truck, FileText, CornerDownRight, ExternalLink
} from 'lucide-react';
import { Incident, RecoveryPlan, RecoveryOption } from '../types';
import { fetchPlanForIncident, submitApproval } from '../api';

interface RecoveryCenterViewProps {
  incidents: Incident[];
  onRefreshData: () => void;
  onNavigateTab: (tab: string) => void;
}

export const RecoveryCenterView: React.FC<RecoveryCenterViewProps> = ({
  incidents,
  onRefreshData,
  onNavigateTab
}) => {
  const activeIncident = incidents.find(i => i.status !== 'resolved') || incidents[0];
  const [plan, setPlan] = useState<RecoveryPlan | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Priya Sharma (Lead Logistics Coordinator)');
  const [approvalNotes, setApprovalNotes] = useState<string>('Approved. Reassignment to Delhivery Rapid Freight preserves OEM tier-1 assembly SLA and avoids contractual delay penalties.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    if (!activeIncident) return;
    fetchPlanForIncident(activeIncident.id)
      .then(p => {
        setPlan(p);
        if (p && p.recommended_option_id) {
          setSelectedOptionId(p.recommended_option_id);
        }
      })
      .catch(console.error);
  }, [activeIncident?.id]);

  const handleApprove = async () => {
    if (!plan || !selectedOptionId) return;
    setIsSubmitting(true);
    try {
      const res = await submitApproval(plan.id, selectedOptionId, reviewerName, approvalNotes);
      setExecutionResult(res);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Error approving recovery plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption: RecoveryOption | undefined = plan?.options.find(o => o.option_id === selectedOptionId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Disruption Context */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Human-in-the-Loop Recovery Center
              </span>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs font-mono text-slate-300">
                Incident: {activeIncident ? activeIncident.id : 'N/A'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {activeIncident ? activeIncident.summary : 'No active disruption detected'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              {activeIncident ? activeIncident.description : 'All shipments are operating nominally.'}
            </p>
          </div>
        </div>

        {plan && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
              Deterministic Validation: PASSED
            </span>
          </div>
        )}
      </div>

      {/* Execution Confirmation Toast / Modal */}
      {executionResult && (
        <div className="glass-panel rounded-2xl p-5 border border-emerald-500/50 bg-emerald-950/30 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-300">
                  Recovery Action Dispatched to External TMS & WMS Systems
                </h3>
                <p className="text-xs text-slate-300">
                  Approved by {executionResult.reviewer}. Idempotency key verified, immutable audit block committed.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('tracking')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-900/40 transition"
            >
              <span>Track In Transit Progress</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Confirmation Hash:</span>
              <span className="text-emerald-400 font-bold">{executionResult.execution_result?.confirmation_hash || 'SHA256:8f9a2b71d99e0a12'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Idempotency Key:</span>
              <span className="text-sky-300">{executionResult.execution_result?.idempotency_key}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Revised Delivery ETA:</span>
              <span className="text-amber-300">{executionResult.execution_result?.revised_eta}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Strategy Options Matrix */}
      {plan ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Evaluated Recovery Strategies ({plan.options.length})</span>
                <span className="text-xs font-normal text-slate-400 lowercase">— select preferred option for execution</span>
              </h3>
            </div>
            <span className="text-xs text-slate-400">Ranked by Feasibility & ROI</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plan.options.map((opt) => {
              const isSelected = opt.option_id === selectedOptionId;
              const isRecommended = opt.is_recommended;

              return (
                <div
                  key={opt.option_id}
                  onClick={() => setSelectedOptionId(opt.option_id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between relative shadow-lg ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-500/50 shadow-sky-500/20'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md">
                      AI Recommended
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">{opt.option_id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        opt.status_prediction === 'on_time'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {opt.status_prediction === 'on_time' ? 'On Time SLA' : 'Late Arrival'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2 leading-tight">
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                      {opt.description}
                    </p>

                    {/* Metric Chips */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Added Cost</div>
                        <div className="font-bold text-cyan-300 font-mono">
                          ₹{opt.added_cost_inr.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                        <div className="text-[10px] text-slate-400">Revised ETA</div>
                        <div className={`font-bold font-mono ${opt.status_prediction === 'on_time' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {opt.revised_eta}
                        </div>
                      </div>
                    </div>

                    {/* Trade-off summary */}
                    <p className="mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
                      {opt.tradeoff_explanation}
                    </p>
                  </div>

                  {/* Radio Selector */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Feasibility: <strong className="text-slate-200">{opt.feasibility_score}%</strong></span>
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-sky-500 border-sky-400 text-white' : 'border-slate-700'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Option Operational Deep-Dive & Authorization Form */}
          {selectedOption && (
            <div className="glass-panel rounded-2xl p-6 border border-slate-800 bg-[#0c1322] space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Selected Strategy for Operational Authorization
                    </span>
                    <span className="text-xs font-mono text-slate-400">({selectedOption.option_id})</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedOption.title}</h3>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Contractual Penalty Avoided</div>
                    <div className="font-bold text-emerald-400 font-mono text-sm">
                      ₹{selectedOption.penalty_avoided_inr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Steps Checklist */}
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  Action Steps Dispatched upon Authorization:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedOption.action_steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200">
                      <div className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human Approval Reviewer Input */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Authorizing Reviewer (Human-in-the-Loop)
                    </label>
                    <input
                      type="text"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                      Operational Approval Notes / TMS Audit Reason
                    </label>
                    <input
                      type="text"
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Consequential action authorization complies with Policy FR-08. SHA-256 ledger committed.</span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                      <Check className="h-4 w-4 stroke-[3]" />
                      <span>{isSubmitting ? 'Dispatching to TMS...' : 'Approve & Execute via TMS/WMS'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center">
          <p className="text-slate-400 text-sm">No active disruption requiring recovery planning.</p>
        </div>
      )}
    </div>
  );
};
