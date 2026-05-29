"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Info,
  ArrowRight,
  Settings2,
  Clock,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/alerts`, { withCredentials: true });
      setAlerts(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch alerts");
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/stores/alerts/${id}/read`, {}, { withCredentials: true });
      setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch (error) {}
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-amber-500';
      case 'MEDIUM': return 'bg-blue-500';
      case 'INFO': return 'bg-slate-500';
      default: return 'bg-slate-400';
    }
  };

  const getIcon = (type: string) => {
    if (type.includes('STOCK')) return <AlertTriangle className="text-inherit" size={20} />;
    if (type.includes('PO')) return <CheckCircle2 className="text-inherit" size={20} />;
    return <Info className="text-inherit" size={20} />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts & Notifications</h1>
          <p className="text-muted-foreground">Stay informed about stockouts, overdue POs, and critical movements.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CheckCircle2 size={16} /> Mark all as read
          </Button>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
            <Trash2 size={16} /> Clear all
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-card/30 p-1 rounded-lg border border-dashed">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search notifications..." 
            className="pl-10 border-none bg-transparent focus-visible:ring-0"
          />
        </div>
        <div className="flex gap-2 pr-2">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Filter size={14} /> All Types
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
             Priority
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl border animate-pulse bg-muted/20" />
          ))
        ) : alerts.length === 0 ? (
          <div className="py-20 text-center border rounded-xl border-dashed">
            <Bell size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-bold">Inbox clear</h3>
            <p className="text-muted-foreground">There are no unread alerts at this time.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <Card 
              key={alert.id} 
              className={`group transition-all border-none shadow-sm overflow-hidden ${alert.isRead ? 'bg-card/50 opacity-70' : 'bg-card/80 border-l-4 border-l-brand ring-1 ring-brand/10 shadow-lg'}`}
              onClick={() => !alert.isRead && markAsRead(alert.id)}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className={`w-14 h-20 flex items-center justify-center shrink-0 ${getSeverityColor(alert.severity)} text-white`}>
                    {getIcon(alert.type)}
                  </div>
                  <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold text-sm ${alert.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>{alert.title}</h4>
                        {!alert.isRead && <div className="h-2 w-2 rounded-full bg-brand animate-pulse" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{alert.message}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center justify-end gap-1">
                          <Clock size={10} /> {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</p>
                      </div>
                      {alert.actionUrl && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 rounded-full">
                          <ArrowRight size={14} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="p-4 bg-brand/5 rounded-xl border border-dashed border-brand/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 className="text-brand" size={20} />
          <div>
            <p className="text-sm font-bold">Alert Settings</p>
            <p className="text-xs text-muted-foreground">Configure threshold values and email delivery preferences.</p>
          </div>
        </div>
        <Button variant="outline" size="sm">Configure</Button>
      </div>
    </div>
  );
}
