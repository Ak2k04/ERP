"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  ClipboardList, 
  FileText, 
  PlusCircle, 
  Download, 
  RefreshCw, 
  ArrowRight, 
  Clock, 
  Factory,
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

export default function ProductionPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchStats = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await axios.get(`${API_URL}/projects/analytics/overview`, { withCredentials: true });
      setStats(response.data.data);
    } catch (error: any) {
      console.error("Failed to load production analytics:", error);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadPdfDirect = async (generation: any) => {
    try {
      toast.info(`Fetching PDF for project ${generation.project?.projectCode || ""}`);
      const generationData = JSON.parse(generation.data);
      
      const response = await axios.post(`${API_URL}/generate-bom`, {
        projectId: generation.projectId,
        bomIds: [generation.bomId],
        projectName: generationData.projectName,
        customerName: generationData.customerName,
        productName: generationData.productName,
        costCode: generationData.costCode,
        startDate: generationData.startDate,
        date: generationData.date,
        batchSize: generationData.batchSize,
        signatures: generationData.signatures,
        lineItemOverrides: generationData.lineItems,
        saveRecord: false
      }, { 
        responseType: 'blob',
        withCredentials: true 
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeProjCode = generation.project?.projectCode || "PROJ";
      const safeDate = generationData.date.replace(/[\/\.]/g, "-");
      
      link.setAttribute('download', `${safeProjCode}_BOM_Registry_${safeDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Download failed");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <RefreshCw className="animate-spin text-brand" size={40} />
        <p className="text-sm font-semibold text-muted-foreground animate-pulse">Loading Production Overview...</p>
      </div>
    );
  }

  const kpis = stats?.kpis || {
    projects: { total: 0, active: 0, completed: 0, onHold: 0 },
    boms: { total: 0, active: 0, draft: 0 },
    generations: { total: 0 }
  };

  const recentProjects = stats?.recentProjects || [];
  const recentGenerations = stats?.recentGenerations || [];

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
              <Factory size={20} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Production Overview</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Monitor dynamic projects, verify engineering BOMs, and review issued material registers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 font-bold text-xs gap-1 border-brand/20 text-brand hover:bg-brand/5"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync Board"}
          </Button>
          <Link href="/dashboard/production/generate-bom" passHref>
            <Button size="sm" className="h-9 bg-brand hover:bg-brand-dark text-white font-bold text-xs gap-1.5">
              <PlusCircle size={15} /> Issue New Register
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1 */}
        <Card className="border-l-4 border-l-brand relative overflow-hidden bg-gradient-to-br from-card to-brand/5 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Projects Pipeline</span>
              <CardTitle className="text-3xl font-extrabold">{kpis.projects.active}</CardTitle>
            </div>
            <div className="h-10 w-10 bg-brand/10 text-brand rounded-full flex items-center justify-center">
              <FolderKanban size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">
                Active Manufactures ({kpis.projects.total} total)
              </p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                <TrendingUp size={10} /> Active
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2 */}
        <Card className="border-l-4 border-l-amber-500 relative overflow-hidden bg-gradient-to-br from-card to-amber-50/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">BOMs Registered</span>
              <CardTitle className="text-3xl font-extrabold">{kpis.boms.total}</CardTitle>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-full flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">
                {kpis.boms.active} active • {kpis.boms.draft} draft records
              </p>
              <Badge variant="outline" className="text-[9px] font-mono border-amber-200 text-amber-700 bg-amber-50">Locked</Badge>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3 */}
        <Card className="border-l-4 border-l-emerald-500 relative overflow-hidden bg-gradient-to-br from-card to-emerald-50/20 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Registers Issued</span>
              <CardTitle className="text-3xl font-extrabold">{kpis.generations.total}</CardTitle>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center">
              <FileText size={20} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium">
                Portrait PDF exports dispatched to stores
              </p>
              <Badge variant="outline" className="text-[9px] font-mono border-emerald-200 text-emerald-700 bg-emerald-50">Issued</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Navigation Panels */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">⚡ Quick Action Boards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link href="/dashboard/production/generate-bom" className="group">
            <Card className="h-full border border-brand/10 hover:border-brand bg-gradient-to-r hover:from-brand/5 hover:to-transparent transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-brand text-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold group-hover:text-brand transition-colors flex items-center gap-1">
                    Issue Material <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Generate FM/STR/002 PDF/Excel</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/production/bom-registry" className="group">
            <Card className="h-full border border-amber-500/10 hover:border-amber-500 bg-gradient-to-r hover:from-amber-500/5 hover:to-transparent transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500 text-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ClipboardList size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold group-hover:text-amber-600 transition-colors flex items-center gap-1">
                    BOM Registry <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Upload, parse, and link BOM registers</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/production/projects" className="group">
            <Card className="h-full border border-emerald-500/10 hover:border-emerald-500 bg-gradient-to-r hover:from-emerald-500/5 hover:to-transparent transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FolderKanban size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                    Projects Pipeline <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Monitor client accounts & links</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/production/material-master" className="group">
            <Card className="h-full border border-violet-500/10 hover:border-violet-500 bg-gradient-to-r hover:from-violet-500/5 hover:to-transparent transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-violet-600 text-white rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Factory size={18} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-bold group-hover:text-violet-600 transition-colors flex items-center gap-1">
                    Material Master <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Excel upload & inventory rules</p>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>

      {/* Double Column Grid: Recent Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Projects */}
        <Card className="border border-muted shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-brand">📋 Recent Project Additions</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Last 5 projects created in database registry</CardDescription>
            </div>
            <Link href="/dashboard/production/projects">
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-muted-foreground hover:text-brand flex items-center gap-1">
                View All <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 text-muted-foreground font-bold">
                    <th className="p-2 text-[10px]">Project Code</th>
                    <th className="p-2 text-[10px]">Project Name</th>
                    <th className="p-2 text-[10px]">Product / Client</th>
                    <th className="p-2 text-center text-[10px]">BOMs</th>
                    <th className="p-2 text-center text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium">
                  {recentProjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground italic text-xs">
                        No projects found. Click "Projects Pipeline" to create one.
                      </td>
                    </tr>
                  ) : (
                    recentProjects.map((p: any) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-2 font-mono text-[10px] font-bold text-slate-800">{p.projectCode || "PROJ"}</td>
                        <td className="p-2 font-bold truncate max-w-[130px]">{p.projectName}</td>
                        <td className="p-2">
                          <div className="text-[10px] text-slate-900 font-bold">{p.productName}</div>
                          <div className="text-[9px] text-muted-foreground">{p.customerName}</div>
                        </td>
                        <td className="p-2 text-center text-[10px] font-bold">{p._count?.projectBoms || 0} Linked</td>
                        <td className="p-2 text-center">
                          <Badge 
                            variant="secondary" 
                            className={`text-[9px] font-bold uppercase ${
                              p.status === "ACTIVE" ? "bg-green-500/10 text-green-700 hover:bg-green-500/10" : 
                              p.status === "ON_HOLD" ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10" : 
                              "bg-slate-500/10 text-slate-700 hover:bg-slate-500/10"
                            }`}
                          >
                            {p.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Recent Generations Activity Stream */}
        <Card className="border border-muted shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-emerald-600">📄 Recent Materials Issued Registers</CardTitle>
              <CardDescription className="text-[10px] mt-0.5">Last 5 registers generated as PDF documents</CardDescription>
            </div>
            <Link href="/dashboard/production/generate-bom">
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold text-muted-foreground hover:text-emerald-600 flex items-center gap-1">
                View Issuing Panel <ArrowRight size={12} />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {recentGenerations.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-xs">
                  No records generated yet. Ready to dispatch first FM/STR/002 register!
                </div>
              ) : (
                recentGenerations.map((g: any) => {
                  const genData = JSON.parse(g.data);
                  const issueDateFormatted = genData.date || new Date(g.generatedAt).toLocaleDateString("en-GB");
                  return (
                    <div 
                      key={g.id} 
                      className="flex items-center justify-between p-2.5 rounded-lg border bg-gradient-to-r from-muted/20 to-transparent hover:border-emerald-300 transition-colors gap-2"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="h-8 w-8 bg-emerald-500/10 text-emerald-600 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText size={15} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate" title={g.bom?.bomName}>
                            {g.bom?.bomName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] text-muted-foreground mt-0.5">
                            <span className="font-bold text-slate-600">Proj: {g.project?.projectCode || "PROJ"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-mono"><Clock size={9} /> {issueDateFormatted}</span>
                            <span>•</span>
                            <span>Batch: {genData.batchSize || 1}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 flex items-center justify-center border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 flex-shrink-0"
                        title="Download Document PDF"
                        onClick={() => handleDownloadPdfDirect(g)}
                      >
                        <Download size={13} />
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
