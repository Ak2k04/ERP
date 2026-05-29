"use client";

import React, { useState, useEffect } from "react";
import { 
  PackageSearch, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Info,
  Warehouse,
  History,
  Settings2
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import axios from "axios";

interface ProcessIssueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  request: any;
  onSuccess: () => void;
}

export default function ProcessIssueDialog({ isOpen, onOpenChange, request, onSuccess }: ProcessIssueDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueData, setIssueData] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    if (isOpen && request) {
      // Initialize issue data with requested quantities
      const initial = request.issueItems.map((item: any) => ({
        issueItemId: item.id,
        partCode: item.partCode,
        componentName: item.componentName,
        qtyRequired: item.qtyRequired,
        qtyIssued: item.qtyIssued,
        qtyToIssue: Math.min(item.qtyRequired - item.qtyIssued, 0), // Default to 0 or match stock
        materialId: item.materialId
      }));
      setIssueData(initial);
      fetchInventoryStatus();
    }
  }, [isOpen, request]);

  const fetchInventoryStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/stores/materials?limit=100`, { withCredentials: true });
      setMaterials(res.data.data);
    } catch (err) {}
  };

  const getStock = (materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    return mat ? mat.closingStock - mat.reservedStock : 0;
  };

  const handleQtyChange = (index: number, val: string) => {
    const qty = parseFloat(val) || 0;
    const newData = [...issueData];
    newData[index].qtyToIssue = qty;
    setIssueData(newData);
  };

  const autoFulfill = () => {
    const newData = issueData.map(item => {
      const available = getStock(item.materialId);
      const pending = item.qtyRequired - item.qtyIssued;
      return {
        ...item,
        qtyToIssue: Math.min(available, pending)
      };
    });
    setIssueData(newData);
  };

  const handleSubmit = async () => {
    const itemsToIssue = issueData.filter(i => i.qtyToIssue > 0);
    if (itemsToIssue.length === 0) {
      toast.error("Please specify quantities to issue");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/stores/issue-requests/${request.id}/issue`, {
        items: itemsToIssue.map(i => ({
          issueItemId: i.issueItemId,
          qtyToIssue: i.qtyToIssue
        }))
      }, { withCredentials: true });
      
      toast.success("Materials issued successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to process issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] p-0 overflow-hidden max-h-[95vh] flex flex-col">
        <div className="bg-brand p-6 text-white shrink-0">
          <div className="flex justify-between items-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Warehouse />
                Warehouse Issuance Review
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-4 text-xs font-bold bg-white/10 p-2 rounded-lg backdrop-blur-sm">
              <div className="flex items-center gap-1"><Info size={14} /> Review physical stock vs requested amounts</div>
              <Button variant="secondary" size="sm" className="h-7 text-[10px]" onClick={autoFulfill}>
                Auto-Fulfill Based on Stock
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-4 gap-4 px-4 py-3 rounded-xl border bg-muted/20">
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Request ID</p>
              <p className="font-mono text-sm font-bold">{request.id.slice(0, 12)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Project</p>
              <p className="text-sm font-bold">Project Alpha</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">BOM Reference</p>
              <p className="text-sm font-bold">BOM-0842</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Request Date</p>
              <p className="text-sm font-bold">{new Date(request.requestedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="rounded-xl border bg-background overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[350px] text-xs">Material (Part Code)</TableHead>
                  <TableHead className="text-xs text-center">Required</TableHead>
                  <TableHead className="text-xs text-center">Already Issued</TableHead>
                  <TableHead className="text-xs text-center">Warehouse Stock</TableHead>
                  <TableHead className="w-[180px] text-xs text-right bg-brand/5 text-brand font-bold italic">To Issue Now</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issueData.map((item, index) => {
                  const stock = getStock(item.materialId);
                  const isShort = stock < (item.qtyRequired - item.qtyIssued);
                  
                  return (
                    <TableRow key={index} className={item.qtyToIssue > 0 ? "bg-brand/5" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-bold text-sm">{item.componentName}</p>
                          <p className="font-mono text-[10px] text-brand">{item.partCode}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.qtyRequired}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.qtyIssued}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-bold ${stock === 0 ? 'text-red-500' : isShort ? 'text-amber-500' : 'text-green-500'}`}>
                            {stock}
                          </span>
                          {isShort && <span className="text-[10px] text-amber-600 font-bold uppercase">Shortage</span>}
                        </div>
                      </TableCell>
                      <TableCell className="bg-brand/5">
                        <div className="flex justify-end items-center gap-2">
                          <Input 
                            type="number" 
                            className={`h-9 w-24 text-right font-bold border-brand/20 focus:ring-brand ${item.qtyToIssue > stock ? 'border-red-500 text-red-500' : ''}`}
                            value={item.qtyToIssue}
                            onChange={(e) => handleQtyChange(index, e.target.value)}
                            max={stock}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-brand"
                            onClick={() => handleQtyChange(index, Math.min(stock, item.qtyRequired - item.qtyIssued).toString())}
                          >
                            <Settings2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/50 shrink-0 flex justify-between items-center">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-brand"></div> 
            <span>Blue items will be deducted from inventory and logged in ledger</span>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              className="bg-brand hover:bg-brand-dark px-12 h-12 text-base font-bold shadow-lg" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Committing to Ledger...</>
              ) : (
                <><CheckCircle2 className="mr-2 h-5 w-5" /> Confirm Material Issue</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
