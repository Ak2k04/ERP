"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Calculator,
  Loader2,
  Building2,
  Calendar,
  IndianRupee,
  Package
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "../ui/select";
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

interface CreatePoDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreatePoDialog({ isOpen, onOpenChange, onSuccess }: CreatePoDialogProps) {
  const [vendors, setVendors] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [header, setHeader] = useState({
    vendorId: "",
    poDate: new Date().toISOString().split('T')[0],
    expectedDelivery: "",
    deliverTo: "Teller Technologies Private Limited, Bangalore",
    notes: ""
  });
  const [items, setItems] = useState<any[]>([
    { materialId: "", description: "", qty: 1, rate: 0 }
  ]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    if (isOpen) {
      fetchVendors();
      fetchMaterials();
    }
  }, [isOpen]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${API_URL}/stores/vendors`, { withCredentials: true });
      setVendors(res.data.data);
    } catch (err) {}
  };

  const fetchMaterials = async () => {
    try {
      const res = await axios.get(`${API_URL}/stores/materials?limit=100`, { withCredentials: true });
      setMaterials(res.data.data);
    } catch (err) {}
  };

  const addItem = () => {
    setItems([...items, { materialId: "", description: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Auto-fill description/rate if material is selected
    if (field === "materialId") {
      const mat = materials.find(m => m.id === value);
      if (mat) {
        newItems[index].description = mat.productName;
        newItems[index].rate = mat.unitRate || 0;
      }
    }
    setItems(newItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  };

  const subtotal = calculateSubtotal();
  const sgst = subtotal * 0.09;
  const cgst = subtotal * 0.09;
  const total = subtotal + sgst + cgst;

  const handleSubmit = async () => {
    if (!header.vendorId) {
      toast.error("Please select a vendor");
      return;
    }
    if (items.some(i => !i.description || i.qty <= 0)) {
      toast.error("Please check all item descriptions and quantities");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/stores/purchase-orders`, {
        ...header,
        items,
        subtotal,
        sgstAmount: sgst,
        cgstAmount: cgst,
        totalAmount: total
      }, { withCredentials: true });
      
      toast.success("Purchase Order created");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create PO");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-brand p-6 text-white shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <FileText />
              New Purchase Order
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl border bg-muted/20">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Vendor</label>
              <Select value={header.vendorId} onValueChange={(val) => setHeader({ ...header, vendorId: val })}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select Vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.vendorName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">PO Date</label>
              <Input 
                type="date" 
                className="bg-background"
                value={header.poDate}
                onChange={(e) => setHeader({ ...header, poDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Expected Delivery</label>
              <Input 
                type="date" 
                className="bg-background"
                value={header.expectedDelivery}
                onChange={(e) => setHeader({ ...header, expectedDelivery: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase text-muted-foreground">Line Items</h3>
              <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-[10px] gap-1">
                <Plus size={12} /> Add Item
              </Button>
            </div>
            <div className="rounded-xl border bg-background overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[30%] text-xs">Material / Description</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Rate</TableHead>
                    <TableHead className="text-xs text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="group">
                      <TableCell>
                        <div className="space-y-2">
                          <Select 
                            value={item.materialId} 
                            onValueChange={(val) => updateItem(index, "materialId", val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select existing material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map(m => (
                                <SelectItem key={m.id} value={m.id}>{m.partNumber} - {m.productName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input 
                            placeholder="Custom description if not in inventory..." 
                            className="h-8 text-xs"
                            value={item.description}
                            onChange={(e) => updateItem(index, "description", e.target.value)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          className="h-8 w-20"
                          value={item.qty}
                          onChange={(e) => updateItem(index, "qty", parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="relative">
                          <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                          <Input 
                            type="number" 
                            className="h-8 w-28 pl-6"
                            value={item.rate}
                            onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{(item.qty * item.rate).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground px-1">Notes & Instructions</label>
              <textarea 
                className="w-full min-h-[120px] p-3 rounded-xl border bg-muted/10 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Shipping instructions, payment terms details..."
                value={header.notes}
                onChange={(e) => setHeader({ ...header, notes: e.target.value })}
              />
            </div>
            <div className="bg-brand/5 rounded-xl border border-brand/10 p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SGST (9%)</span>
                <span className="font-medium">₹{sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CGST (9%)</span>
                <span className="font-medium">₹{cgst.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-brand/20 flex justify-between items-center">
                <span className="font-bold text-brand">Total Amount</span>
                <span className="text-2xl font-bold text-brand">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-muted/50 shrink-0 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Discard</Button>
          <Button 
            className="bg-brand hover:bg-brand-dark px-10" 
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing PO...</>
            ) : (
              "Generate Purchase Order"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
