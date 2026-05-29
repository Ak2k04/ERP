"use client";

import React, { useState } from "react";
import { 
  FolderKanban, 
  X, 
  Loader2, 
  CheckCircle2,
  Calendar,
  User,
  Building2,
  Package
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

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateProjectDialog({ isOpen, onOpenChange, onSuccess }: CreateProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    customerName: "",
    productName: "",
    productCode: "",
    batchSize: "",
    description: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.customerName || !formData.productName) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/projects`, {
        ...formData,
        batchSize: formData.batchSize ? parseInt(formData.batchSize) : null,
      }, { withCredentials: true });
      
      toast.success("Project created successfully!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        projectName: "",
        projectCode: "",
        customerName: "",
        productName: "",
        productCode: "",
        batchSize: "",
        description: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="text-brand" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Register a new manufacturing project to link BOMs and track production.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name *</label>
              <Input 
                name="projectName"
                placeholder="e.g. Smart Meter Batch A" 
                value={formData.projectName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Code</label>
              <Input 
                name="projectCode"
                placeholder="e.g. PRJ-2024-001" 
                value={formData.projectCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Customer Name *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                name="customerName"
                className="pl-10"
                placeholder="Client or Department name" 
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  name="productName"
                  className="pl-10"
                  placeholder="e.g. T050 Toilet Switch" 
                  value={formData.productName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Batch Size</label>
              <Input 
                name="batchSize"
                type="number"
                placeholder="Quantity to produce" 
                value={formData.batchSize}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea 
              name="description"
              className="w-full min-h-[80px] p-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Enter project goals or notes..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand hover:bg-brand-dark" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
