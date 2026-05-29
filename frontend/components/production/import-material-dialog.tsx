"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileSpreadsheet, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileUp
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

interface ImportMaterialDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportMaterialDialog({ isOpen, onOpenChange, onSuccess }: ImportMaterialDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [conflictAction, setConflictAction] = useState<"SKIP" | "UPDATE">("SKIP");
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("default");
  const [newCategory, setNewCategory] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/materials/categories`, { withCredentials: true });
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setImportResults(null);
      setFile(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension !== 'xlsx' && extension !== 'xls') {
        toast.error("Please upload an Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const categoryToUse = selectedCategory === "new" ? newCategory : (selectedCategory === "default" ? "" : selectedCategory);
    
    if (selectedCategory === "new" && !newCategory) {
      toast.error("Please enter a new category name");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conflictAction', conflictAction);
    formData.append('category', categoryToUse);

    try {
      const response = await axios.post(`${API_URL}/materials/import-excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setImportResults(response.data.data);
      toast.success("Import completed successfully");
      if (response.data.data.new > 0 || response.data.data.updated > 0) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Import failed:", error.message);
      toast.error(error.response?.data?.message || "Import failed. Please check the file format.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="text-brand" />
            Import Material Master
          </DialogTitle>
          <DialogDescription>
            Upload your Stock Sheet Excel file (FM/STR/001 format).
          </DialogDescription>
        </DialogHeader>

        {!importResults ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Assign to Category:</label>
              <div className="flex flex-col gap-2">
                <select 
                  className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="default">No Category (General)</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="new">+ Create New Category</option>
                </select>
                
                {selectedCategory === "new" && (
                  <Input 
                    placeholder="Enter new category name..."
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="animate-in fade-in slide-in-from-top-1 duration-200"
                  />
                )}
              </div>
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? "border-brand bg-brand/5" : "border-muted-foreground/20 hover:border-brand/50"
              }`}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto text-brand">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="h-8">
                    Change File
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer space-y-3 block">
                  <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                    <FileUp size={24} />
                  </div>
                  <div>
                    <p className="font-medium text-sm underline text-brand">Click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">Accepts .xlsx, .xls only</p>
                  </div>
                  <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} />
                </label>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">On Conflict (Part Number already exists):</label>
              <div className="flex gap-4">
                <button 
                  className={`flex-1 p-3 rounded-lg border text-sm text-left transition-all ${
                    conflictAction === "SKIP" ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-muted bg-muted/20 hover:bg-muted/50"
                  }`}
                  onClick={() => setConflictAction("SKIP")}
                >
                  <p className="font-bold">Skip</p>
                  <p className="text-[10px] text-muted-foreground">Keep existing data</p>
                </button>
                <button 
                  className={`flex-1 p-3 rounded-lg border text-sm text-left transition-all ${
                    conflictAction === "UPDATE" ? "border-brand bg-brand/5 ring-1 ring-brand" : "border-muted bg-muted/20 hover:bg-muted/50"
                  }`}
                  onClick={() => setConflictAction("UPDATE")}
                >
                  <p className="font-bold">Update</p>
                  <p className="text-[10px] text-muted-foreground">Overwrite with new values</p>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <p className="text-2xl font-bold text-green-600">{importResults.new}</p>
                <p className="text-[10px] uppercase font-bold text-green-600/70">New</p>
              </div>
              <div className="p-4 bg-brand/10 rounded-xl border border-brand/20">
                <p className="text-2xl font-bold text-brand">{importResults.updated}</p>
                <p className="text-[10px] uppercase font-bold text-brand/70">Updated</p>
              </div>
              <div className="p-4 bg-muted rounded-xl border border-muted-foreground/10">
                <p className="text-2xl font-bold text-muted-foreground">{importResults.skipped}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground/70">Skipped</p>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-destructive flex items-center gap-1">
                  <AlertCircle size={12} /> Errors Found ({importResults.errors.length})
                </p>
                <div className="max-h-[150px] overflow-y-auto bg-destructive/5 rounded-lg border border-destructive/10 p-3">
                  <ul className="text-[10px] space-y-1 text-destructive/80">
                    {importResults.errors.map((err: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="opacity-50">•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {!importResults ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button 
                className="bg-brand hover:bg-brand-dark" 
                onClick={handleImport} 
                disabled={!file || isUploading}
              >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Start Import
              </Button>
            </>
          ) : (
            <Button className="w-full bg-brand hover:bg-brand-dark" onClick={() => onOpenChange(false)}>
              Close Summary
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
