import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Search, Filter, Truck, AlertTriangle, CheckCircle, Navigation,
  Clock, MapPin, ShieldAlert, Phone, User, Package, ChevronRight, RefreshCw
} from 'lucide-react';
import { Shipment, Warehouse } from '../types';

interface ShipmentTrackingViewProps {
  shipments: Shipment[];
  warehouses: Warehouse[];
  selectedShipmentId?: string;
  onSelectShipment: (id: string) => void;
  onNavigateToRecovery: () => void;
}

export const ShipmentTrackingView: React.FC<ShipmentTrackingViewProps> = ({
  shipments,
  warehouses,
  selectedShipmentId,
  onSelectShipment,
  onNavigateToRecovery
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylineRef = useRef<L.Polyline | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center between Chennai (13.08) and Bengaluru (12.97)
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([12.95, 78.85], 8);

      // OpenStreetMap with dark mode class
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'dark-tiles',
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    // Add Warehouse Hub markers
    warehouses.forEach(wh => {
      const icon = L.divIcon({
        className: 'custom-warehouse-marker',
        html: `
          <div style="background: rgba(14, 165, 233, 0.9); border: 2px solid white; border-radius: 8px; padding: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(14, 165, 233, 0.6); color: white;">
            <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([wh.location.lat, wh.location.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="color: #0f172a; font-family: Inter, sans-serif; font-size: 12px; padding: 4px;">
            <strong style="color: #0369a1;">${wh.name}</strong><br/>
            <span>Code: ${wh.code} (${wh.city})</span><br/>
            <span>Capacity: ${wh.capacity_pallets} pallets</span>
          </div>
        `);
      markersRef.current[`wh-${wh.id}`] = marker;
    });

    // Add Vehicle Markers for Shipments
    shipments.forEach(s => {
      const isAtRisk = s.status === 'at_risk' || s.status === 'delayed';
      const isRecovering = s.status === 'recovering';
      const isSelected = s.id === selectedShipment?.id;

      const bgColor = isAtRisk
        ? '#ef4444'
        : isRecovering
        ? '#f59e0b'
        : s.status === 'delivered'
        ? '#10b981'
        : '#0ea5e9';

      const pulseHtml = isAtRisk
        ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(239, 68, 68, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; top: -6px; left: -6px;"></div>`
        : '';

      const icon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div style="position: relative;">
            ${pulseHtml}
            <div style="background: ${bgColor}; border: ${isSelected ? '3px solid #38bdf8' : '2px solid white'}; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); color: white;">
              <svg style="width: 14px; height: 14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle></svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([s.current_location.lat, s.current_location.lng], { icon })
        .addTo(map)
        .on('click', () => onSelectShipment(s.id));

      markersRef.current[`shp-${s.id}`] = marker;
    });

    // Draw route corridor for selected shipment
    if (selectedShipment && selectedShipment.route_waypoints && selectedShipment.route_waypoints.length > 1) {
      const latlngs: [number, number][] = selectedShipment.route_waypoints.map(w => [w.lat, w.lng]);
      const poly = L.polyline(latlngs, {
        color: selectedShipment.status === 'at_risk' ? '#ef4444' : '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: selectedShipment.status === 'at_risk' ? '8, 8' : undefined
      }).addTo(map);

      polylineRef.current = poly;
    }
  }, [shipments, warehouses, selectedShipment?.id]);

  // Filter shipments
  const filteredShipments = shipments.filter(s => {
    const matchesSearch =
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.carrier_name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'at_risk') return s.status === 'at_risk' || s.status === 'delayed';
    return s.status === statusFilter;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Shipment ID, Order, Carrier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['all', 'in_transit', 'at_risk', 'recovering', 'delivered'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === f
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {f === 'all' ? 'All Shipments' : f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Shipment Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
        {/* Left Column: Shipment Cards List (4 cols) */}
        <div className="lg:col-span-4 glass-panel rounded-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Corridor Fleet ({filteredShipments.length})
            </span>
            <span className="text-[11px] text-slate-400">Real-time GPS Tick</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
            {filteredShipments.map(s => {
              const isSelected = s.id === selectedShipment?.id;
              const isAtRisk = s.status === 'at_risk' || s.status === 'delayed';

              return (
                <div
                  key={s.id}
                  onClick={() => onSelectShipment(s.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-sky-500/10 border-sky-500/50 shadow-md shadow-sky-500/10'
                      : isAtRisk
                      ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className={`h-4 w-4 ${isAtRisk ? 'text-rose-400' : 'text-sky-400'}`} />
                      <span className="font-bold text-sm text-slate-100">{s.id}</span>
                      <span className="text-[10px] font-mono text-slate-400">{s.tracking_number}</span>
                    </div>
                    {isAtRisk ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                        +{s.delay_minutes}m Late
                      </span>
                    ) : s.status === 'recovering' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                        Recovering
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        On Time
                      </span>
                    )}
                  </div>

                  <div className="mt-2 text-xs text-slate-300">
                    <p className="truncate font-medium">{s.origin_hub.split('(')[0]} → {s.destination_hub.split('(')[0]}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.cargo_description}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Speed: <strong className="text-slate-200 font-mono">{s.speed_kmh.toFixed(0)} km/h</strong></span>
                    <span>ETA: <strong className={`font-mono ${isAtRisk ? 'text-rose-400' : 'text-emerald-400'}`}>{s.revised_eta}</strong></span>
                    <span>Deadline: <strong className="text-slate-300 font-mono">{s.deadline}</strong></span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isAtRisk ? 'bg-rose-500' : s.status === 'recovering' ? 'bg-amber-400' : 'bg-sky-500'
                      }`}
                      style={{ width: `${s.progress_percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Map + Drawer Inspector (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full gap-4">
          {/* Leaflet Map Box */}
          <div className="flex-1 glass-panel rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Floating Map Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="font-semibold text-white">Corridor Legend</div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                <span>On-Schedule Vehicle</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span>At-Risk / Bottleneck</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-600" />
                <span>Regional Fulfillment Hub</span>
              </div>
            </div>
          </div>

          {/* Selected Shipment Telemetry Detail Card */}
          {selectedShipment && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-[#0d1424]">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    selectedShipment.status === 'at_risk' || selectedShipment.status === 'delayed'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  }`}>
                    <Navigation className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{selectedShipment.id} — Telemetry Stream</h4>
                      <span className="text-[11px] font-mono text-slate-400">{selectedShipment.vehicle_id}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Current Waypoint: <strong>{selectedShipment.current_location.address}</strong> ({selectedShipment.current_location.city})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Driver Contact</div>
                    <div className="font-medium text-slate-200">{selectedShipment.driver_name} ({selectedShipment.driver_phone})</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Cargo Value</div>
                    <div className="font-medium text-cyan-300 font-mono">₹{selectedShipment.cargo_value_inr.toLocaleString('en-IN')}</div>
                  </div>

                  {(selectedShipment.status === 'at_risk' || selectedShipment.status === 'delayed') && (
                    <button
                      onClick={onNavigateToRecovery}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-md shadow-rose-900/50"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      <span>Resolve in Recovery Center</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
