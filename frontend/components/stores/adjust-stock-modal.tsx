"use client";

import React, { useState } from "react";
import { 
  RefreshCcw, 
  ArrowUpRight, 
  ArrowDownRight, 
  Settings2,
  Loader2,
  Calendar as CalendarIcon
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
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
import { toast } from "sonner";
import axios from "axios";

interface AdjustStockModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  material: any;
  onSuccess: () => void;
}

export default function AdjustStockModal({ isOpen, onOpenChange, material, onSuccess }: AdjustStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "IN",
    quantity: "",
    reason: "",
    date: new Date().toISOString().split('T')[0],
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/stores/materials/adjust`, {
        ...formData,
        materialId: material.id
      }, { withCredentials: true });
      
      toast.success("Stock adjusted successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        type: "IN",
        quantity: "",
        reason: "",
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to adjust stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="text-brand" />
            Adjust Stock Level
          </DialogTitle>
          <DialogDescription>
            Record stock movements for {material.productName} ({material.partNumber})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adjustment Type</label>
              <Select 
                value={formData.type} 
                onValueChange={(val) => setFormData({ ...formData, type: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN" className="text-green-600">Stock In (+)</SelectItem>
                  <SelectItem value="OUT" className="text-red-600">Stock Out (-)</SelectItem>
                  <SelectItem value="ADJUSTMENT" className="text-blue-600">Absolute Correction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity ({material.unit || "pcs"})</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                type="date" 
                className="pl-10"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason / Reference</label>
            <textarea 
              className="w-full min-h-[80px] p-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="e.g. Received from PO #123, Production return, or Corrected physical count"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <div className="p-3 bg-muted/30 rounded-lg border border-dashed text-xs text-muted-foreground">
            Current Stock: <span className="font-bold text-foreground">{material.closingStock}</span>
            <br />
            New Estimated Stock: <span className="font-bold text-brand">
              {formData.type === "IN" 
                ? material.closingStock + (parseFloat(formData.quantity) || 0)
                : formData.type === "OUT"
                  ? material.closingStock - (parseFloat(formData.quantity) || 0)
                  : (parseFloat(formData.quantity) || material.closingStock)}
            </span>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand-dark" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Committing...</>
              ) : (
                "Commit Adjustment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
