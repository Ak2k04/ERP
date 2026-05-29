"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download,
  Calendar,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import CreatePoDialog from "@/components/stores/create-po-dialog";

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchPOs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/purchase-orders`, { withCredentials: true });
      setPos(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch purchase orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="outline" className="gap-1"><Clock size={12} /> Draft</Badge>;
      case 'CONFIRMED': return <Badge className="bg-blue-500 gap-1"><CheckCircle2 size={12} /> Confirmed</Badge>;
      case 'RECEIVED': return <Badge className="bg-amber-500 gap-1"><PackageCheck size={12} /> Partial</Badge>;
      case 'COMPLETED': return <Badge className="bg-green-500 gap-1"><CheckCircle2 size={12} /> Completed</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Monitor procurement cycles and track material receipts.</p>
        </div>
        <Button 
          className="bg-brand hover:bg-brand-dark flex items-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          Create New PO
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card/30 p-1 rounded-lg border border-dashed">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search PO #, vendor, or project..." 
            className="pl-10 border-none bg-transparent focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 pr-2">
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Filter size={14} /> Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            <Download size={14} /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border animate-pulse bg-muted/20" />
          ))
        ) : pos.length === 0 ? (
          <div className="py-20 text-center border rounded-xl border-dashed">
            <FileText size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-bold">No purchase orders found</h3>
            <p className="text-muted-foreground">Formalize your procurement by creating a new PO.</p>
          </div>
        ) : (
          pos.map((po) => (
            <Card key={po.id} className="group hover:border-brand/50 transition-all border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className="p-4 flex-1 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">PO Number</p>
                      <p className="font-bold text-brand">{po.poNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Vendor</p>
                      <p className="font-medium truncate">{po.vendor?.vendorName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">PO Date</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar size={12} />
                        {new Date(po.poDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Amount</p>
                      <p className="font-bold">₹{po.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-end md:justify-start">
                      {getStatusBadge(po.status)}
                    </div>
                  </div>
                  <div className="bg-muted/30 md:border-l p-4 flex md:flex-col justify-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-brand">
                      <Download size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-brand">
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreatePoDialog 
        isOpen={isCreating} 
        onOpenChange={setIsCreating} 
        onSuccess={fetchPOs} 
      />
    </div>
  );
}
