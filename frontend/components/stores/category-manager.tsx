"use client";

import React, { useState, useEffect } from "react";
import { 
  Tag, 
  X, 
  Plus, 
  Trash2, 
  Palette,
  Loader2,
  Check
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import DeleteConfirmationDialog from "../production/delete-confirmation-dialog";

interface CategoryManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

export default function CategoryManager({ isOpen, onOpenChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#3b82f6" });

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/categories`, { withCredentials: true });
      setCategories(response.data.data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newCategory.name) return;
    try {
      await axios.post(`${API_URL}/stores/categories`, newCategory, { withCredentials: true });
      toast.success("Category created");
      setNewCategory({ name: "", color: "#3b82f6" });
      setIsCreating(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create category");
    }
  };

  const handleOpenDelete = (id: string, name: string) => {
    setDeletingId(id);
    setDeletingName(name);
    setIsConfirmingDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/stores/categories/${deletingId}`, { withCredentials: true });
      toast.success("Category deleted successfully");
      setIsConfirmingDelete(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="text-brand" />
            Category Management
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isCreating ? (
            <div className="p-4 rounded-xl border bg-brand/5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category Name</label>
                <Input 
                  placeholder="e.g. Mechanical Parts" 
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Theme Color</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${newCategory.color === color ? 'border-brand scale-110 shadow-lg' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    >
                      {newCategory.color === color && <Check size={14} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-brand" onClick={handleCreate}>Create</Button>
                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full border-dashed gap-2 h-12"
              onClick={() => setIsCreating(true)}
            >
              <Plus size={16} /> Add New Category
            </Button>
          )}

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Active Categories</h3>
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-brand" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-center py-8 text-muted-foreground">No categories yet.</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border group hover:border-brand/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-4 w-4 rounded-full shadow-inner" style={{ backgroundColor: cat.color }} />
                      <div>
                        <p className="text-sm font-semibold">{cat.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-medium">{cat._count.materials} Materials</p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleOpenDelete(cat.id, cat.name)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>

      <DeleteConfirmationDialog 
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete Category"
        description={`Are you sure you want to permanently delete category "${deletingName}"? This action is irreversible.`}
        onConfirm={handleDeleteConfirm}
        isProcessing={isDeleting}
      />
    </Dialog>
  );
}
