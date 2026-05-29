import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isUp: boolean;
  };
  iconColor?: string;
  className?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, iconColor, className }: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-sm bg-card", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:scale-110",
            iconColor || "bg-brand-light text-brand"
          )}>
            <Icon size={24} />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1.5">
            <div className={cn(
              "flex items-center text-xs font-bold px-1.5 py-0.5 rounded",
              trend.isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {trend.isUp ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
              {trend.value}%
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
