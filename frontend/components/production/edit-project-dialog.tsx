"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderKanban, 
  Loader2, 
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

interface EditProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
  onSuccess: () => void;
}

export default function EditProjectDialog({ isOpen, onOpenChange, project, onSuccess }: EditProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    projectCode: "",
    customerName: "",
    productName: "",
    productCode: "",
    batchSize: "",
    description: "",
    status: "ACTIVE"
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName || "",
        projectCode: project.projectCode || "",
        customerName: project.customerName || "",
        productName: project.productName || "",
        productCode: project.productCode || "",
        batchSize: project.batchSize ? project.batchSize.toString() : "",
        description: project.description || "",
        status: project.status || "ACTIVE"
      });
    }
  }, [project, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      await axios.patch(`${API_URL}/projects/${project.id}`, {
        ...formData,
        batchSize: formData.batchSize ? parseInt(formData.batchSize) : null,
      }, { withCredentials: true });
      
      toast.success("Project updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update project");
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
            Edit Project details
          </DialogTitle>
          <DialogDescription>
            Update metadata fields or pipeline statuses for the selected project.
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

          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Pipeline Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-background border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand font-medium h-10"
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
