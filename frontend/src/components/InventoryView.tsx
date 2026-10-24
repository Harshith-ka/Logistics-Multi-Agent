import React, { useState } from 'react';
import {
  Boxes, Warehouse as WarehouseIcon, Package, CheckCircle2,
  AlertCircle, ArrowRightLeft, Search, Plus, Filter, IndianRupee
} from 'lucide-react';
import { Warehouse, InventoryItem } from '../types';

interface InventoryViewProps {
  warehouses: Warehouse[];
  inventory: InventoryItem[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  warehouses,
  inventory
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredItems = inventory.filter(item => {
    const matchesWarehouse = selectedWarehouseId === 'all' || item.warehouse_id === selectedWarehouseId;
    const matchesSearch =
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWarehouse && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400">
            <Boxes className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              Warehouse Network & Dynamic Inventory Reserves
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-modal inventory allocation, buffer tracking, and emergency fulfillment options for disruption mitigation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Total SKUs Tracked: <strong className="text-white">{inventory.length}</strong>
          </span>
        </div>
      </div>

      {/* Regional Warehouses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map(wh => {
          const isSelected = selectedWarehouseId === wh.id;
          const whItems = inventory.filter(i => i.warehouse_id === wh.id);
          const totalAvailable = whItems.reduce((acc, curr) => acc + curr.available_qty, 0);

          return (
            <div
              key={wh.id}
              onClick={() => setSelectedWarehouseId(isSelected ? 'all' : wh.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition shadow-lg ${
                isSelected
                  ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 shadow-purple-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className={`h-4 w-4 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className="font-bold text-xs text-slate-200">{wh.code}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  {wh.city}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mt-2 leading-tight">
                {wh.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {wh.location.address}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400">Pallet Capacity</span>
                  <div className="font-semibold text-slate-200 font-mono">{wh.capacity_pallets.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Available Stock</span>
                  <div className="font-semibold text-purple-400 font-mono">{totalAvailable.toLocaleString()} units</div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/60">
                <span>{wh.operating_hours}</span>
                <span className="text-sky-400">{wh.contact_phone}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inventory Items SKU Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              SKU Reserves & Allocation Table
            </h3>
            {selectedWarehouseId !== 'all' && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Filtering: {selectedWarehouseId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search SKU or Product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            {selectedWarehouseId !== 'all' && (
              <button
                onClick={() => setSelectedWarehouseId('all')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] text-slate-400 uppercase bg-slate-900/60 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">SKU Identifier</th>
                <th className="py-3 px-3">Product Name & Category</th>
                <th className="py-3 px-3">Fulfillment Hub</th>
                <th className="py-3 px-3">Available Buffer</th>
                <th className="py-3 px-3">Reserved Orders</th>
                <th className="py-3 px-3">Unit Valuation</th>
                <th className="py-3 px-3 text-right">Buffer Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map(item => {
                const wh = warehouses.find(w => w.id === item.warehouse_id);
                const isHealthy = item.available_qty >= item.safety_threshold;

                return (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-200">
                      {item.sku}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-100">{item.product_name}</div>
                      <div className="text-[11px] text-slate-400">{item.category}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-200">{wh ? wh.name.split('(')[0] : item.warehouse_id}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.warehouse_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-100 font-mono">{item.available_qty} units</div>
                      <div className="text-[10px] text-slate-400">Min safety: {item.safety_threshold}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-amber-300">
                      {item.reserved_qty} units
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-300">
                      ₹{item.unit_cost_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isHealthy ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Sufficient
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Low Stock
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
