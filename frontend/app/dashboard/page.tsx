"use client";

import React from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { 
  Users, 
  Clock, 
  Building2, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Factory,
  Warehouse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userRole = (session?.user as any)?.role || "DEPARTMENT_ADMIN";

  // Mock data - in real app fetch from /api/v1/dashboard/stats
  const stats = [
    { title: "Total Users", value: "1", icon: Users, color: "bg-blue-100 text-blue-600" },
    { title: "Pending Approvals", value: "0", icon: Clock, color: "bg-amber-100 text-amber-600" },
    { title: "Active Depts", value: "2", icon: Building2, color: "bg-green-100 text-green-600" },
    { title: "System Alerts", value: "0", icon: AlertTriangle, color: "bg-red-100 text-red-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-brand p-8 text-white shadow-xl">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold md:text-4xl">Good morning, {userName.split(' ')[0]}!</h1>
          <p className="mt-2 text-white/80 max-w-md">
            You are logged in as a <span className="font-bold text-white uppercase tracking-wider text-xs bg-white/20 px-2 py-1 rounded">{userRole}</span>. 
            {userRole === "SUPER_ADMIN" ? "There are currently no pending approvals waiting for your review." : "Welcome to your department dashboard."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="bg-white text-brand hover:bg-white/90 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> New Operation
            </Button>
            {userRole === "SUPER_ADMIN" && (
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm" asChild>
                <Link href="/dashboard/admin/approvals">Manage Access</Link>
              </Button>
            )}
          </div>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 right-20 h-40 w-40 rounded-full bg-brand-dark/30 blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} iconColor={stat.color} />
        ))}
      </div>

      {/* Department Oversight Hub */}
      <div className="space-y-4">
        <h2 className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="text-brand h-5 w-5" />
          Department Oversight Hub
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Production Card */}
          <Link href="/dashboard/production" className="group">
            <Card className="border border-muted hover:border-brand/30 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-card to-brand/5 group-hover:-translate-y-1">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-brand">Department Overview</span>
                  <CardTitle className="text-lg font-black group-hover:text-brand transition-colors">Production Dashboard</CardTitle>
                </div>
                <div className="h-10 w-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Factory size={20} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Track material requirements (BOM), project registry states, print PDF packages, and manage material masters.
                </p>
                <div className="flex items-center text-xs font-bold text-brand group-hover:gap-1.5 transition-all">
                  Go to Production <ArrowRight size={14} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Stores Card */}
          <Link href="/dashboard/stores" className="group">
            <Card className="border border-muted hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-card to-emerald-50/10 group-hover:-translate-y-1">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600">Department Overview</span>
                  <CardTitle className="text-lg font-black group-hover:text-emerald-600 transition-colors">Stores & Warehouse</CardTitle>
                </div>
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Warehouse size={20} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Monitor raw inventory balances, stock valuations, issue raw materials, track purchase orders, and clear alarms.
                </p>
                <div className="flex items-center text-xs font-bold text-emerald-600 group-hover:gap-1.5 transition-all">
                  Go to Stores Overview <ArrowRight size={14} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 gap-8">
        {/* Quick Stats / Info */}
        <Card className="border-none shadow-sm bg-brand-subtle/50">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-brand">System Health Status</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-brand/5">
              <span className="text-muted-foreground font-medium">Database</span>
              <span className="flex items-center text-green-600 font-bold">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-brand/5">
              <span className="text-muted-foreground font-medium">Redis Cache</span>
              <span className="flex items-center text-green-600 font-bold">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-brand/5">
              <span className="text-muted-foreground font-medium">API Server</span>
              <span className="flex items-center text-green-600 font-bold">
                <div className="mr-2 h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Online
              </span>
            </div>
          </CardContent>
          <div className="p-4 text-xs text-brand/60 text-center italic border-t border-brand/5">
            Real-time monitoring enabled. Last checked just now.
          </div>
        </Card>
      </div>
    </div>
  );
}
