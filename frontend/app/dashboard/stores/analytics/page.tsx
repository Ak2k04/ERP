"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart as PieChartIcon, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ChevronRight,
  Info,
  ExternalLink
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

export default function StockAnalyticsPage() {
  const [catData, setCatData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/analytics/category-health`, { withCredentials: true });
      setCatData(response.data.data);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const maxValue = Math.max(...catData.map(c => c.value), 1);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Analytics</h1>
          <p className="text-muted-foreground">Deep insights into warehouse valuation and categorical stock health.</p>
        </div>
        <Button className="bg-brand gap-2">
          <Download size={16} /> Generate Inventory Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="text-brand" />
              Category Valuation Distribution
            </CardTitle>
            <CardDescription>Total stock value mapped across material categories.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Activity className="animate-spin text-brand" />
              </div>
            ) : (
              catData.map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-bold">{cat.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4">{cat.count} Items</Badge>
                    </div>
                    <span className="text-sm font-mono font-bold">₹{cat.value.toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-full bg-muted rounded-full overflow-hidden shadow-inner flex">
                    <div 
                      className="h-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${(cat.value / maxValue) * 100}%`,
                        backgroundColor: cat.color,
                        boxShadow: `inset 0 -2px 4px rgba(0,0,0,0.1)`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-brand text-white overflow-hidden relative">
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
              <TrendingUp size={160} />
            </div>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest opacity-80">Total Inventory Asset Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">₹12.48L</div>
              <p className="text-xs mt-2 flex items-center gap-1 text-brand-foreground">
                <ArrowUpRight size={14} /> 4.2% increase from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <TrendingDown size={18} />
                  </div>
                  <span className="text-xs font-bold">Critical Shortages</span>
                </div>
                <Badge className="bg-red-500">12 Items</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                    <TrendingUp size={18} />
                  </div>
                  <span className="text-xs font-bold">Inward Volume (24h)</span>
                </div>
                <Badge className="bg-green-500">+142 pcs</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Layers size={18} />
                  </div>
                  <span className="text-xs font-bold">Dead Stock Identified</span>
                </div>
                <Badge variant="outline" className="text-blue-500 border-blue-500/30">None</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Download({ size }: { size: number }) {
  return <ExternalLink size={size} />;
}
