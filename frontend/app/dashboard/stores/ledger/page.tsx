"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Download, 
  ArrowUpRight, 
  ArrowDownRight,
  User,
  Calendar,
  ExternalLink,
  ChevronRight,
  RefreshCcw,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ImportLedgerDialog from "@/components/stores/import-ledger-dialog";

export default function DailyLedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isImporting, setIsImporting] = useState(false);

  // Aggregation & Date Range Ledger
  const [viewMode, setViewMode] = useState<"transactions" | "aggregation" | "matrix">("transactions");
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-01-31");
  const [groupBy, setGroupBy] = useState<"daily" | "monthly">("daily");
  const [summaryEntries, setSummaryEntries] = useState<any[]>([]);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Matrix View (Excel-like Spreadsheet)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [matrixMaterials, setMatrixMaterials] = useState<any[]>([]);
  const [matrixLedger, setMatrixLedger] = useState<any[]>([]);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchLedger = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/ledger`, {
        params: { date },
        withCredentials: true
      });
      setEntries(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch daily ledger");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    setIsSummaryLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/ledger/summary`, {
        params: { startDate, endDate, groupBy },
        withCredentials: true
      });
      setSummaryEntries(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch ledger summary");
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const fetchMatrixData = async () => {
    setIsMatrixLoading(true);
    try {
      const year = selectedYear;
      const month = String(selectedMonth).padStart(2, '0');
      const start = `${year}-${month}-01`;
      const lastDay = new Date(year, selectedMonth, 0).getDate();
      const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

      const materialsRes = await axios.get(`${API_URL}/stores/materials?limit=100`, { withCredentials: true });
      const ledgerRes = await axios.get(`${API_URL}/stores/ledger`, {
        params: { startDate: start, endDate: end },
        withCredentials: true
      });

      setMatrixMaterials(materialsRes.data.data);
      setMatrixLedger(ledgerRes.data.data);
    } catch (error) {
      console.error("Failed to fetch matrix ledger:", error);
      toast.error("Failed to fetch ledger matrix data");
    } finally {
      setIsMatrixLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "transactions") {
      fetchLedger();
    }
  }, [date, viewMode]);

  useEffect(() => {
    if (viewMode === "aggregation") {
      fetchSummary();
    }
  }, [startDate, endDate, groupBy, viewMode]);

  useEffect(() => {
    if (viewMode === "matrix") {
      fetchMatrixData();
    }
  }, [selectedMonth, selectedYear, viewMode]);

  const getStats = () => {
    if (viewMode === "transactions") {
      const inwardCount = entries.filter(e => e.movementType === 'IN').length;
      const outwardCount = entries.filter(e => e.movementType === 'OUT').length;
      const net = entries.reduce((acc, curr) => acc + curr.quantity, 0);
      return { 
        inwardLabel: "Total Inward",
        inward: `+${inwardCount} Transactions`, 
        outwardLabel: "Total Outward",
        outward: `-${outwardCount} Transactions`, 
        netLabel: "Net Movement",
        net: net.toFixed(0) 
      };
    } else if (viewMode === "matrix") {
      const inwardSum = matrixLedger.filter(e => e.quantity > 0).reduce((acc, curr) => acc + curr.quantity, 0);
      const outwardSum = matrixLedger.filter(e => e.quantity < 0).reduce((acc, curr) => acc + Math.abs(curr.quantity), 0);
      const net = inwardSum - outwardSum;
      return { 
        inwardLabel: "Total Inward Quantity (Month)",
        inward: `+${inwardSum.toFixed(0)} units`, 
        outwardLabel: "Total Outward Quantity (Month)",
        outward: `-${outwardSum.toFixed(0)} units`, 
        netLabel: "Net Movement Quantity (Month)",
        net: (net >= 0 ? "+" : "") + net.toFixed(0) 
      };
    } else {
      const inwardSum = summaryEntries.reduce((acc, curr) => acc + curr.totalIncoming, 0);
      const outwardSum = summaryEntries.reduce((acc, curr) => acc + curr.totalOutgoing, 0);
      const net = summaryEntries.reduce((acc, curr) => acc + curr.netMovement, 0);
      return { 
        inwardLabel: "Total Inward Quantity",
        inward: `+${inwardSum.toFixed(0)} units`, 
        outwardLabel: "Total Outward Quantity",
        outward: `-${outwardSum.toFixed(0)} units`, 
        netLabel: "Net Movement Quantity",
        net: net.toFixed(0) 
      };
    }
  };

  const currentStats = getStats();

  const handlePeriodClick = (period: string) => {
    if (groupBy === 'daily') {
      setDate(period);
      setViewMode('transactions');
      toast.info(`Switched to transaction detail view for ${period}`);
    } else {
      // Monthly: set start and end date to match month and stay in aggregation
      const [year, month] = period.split('-');
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
      setGroupBy('daily');
      toast.info(`Expanded daily summary for ${new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Ledger</h1>
          <p className="text-muted-foreground">The ultimate audit trail for every material movement in the warehouse.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-muted p-1 rounded-lg border flex items-center gap-1">
            <Button
              variant={viewMode === "transactions" ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${viewMode === "transactions" ? "bg-brand text-white hover:bg-brand-dark" : ""}`}
              onClick={() => setViewMode("transactions")}
            >
              Transactions
            </Button>
            <Button
              variant={viewMode === "aggregation" ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${viewMode === "aggregation" ? "bg-brand text-white hover:bg-brand-dark" : ""}`}
              onClick={() => setViewMode("aggregation")}
            >
              Summary By Range
            </Button>
            <Button
              variant={viewMode === "matrix" ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${viewMode === "matrix" ? "bg-brand text-white hover:bg-brand-dark" : ""}`}
              onClick={() => setViewMode("matrix")}
            >
              Grid Ledger (Spreadsheet)
            </Button>
          </div>

          {viewMode === "transactions" ? (
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input 
                type="date" 
                className="pl-10 h-10 w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-medium"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          ) : viewMode === "matrix" ? (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="date" 
                  className="h-10 w-[135px] rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-medium"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">to</span>
              <div className="relative">
                <input 
                  type="date" 
                  className="h-10 w-[135px] rounded-md border border-input bg-background px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-medium"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-xs font-bold focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
              >
                <option value="daily">📅 Daily Summary</option>
                <option value="monthly">🗓️ Monthly Summary</option>
              </select>
            </div>
          )}

          <Button 
            variant="outline" 
            className="gap-2 h-10 text-xs"
            onClick={() => setIsImporting(true)}
          >
            <Download size={14} className="rotate-180" />
            Import
          </Button>
          <Button variant="outline" className="gap-2 h-10 text-xs">
            <Download size={14} />
            Export
          </Button>
        </div>
      </div>

      <ImportLedgerDialog 
        isOpen={isImporting}
        onOpenChange={setIsImporting}
        onSuccess={viewMode === "transactions" ? fetchLedger : fetchSummary}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-green-500/5 border-green-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-green-600 tracking-wider">{currentStats.inwardLabel}</p>
              <p className="text-2xl font-bold text-green-700">{currentStats.inward}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <ArrowUpRight size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-500/5 border-red-500/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-red-600 tracking-wider">{currentStats.outwardLabel}</p>
              <p className="text-2xl font-bold text-red-700">{currentStats.outward}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <ArrowDownRight size={24} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-brand/5 border-brand/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-brand tracking-wider">{currentStats.netLabel}</p>
              <p className="text-2xl font-bold text-brand">
                {currentStats.net}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-brand/10 flex items-center justify-center text-brand">
              <RefreshCcw size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card/50 overflow-hidden">
        {viewMode === "transactions" ? (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Time</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Material</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Reference</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Quantity</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Running Balance</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider">By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={7} className="h-12 bg-muted/20"></TableCell>
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                    No stock movements recorded for this date.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.material?.category?.color || '#ccc' }} />
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{entry.material?.productName}</span>
                          <span className="text-[10px] font-mono text-brand uppercase">{entry.material?.partNumber}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        entry.movementType === 'OPENING_BALANCE'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : entry.movementType === 'IN' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }>
                        {entry.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{entry.referenceType}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{entry.referenceCode || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${entry.quantity > 0 ? 'text-green-600' : entry.quantity < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {entry.quantity > 0 ? '+' : ''}{entry.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-brand">
                      {entry.runningBalance}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {entry.createdById.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground">Admin</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : viewMode === "aggregation" ? (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase tracking-wider">Period / Date</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Total Inward</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Total Outward</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Net Movement</TableHead>
                <TableHead className="font-bold text-xs uppercase tracking-wider text-center">Transactions Count</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isSummaryLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={6} className="h-12 bg-muted/20"></TableCell>
                  </TableRow>
                ))
              ) : summaryEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No summary data recorded within this date range.
                  </TableCell>
                </TableRow>
              ) : (
                summaryEntries.map((summary) => (
                  <TableRow key={summary.period} className="hover:bg-muted/30 transition-colors group">
                    <TableCell className="font-bold text-sm text-brand flex items-center gap-2">
                      <Calendar size={14} className="text-muted-foreground" />
                      {groupBy === 'daily' 
                        ? new Date(summary.period).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
                        : new Date(summary.period + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
                      }
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600 font-mono">
                      +{summary.totalIncoming} units
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600 font-mono">
                      -{summary.totalOutgoing} units
                    </TableCell>
                    <TableCell className={`text-right font-bold font-mono ${summary.netMovement > 0 ? 'text-green-600' : summary.netMovement < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {summary.netMovement > 0 ? '+' : ''}{summary.netMovement} units
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono bg-muted-foreground/10 text-muted-foreground">
                        {summary.transactionCount} entries
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                        onClick={() => handlePeriodClick(summary.period)}
                      >
                        {groupBy === 'daily' ? 'View Details' : 'Expand Daily'}
                        <ChevronRight size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        ) : (
          (() => {
            const daysCount = new Date(selectedYear, selectedMonth, 0).getDate();
            const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

            return isMatrixLoading ? (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                <RefreshCcw className="animate-spin text-brand" size={24} />
                <span className="text-sm font-semibold">Generating Ledger Grid Matrix...</span>
              </div>
            ) : matrixMaterials.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground italic">
                No materials found in the inventory.
              </div>
            ) : (
              <div className="w-full overflow-x-auto relative">
                <table className="w-full border-collapse border-spacing-0 text-left text-xs">
                  <thead>
                    <tr className="bg-muted/80 border-b select-none">
                      <th className="sticky left-0 z-20 bg-muted/95 border-r border-b px-3 py-3 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs uppercase tracking-wider w-[100px] min-w-[100px] max-w-[100px]">Storage Loc</th>
                      <th className="sticky left-[100px] z-20 bg-muted/95 border-r border-b px-3 py-3 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs uppercase tracking-wider w-[120px] min-w-[120px] max-w-[120px]">Part Number</th>
                      <th className="sticky left-[220px] z-20 bg-muted/95 border-r border-b px-3 py-3 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-xs uppercase tracking-wider w-[220px] min-w-[220px] max-w-[220px]">Product Name</th>
                      
                      <th className="border-r border-b px-2 py-3 font-bold text-right text-xs uppercase tracking-wider min-w-[85px]">Rate</th>
                      <th className="border-r border-b px-2 py-3 font-bold text-center text-xs uppercase tracking-wider min-w-[65px]">Unit</th>
                      <th className="border-r border-b px-3 py-3 font-bold text-right text-xs uppercase tracking-wider bg-blue-500/5 text-blue-700 dark:text-blue-400 min-w-[110px]">Opening Stock</th>
                      
                      {daysArray.map((day) => (
                        <th key={day} className="border-r border-b px-1 py-3 font-bold text-center min-w-[42px] max-w-[42px] bg-muted/40 text-[10px] hover:bg-muted/60 transition-colors">
                          {String(day).padStart(2, '0')}
                        </th>
                      ))}
                      
                      <th className="border-r border-b px-3 py-3 font-bold text-right text-xs uppercase tracking-wider bg-brand/5 text-brand min-w-[110px]">Closing Stock</th>
                      <th className="border-r border-b px-2 py-3 font-semibold text-right text-muted-foreground text-[10px] uppercase tracking-wider min-w-[70px]">Min</th>
                      <th className="border-r border-b px-2 py-3 font-semibold text-right text-muted-foreground text-[10px] uppercase tracking-wider min-w-[70px]">Reorder</th>
                      <th className="border-r border-b px-2 py-3 font-semibold text-right text-muted-foreground text-[10px] uppercase tracking-wider min-w-[70px]">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrixMaterials.map((material) => {
                      const matLedger = matrixLedger.filter(e => e.materialId === material.id);
                      const sortedEntries = [...matLedger].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      
                      let openingStockForMonth = material.openingStock;
                      let closingStockForMonth = material.closingStock;
                      
                      if (sortedEntries.length > 0) {
                        openingStockForMonth = sortedEntries[0].runningBalance - sortedEntries[0].quantity;
                        closingStockForMonth = sortedEntries[sortedEntries.length - 1].runningBalance;
                      } else {
                        openingStockForMonth = material.closingStock;
                        closingStockForMonth = material.closingStock;
                      }
                      
                      // Group entries by day of the month
                      const dailyMovementMap: Record<number, number> = {};
                      matLedger.forEach(entry => {
                        const day = new Date(entry.date).getDate();
                        dailyMovementMap[day] = (dailyMovementMap[day] || 0) + entry.quantity;
                      });
                      
                      return (
                        <tr key={material.id} className="hover:bg-muted/30 group transition-colors">
                          <td className="sticky left-0 z-10 bg-card group-hover:bg-muted/50 border-r border-b px-3 py-2.5 text-xs truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors w-[100px] min-w-[100px] max-w-[100px]">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: material.category?.color || '#ccc' }} />
                              <span className="truncate">{material.storageLocation || "—"}</span>
                            </div>
                          </td>
                          <td className="sticky left-[100px] z-10 bg-card group-hover:bg-muted/50 border-r border-b px-3 py-2.5 font-mono text-[10px] text-brand truncate font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors w-[120px] min-w-[120px] max-w-[120px]">
                            {material.partNumber}
                          </td>
                          <td className="sticky left-[220px] z-10 bg-card group-hover:bg-muted/50 border-r border-b px-3 py-2.5 font-medium truncate shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors w-[220px] min-w-[220px] max-w-[220px]" title={material.productName}>
                            {material.productName}
                          </td>
                          
                          <td className="border-r border-b px-2 py-2.5 text-right font-mono font-medium">
                            {material.unitRate ? `₹${material.unitRate.toFixed(2)}` : "—"}
                          </td>
                          <td className="border-r border-b px-2 py-2.5 text-center text-muted-foreground font-medium">
                            {material.unit || "—"}
                          </td>
                          <td className="border-r border-b px-3 py-2.5 text-right font-mono font-bold bg-blue-500/[0.02] text-blue-700 dark:text-blue-400">
                            {openingStockForMonth.toFixed(0)}
                          </td>
                          
                          {daysArray.map((day) => {
                            const qty = dailyMovementMap[day];
                            const isPositive = qty > 0;
                            const isNegative = qty < 0;
                            
                            return (
                              <td 
                                key={day} 
                                className={`border-r border-b px-0.5 py-2.5 text-center font-bold font-mono text-[10px] min-w-[42px] max-w-[42px] transition-colors ${
                                  isPositive 
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400' 
                                    : isNegative 
                                    ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                                    : 'text-muted-foreground/30 font-normal hover:bg-muted/10'
                                }`}
                              >
                                {qty ? (isPositive ? `+${qty.toFixed(0)}` : qty.toFixed(0)) : ""}
                              </td>
                            );
                          })}
                          
                          <td className="border-r border-b px-3 py-2.5 text-right font-mono font-bold bg-brand/[0.02] text-brand">
                            {closingStockForMonth.toFixed(0)}
                          </td>
                          <td className="border-r border-b px-2 py-2.5 text-right font-mono text-muted-foreground">
                            {material.minimumStock !== null && material.minimumStock !== undefined ? material.minimumStock.toFixed(0) : "—"}
                          </td>
                          <td className="border-r border-b px-2 py-2.5 text-right font-mono text-muted-foreground">
                            {material.reorderLevel !== null && material.reorderLevel !== undefined ? material.reorderLevel.toFixed(0) : "—"}
                          </td>
                          <td className="border-r border-b px-2 py-2.5 text-right font-mono text-muted-foreground">
                            {material.maximumStock !== null && material.maximumStock !== undefined ? material.maximumStock.toFixed(0) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

