"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Warehouse, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  ClipboardCheck, 
  DollarSign, 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

export default function StoresPage() {
  const [stats, setStats] = useState<any>(null);
  const [categoryHealth, setCategoryHealth] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchStoresData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [statsRes, healthRes, ledgerRes, alertsRes] = await Promise.all([
        axios.get(`${API_URL}/stores/analytics/overview`, { withCredentials: true }),
        axios.get(`${API_URL}/stores/analytics/category-health`, { withCredentials: true }),
        axios.get(`${API_URL}/stores/ledger`, { withCredentials: true }),
        axios.get(`${API_URL}/stores/alerts`, { withCredentials: true })
      ]);

      setStats(statsRes.data.data);
      setCategoryHealth(healthRes.data.data || []);
      setLedger(ledgerRes.data.data ? ledgerRes.data.data.slice(0, 5) : []);
      setAlerts(alertsRes.data.data ? alertsRes.data.data.slice(0, 5) : []);
    } catch (error: any) {
      console.error("Failed to load stores overview data:", error);
      toast.error("Failed to sync warehouse board metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStoresData();
  }, []);

  const handleMarkAlertRead = async (alertId: string) => {
    try {
      await axios.patch(`${API_URL}/stores/alerts/${alertId}/read`, {}, { withCredentials: true });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast.success("Alert dismissed");
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
      toast.error("Failed to dismiss alert");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="animate-spin text-brand" size={40} />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading Stores Overview...</p>
      </div>
    );
  }

  const kpis = stats || {
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  };

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
              <Warehouse size={20} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Stores Overview</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Warehouse control, raw inventory stock valuations, procurement PO logs, and daily ledgers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 font-bold text-xs gap-1 border-brand/20 text-brand hover:bg-brand/5"
            onClick={() => fetchStoresData(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync Board"}
          </Button>
          <Link href="/dashboard/stores/issues" passHref>
            <Button size="sm" className="h-9 bg-brand hover:bg-brand-dark text-white font-bold text-xs gap-1.5">
              <ClipboardCheck size={15} /> Pending Issue Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Indicators Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Gross Stock Value */}
        <Card className="border-l-4 border-l-emerald-500 relative overflow-hidden bg-gradient-to-br from-card to-emerald-50/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Inventory Valuation</span>
              <CardTitle className="text-2xl font-extrabold flex items-center">
                <DollarSign size={20} className="text-emerald-600 mr-0.5" />
                {kpis.totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </CardTitle>
            </div>
            <div className="h-9 w-9 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Gross value across {kpis.total} items
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Low Stock Warning */}
        <Card className="border-l-4 border-l-amber-500 relative overflow-hidden bg-gradient-to-br from-card to-amber-50/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Reorder Warnings</span>
              <CardTitle className="text-2xl font-extrabold text-amber-600">{kpis.lowStock}</CardTitle>
            </div>
            <div className="h-9 w-9 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center">
              <AlertTriangle size={18} className="animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Items below reorder levels
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Out of Stock */}
        <Card className="border-l-4 border-l-red-500 relative overflow-hidden bg-gradient-to-br from-card to-red-50/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Out of Stock</span>
              <CardTitle className="text-2xl font-extrabold text-red-600">{kpis.outOfStock}</CardTitle>
            </div>
            <div className="h-9 w-9 bg-red-500/10 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Fully depleted components
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Total Items */}
        <Card className="border-l-4 border-l-brand relative overflow-hidden bg-gradient-to-br from-card to-brand/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Inventory SKUs</span>
              <CardTitle className="text-2xl font-extrabold text-slate-800">{kpis.total}</CardTitle>
            </div>
            <div className="h-9 w-9 bg-brand/10 text-brand rounded-full flex items-center justify-center">
              <Warehouse size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground font-medium">
              Active part number codes cataloged
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Category Health & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category stock health */}
        <Card className="border border-muted shadow-sm lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-brand flex items-center gap-1.5">
              <PieChart size={16} /> Category Inventory Value Health
            </CardTitle>
            <CardDescription className="text-[10px] mt-0.5">Valuation breakdown and counts by active stores categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                {categoryHealth.length === 0 ? (
                  <p className="text-xs italic text-muted-foreground py-6">No category metrics loaded.</p>
                ) : (
                  categoryHealth.map((c: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || '#cbd5e1' }} />
                          {c.name}
                        </span>
                        <span className="font-mono text-slate-800">
                          ₹{c.value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            backgroundColor: c.color || '#3b82f6', 
                            width: `${kpis.totalValue > 0 ? (c.value / kpis.totalValue) * 100 : 0}%` 
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex flex-col justify-center border-l pl-4 gap-4">
                <div className="bg-brand/5 border rounded-lg p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Stores Valuation</div>
                  <div className="text-lg font-black text-brand mt-0.5">
                    ₹{kpis.totalValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-emerald-500/5 border rounded-lg p-2">
                    <div className="text-[9px] uppercase font-bold text-muted-foreground">Active SKUs</div>
                    <div className="text-sm font-bold text-emerald-700">{kpis.total}</div>
                  </div>
                  <div className="bg-amber-500/5 border rounded-lg p-2">
                    <div className="text-[9px] uppercase font-bold text-muted-foreground">Categories</div>
                    <div className="text-sm font-bold text-amber-700">{categoryHealth.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick actions panel */}
        <Card className="border border-muted shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-800">⚙️ Stores Dispatch Board</CardTitle>
            <CardDescription className="text-[10px] mt-0.5">Quick navigation panels to key stores actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 flex-1 flex flex-col justify-center">
            
            <Link href="/dashboard/stores/issues" className="group">
              <div className="flex items-center justify-between p-2 border rounded hover:border-brand hover:bg-brand/5 transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-brand/10 text-brand rounded flex items-center justify-center font-bold">
                    <ClipboardCheck size={14} />
                  </div>
                  <span className="text-xs font-bold group-hover:text-brand transition-colors">Issue Requests Queue</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link href="/dashboard/stores/inventory" className="group">
              <div className="flex items-center justify-between p-2 border rounded hover:border-emerald-500 hover:bg-emerald-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-emerald-500/10 text-emerald-600 rounded flex items-center justify-center font-bold">
                    <Warehouse size={14} />
                  </div>
                  <span className="text-xs font-bold group-hover:text-emerald-600 transition-colors">Warehouse Inventory</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link href="/dashboard/stores/purchase-orders" className="group">
              <div className="flex items-center justify-between p-2 border rounded hover:border-amber-500 hover:bg-amber-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-amber-500/10 text-amber-600 rounded flex items-center justify-center font-bold">
                    <FileText size={14} />
                  </div>
                  <span className="text-xs font-bold group-hover:text-amber-600 transition-colors">Purchase Orders</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link href="/dashboard/stores/ledger" className="group">
              <div className="flex items-center justify-between p-2 border rounded hover:border-violet-500 hover:bg-violet-500/5 transition-all cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-violet-500/10 text-violet-600 rounded flex items-center justify-center font-bold">
                    <Activity size={14} />
                  </div>
                  <span className="text-xs font-bold group-hover:text-violet-600 transition-colors">Daily Movement Ledger</span>
                </div>
                <ChevronRight size={12} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

          </CardContent>
        </Card>

      </div>

      {/* Row 3: Daily Ledger & Active Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left column: Recent Ledger Movements */}
        <Card className="border border-muted shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-brand flex items-center gap-1">
                <Activity size={16} /> Recent Stock Transactions
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Last 5 raw movements cataloged in ledger</CardDescription>
            </div>
            <Link href="/dashboard/stores/ledger">
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-muted-foreground hover:text-brand flex items-center gap-1">
                View Ledger <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-bold">
                    <th className="p-2 text-[10px]">Movement</th>
                    <th className="p-2 text-[10px]">Part Code</th>
                    <th className="p-2 text-[10px]">Component Name</th>
                    <th className="p-2 text-center text-[10px]">Quantity</th>
                    <th className="p-2 text-center text-[10px]">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-800">
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground italic text-xs">
                        No transactions registered yet.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry: any) => {
                      const isIn = entry.movementType === 'IN' || entry.quantity > 0;
                      return (
                        <tr key={entry.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2">
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              isIn ? "bg-green-500/10 text-green-700" : "bg-orange-500/10 text-orange-700"
                            }`}>
                              {isIn ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                              {entry.movementType}
                            </span>
                          </td>
                          <td className="p-2 font-mono text-[10px] font-bold">{entry.material?.partNumber || "PART"}</td>
                          <td className="p-2 truncate max-w-[150px]" title={entry.material?.productName}>
                            {entry.material?.productName}
                          </td>
                          <td className={`p-2 text-center font-bold text-[10px] ${isIn ? "text-green-600" : "text-orange-600"}`}>
                            {isIn ? `+${entry.quantity}` : entry.quantity}
                          </td>
                          <td className="p-2 text-center font-mono text-[10px] font-bold">{entry.runningBalance}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right column: Recent Alerts Ticker */}
        <Card className="border border-muted shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <AlertTriangle size={16} /> Active Stock & PO Alerts
              </CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Critical notifications requiring warehouse action</CardDescription>
            </div>
            <Link href="/dashboard/stores/alerts">
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-muted-foreground hover:text-amber-600 flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-xs">
                  All systems green! No critical low stock warnings active.
                </div>
              ) : (
                alerts.map((a: any) => {
                  const isCritical = a.severity === 'CRITICAL';
                  return (
                    <div 
                      key={a.id} 
                      className={`flex items-start justify-between p-3 rounded-lg border transition-all gap-3 ${
                        isCritical 
                          ? "bg-red-500/5 border-red-200 text-red-900" 
                          : "bg-amber-500/5 border-amber-200 text-amber-900"
                      }`}
                    >
                      <div className="flex gap-2">
                        <AlertTriangle 
                          size={15} 
                          className={`mt-0.5 flex-shrink-0 ${isCritical ? "text-red-500 animate-pulse" : "text-amber-500"}`} 
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold tracking-tight leading-tight truncate">
                            {a.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                            {a.message}
                          </p>
                          <span className="inline-flex items-center gap-0.5 text-[8px] font-mono text-muted-foreground mt-1">
                            <Clock size={8} /> {new Date(a.createdAt).toLocaleDateString("en-GB")}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] font-bold text-muted-foreground hover:text-black hover:bg-black/5"
                        onClick={() => handleMarkAlertRead(a.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
