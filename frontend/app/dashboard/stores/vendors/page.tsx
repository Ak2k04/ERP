"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard,
  Building2,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Ban
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import CreateVendorDialog from "@/components/stores/create-vendor-dialog";

export default function VendorRegistryPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/vendors`, {
        params: { search },
        withCredentials: true
      });
      setVendors(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch vendors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendor Registry</h1>
          <p className="text-muted-foreground">Manage approved suppliers, contact details, and payment terms.</p>
        </div>
        <Button 
          className="bg-brand hover:bg-brand-dark flex items-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          Register New Vendor
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card/30 p-1 rounded-lg border border-dashed">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search by vendor name, GST, or contact..." 
            className="pl-10 border-none bg-transparent focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline" className="mr-2">{vendors.length} Total Vendors</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl border border-dashed animate-pulse bg-muted/20" />
          ))
        ) : vendors.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <Building2 size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-bold">No vendors found</h3>
            <p className="text-muted-foreground">Get started by registering your first supplier.</p>
          </div>
        ) : (
          vendors.map((vendor) => (
            <Card key={vendor.id} className="group hover:border-brand/50 transition-all hover:shadow-lg overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-2 border-b bg-muted/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{vendor.vendorName}</CardTitle>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{vendor.contactPerson || "No Contact Person"}</p>
                    </div>
                  </div>
                  <Badge className={vendor.isActive ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone size={14} className="text-brand/60" />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail size={14} className="text-brand/60" />
                    <span className="truncate">{vendor.email || "No email provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard size={14} className="text-brand/60" />
                    <span>GST: <span className="font-mono text-xs font-bold text-foreground">{vendor.gstNumber || "N/A"}</span></span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-dashed">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Total POs</p>
                    <p className="font-bold text-lg">{vendor._count?.purchaseOrders || 0}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="group-hover:text-brand gap-2">
                    View Profile <ChevronRight size={14} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateVendorDialog 
        isOpen={isCreating} 
        onOpenChange={setIsCreating} 
        onSuccess={fetchVendors} 
      />
    </div>
  );
}
