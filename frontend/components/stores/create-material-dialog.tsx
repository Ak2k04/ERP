"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  X, 
  Loader2, 
  Tag,
  Warehouse,
  IndianRupee,
  Activity
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
import { toast } from "sonner";
import axios from "axios";

interface CreateMaterialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateMaterialDialog({ isOpen, onOpenChange, onSuccess }: CreateMaterialDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    partNumber: "",
    productName: "",
    categoryId: "",
    storageLocation: "",
    unitRate: "",
    unit: "pcs",
    openingStock: "0",
    minimumStock: "",
    reorderLevel: "",
    maximumStock: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/stores/categories`, { withCredentials: true });
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partNumber || !formData.productName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/stores/materials`, {
        ...formData,
        categoryId: formData.categoryId || null,
        unitRate: formData.unitRate ? parseFloat(formData.unitRate) : null,
        openingStock: formData.openingStock ? parseFloat(formData.openingStock) : 0,
        minimumStock: formData.minimumStock ? parseFloat(formData.minimumStock) : null,
        reorderLevel: formData.reorderLevel ? parseFloat(formData.reorderLevel) : null,
        maximumStock: formData.maximumStock ? parseFloat(formData.maximumStock) : null,
      }, { withCredentials: true });
      
      toast.success("Material created successfully!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        partNumber: "",
        productName: "",
        categoryId: "",
        storageLocation: "",
        unitRate: "",
        unit: "pcs",
        openingStock: "0",
        minimumStock: "",
        reorderLevel: "",
        maximumStock: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="text-brand" />
            Add New Material / SKU
          </DialogTitle>
          <DialogDescription>
            Register a new physical material in the Stores Inventory Master.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Part Number / Code *</label>
              <Input 
                name="partNumber"
                placeholder="e.g. SCR-0390001" 
                value={formData.partNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <Input 
                name="productName"
                placeholder="e.g. Screw CSK M2" 
                value={formData.productName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5"><Tag size={14} /> Category</label>
              <select 
                name="categoryId"
                className="w-full h-11 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-2 focus:ring-brand outline-none"
                value={formData.categoryId}
                onChange={handleChange}
              >
                <option value="">Select Category (Optional)</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5"><Warehouse size={14} /> Storage Location</label>
              <Input 
                name="storageLocation"
                placeholder="e.g. Bin P4, Shelf B" 
                value={formData.storageLocation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1.5"><IndianRupee size={14} /> Unit Rate</label>
              <Input 
                name="unitRate"
                type="number"
                step="0.01"
                placeholder="₹ 0.00" 
                value={formData.unitRate}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Input 
                name="unit"
                placeholder="e.g. pcs, meters, kgs" 
                value={formData.unit}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Opening Stock</label>
              <Input 
                name="openingStock"
                type="number"
                step="0.01"
                placeholder="0.00" 
                value={formData.openingStock}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5"><Activity size={14} /> Safety Stock & Stock Alert Rules</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold">Minimum Stock</label>
                <Input 
                  name="minimumStock"
                  type="number"
                  placeholder="e.g. 200" 
                  value={formData.minimumStock}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold">Reorder Level</label>
                <Input 
                  name="reorderLevel"
                  type="number"
                  placeholder="e.g. 250" 
                  value={formData.reorderLevel}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-semibold">Maximum Stock</label>
                <Input 
                  name="maximumStock"
                  type="number"
                  placeholder="e.g. 1000" 
                  value={formData.maximumStock}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand-dark" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
              ) : (
                "Add SKU / Material"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
