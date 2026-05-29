"use client";

import React, { useState } from "react";
import { 
  Upload, 
  X, 
  Loader2, 
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle
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
import { toast } from "sonner";
import axios from "axios";

interface ImportInventoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ImportInventoryDialog({ isOpen, onOpenChange, onSuccess }: ImportInventoryDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("auto");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/stores/categories`, { withCredentials: true });
        setCategories(response.data.data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, API_URL]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error("Please upload an Excel file (.xlsx or .xls)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('categoryId', selectedCategory);

    setIsUploading(true);
    try {
      const response = await axios.post(`${API_URL}/stores/materials/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setResult(response.data);
      toast.success("Inventory imported successfully");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to import inventory");
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setSelectedCategory("auto");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) reset();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="text-brand" />
            Import from Stock Sheet
          </DialogTitle>
          <DialogDescription>
            Upload the FM/STR/001 Excel file to sync stock levels and locations.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 bg-green-500/10 rounded-xl border border-green-500/20 text-center">
                <CheckCircle2 size={48} className="text-green-500 mb-2" />
                <h4 className="text-lg font-bold text-green-600">Import Complete</h4>
                <p className="text-sm text-green-600/80">{result.message}</p>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle size={14} /> Warnings ({result.errors.length})
                  </div>
                  <div className="max-h-[150px] overflow-y-auto rounded-lg border bg-muted/30 p-3 space-y-1">
                    {result.errors.map((err: string, i: number) => (
                      <p key={i} className="text-[10px] text-muted-foreground font-mono">{err}</p>
                    ))}
                  </div>
                </div>
              )}
              
              <Button className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Target Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-muted-foreground/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                >
                  <option value="auto">✨ Auto-detect from file name (Recommended)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <label className={`
                flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl transition-all cursor-pointer
                ${file ? 'border-brand bg-brand/5' : 'border-muted-foreground/20 hover:border-brand/50 hover:bg-muted/30'}
              `}>
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-brand/20 flex items-center justify-center text-brand">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={(e) => {
                      e.preventDefault();
                      setFile(null);
                    }}>Change File</Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm underline text-brand">Click to upload Stock Sheet</p>
                      <p className="text-xs text-muted-foreground mt-1">Accepts FM/STR/001 format (.xlsx)</p>
                    </div>
                  </div>
                )}
                <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileChange} disabled={isUploading} />
              </label>

              <DialogFooter>
                <Button 
                  className="w-full bg-brand hover:bg-brand-dark" 
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                >
                  {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    "Start Import"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
