import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlTowerView } from './components/ControlTowerView';
import { ShipmentTrackingView } from './components/ShipmentTrackingView';
import { MultiAgentWorkflowView } from './components/MultiAgentWorkflowView';
import { RecoveryCenterView } from './components/RecoveryCenterView';
import { InventoryView } from './components/InventoryView';
import { AnalyticsView } from './components/AnalyticsView';
import { DisruptionModal } from './components/DisruptionModal';

import {
  Shipment, Incident, Warehouse, InventoryItem, AuditEvent, ControlTowerKPIs
} from './types';
import {
  fetchKPIs, fetchShipments, fetchIncidents, fetchWarehouses,
  fetchInventory, fetchAuditTrail
} from './api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('control_tower');
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('SHP-1024');
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [isDisruptionModalOpen, setIsDisruptionModalOpen] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Core Data State
  const [kpis, setKpis] = useState<ControlTowerKPIs | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [kpiRes, shpRes, incRes, whRes, invRes, audRes] = await Promise.all([
        fetchKPIs().catch(() => null),
        fetchShipments().catch(() => []),
        fetchIncidents().catch(() => []),
        fetchWarehouses().catch(() => []),
        fetchInventory().catch(() => []),
        fetchAuditTrail().catch(() => [])
      ]);

      if (kpiRes) setKpis(kpiRes);
      if (shpRes.length) setShipments(shpRes);
      setIncidents(incRes);
      if (whRes.length) setWarehouses(whRes);
      if (invRes.length) setInventory(invRes);
      if (audRes.length) setAuditTrail(audRes);
    } catch (e) {
      console.error("Failed to load platform data:", e);
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // WebSocket Live Telemetry Stream
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/telemetry');

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.event === 'TELEMETRY_TICK') {
              if (parsed.data.shipments) {
                setShipments(parsed.data.shipments);
              }
              // Refresh KPIs periodically
              fetchKPIs().then(setKpis).catch(() => {});
            }
          } catch (e) {
            console.error("WS message parse error:", e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch (err) {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 3000);
      }
    };

    connectWs();

    // Fallback polling every 4 seconds in case WS is interrupted
    const pollInterval = setInterval(() => {
      loadData();
    }, 4000);

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [loadData]);

  const activeDisruptionCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'rejected').length;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans">
      {/* Top App Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeDisruptionCount={activeDisruptionCount}
        isSimRunning={isSimRunning}
        onSimToggle={setIsSimRunning}
        onTriggerDisruptionModal={() => setIsDisruptionModalOpen(true)}
        onRefreshData={loadData}
        wsConnected={wsConnected}
      />

      {/* Main Screen Content Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'control_tower' && (
          <ControlTowerView
            kpis={kpis}
            shipments={shipments}
            incidents={incidents}
            onNavigateTab={setCurrentTab}
            onSelectShipment={(id) => {
              setSelectedShipmentId(id);
              setCurrentTab('tracking');
            }}
            onTriggerDemo={() => setIsDisruptionModalOpen(true)}
          />
        )}

        {currentTab === 'tracking' && (
          <ShipmentTrackingView
            shipments={shipments}
            warehouses={warehouses}
            selectedShipmentId={selectedShipmentId}
            onSelectShipment={setSelectedShipmentId}
            onNavigateToRecovery={() => setCurrentTab('recovery')}
          />
        )}

        {currentTab === 'workflow' && (
          <MultiAgentWorkflowView
            incidents={incidents}
            onNavigateToRecovery={() => setCurrentTab('recovery')}
          />
        )}

        {currentTab === 'recovery' && (
          <RecoveryCenterView
            incidents={incidents}
            onRefreshData={loadData}
            onNavigateTab={setCurrentTab}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            warehouses={warehouses}
            inventory={inventory}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            kpis={kpis}
            auditTrail={auditTrail}
          />
        )}
      </main>

      {/* Manual Disruption Injection Modal */}
      <DisruptionModal
        isOpen={isDisruptionModalOpen}
        onClose={() => setIsDisruptionModalOpen(false)}
        shipments={shipments}
        onDisruptionInjected={() => {
          loadData();
          setCurrentTab('recovery');
        }}
      />
    </div>
  );
}

export default App;
