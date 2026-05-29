"use client";

import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  User,
  Projector,
  FileText,
  AlertCircle,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import ProcessIssueDialog from "@/components/stores/process-issue-dialog";

export default function IssueRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/issue-requests`, { withCredentials: true });
      setRequests(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch issue requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="gap-1 bg-amber-500/10 text-amber-500 border-amber-500/20"><Clock size={12} /> Pending</Badge>;
      case 'PARTIAL': return <Badge className="bg-blue-500 gap-1"><PackageSearch size={12} /> Partial</Badge>;
      case 'COMPLETE': return <Badge className="bg-green-500 gap-1"><CheckCircle2 size={12} /> Complete</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Issuance</h1>
          <p className="text-muted-foreground">Review and fulfill material requests from the Production department.</p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <div className="flex items-center justify-between bg-card/30 p-1 rounded-lg border border-dashed">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="pending" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">Pending Requests</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-brand data-[state=active]:text-white">Issue History</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 pr-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input 
                placeholder="Search project or BOM..." 
                className="h-8 w-[200px] pl-8 text-xs bg-background border-none"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Filter size={14} /> Filter
            </Button>
          </div>
        </div>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl border animate-pulse bg-muted/20" />
            ))
          ) : requests.filter(r => r.status !== 'COMPLETE').length === 0 ? (
            <div className="py-20 text-center border rounded-xl border-dashed">
              <ClipboardList size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-lg font-bold">No pending requests</h3>
              <p className="text-muted-foreground">You're all caught up! New requests from Production will appear here.</p>
            </div>
          ) : (
            requests.filter(r => r.status !== 'COMPLETE').map((request) => (
              <Card key={request.id} className="group hover:border-brand/50 transition-all border-none shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-5 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] uppercase">{request.id.slice(0, 8)}</Badge>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> Requested {new Date(request.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand">
                            <Projector size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Project</p>
                            <p className="font-bold text-sm truncate max-w-[200px]">PRJ-2024-001 - Project Alpha</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">BOM Reference</p>
                            <p className="font-bold text-sm truncate max-w-[200px]">BOM-0842 - Control Panel V2</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Requested By</p>
                            <p className="font-bold text-sm">Amaks (Production)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-brand/5 md:border-l p-6 flex flex-col justify-center gap-3">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Items requested</p>
                        <p className="text-2xl font-bold text-brand">{request.issueItems?.length || 0}</p>
                      </div>
                      <Button 
                        className="bg-brand hover:bg-brand-dark gap-2"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsProcessing(true);
                        }}
                      >
                        Process Issue <ArrowRight size={16} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {/* History table or list */}
          <div className="py-20 text-center border rounded-xl border-dashed">
            <p className="text-muted-foreground">Historical issue records will be listed here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <ProcessIssueDialog 
          isOpen={isProcessing}
          onOpenChange={setIsProcessing}
          request={selectedRequest}
          onSuccess={fetchRequests}
        />
      )}
    </div>
  );
}
