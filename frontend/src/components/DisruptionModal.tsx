import React, { useState } from 'react';
import { X, Zap, AlertTriangle, Truck } from 'lucide-react';
import { DisruptionCause, Shipment } from '../types';
import { injectDisruption } from '../api';

interface DisruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipments: Shipment[];
  onDisruptionInjected: () => void;
}

export const DisruptionModal: React.FC<DisruptionModalProps> = ({
  isOpen,
  onClose,
  shipments,
  onDisruptionInjected
}) => {
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(shipments[0]?.id || 'SHP-1024');
  const [cause, setCause] = useState<DisruptionCause>('traffic_congestion');
  const [delayMinutes, setDelayMinutes] = useState<number>(95);
  const [customMessage, setCustomMessage] = useState<string>('Overturned freight transport blocking 2 lanes on NH48 Vellore bypass');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await injectDisruption({
        shipment_id: selectedShipmentId,
        cause: cause,
        delay_minutes: delayMinutes,
        custom_message: customMessage
      });
      onDisruptionInjected();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error injecting disruption');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-rose-500/40 bg-[#0d1424] shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Simulate Supply Chain Disruption</h3>
              <p className="text-[11px] text-slate-400">Inject fault to trigger multi-agent autonomous recovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Target Shipment
            </label>
            <select
              value={selectedShipmentId}
              onChange={(e) => setSelectedShipmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.carrier_name} ({s.origin_hub.split('(')[0]} → {s.destination_hub.split('(')[0]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Disruption Category
            </label>
            <select
              value={cause}
              onChange={(e) => setCause(e.target.value as DisruptionCause)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            >
              <option value="traffic_congestion">Traffic Congestion / Highway Standstill (NH48)</option>
              <option value="vehicle_breakdown">Vehicle Mechanical / Transmission Failure</option>
              <option value="weather_disruption">Severe Flash Monsoon / Expressway Flooding</option>
              <option value="warehouse_bottleneck">Warehouse Cross-Dock Gate Congestion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Estimated Delay Minutes (+{delayMinutes}m)
            </label>
            <input
              type="range"
              min={30}
              max={180}
              step={5}
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>+30 mins</span>
              <span className="text-rose-400 font-bold">+{delayMinutes} mins delay</span>
              <span>+180 mins</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
              Incident Incident Summary
            </label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/50 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="h-4 w-4" />
              <span>{isSubmitting ? 'Injecting Disruption...' : 'Inject & Activate Agents'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
