"use client";

import React, { useState } from "react";
import { 
  Upload, 
  FileText, 
  X, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
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
import CreateBomForm from "./create-bom-form";

interface UploadBomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function UploadBomDialog({ isOpen, onOpenChange, onSuccess }: UploadBomDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Please upload a PDF or an Image (JPG/PNG)");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/boms/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      
      setExtractedData(response.data.data);
      toast.success("BOM Extracted successfully! Please review the data.");
    } catch (error: any) {
      console.error("Extraction failed:", error.message);
      toast.error("AI Extraction failed. You can still create it manually.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setExtractedData(null);
    onOpenChange(false);
  };

  // If data is extracted, show the review form (CreateBomForm prefilled)
  if (extractedData) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="p-6 border-b bg-brand/5 flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="text-brand" size={20} />
                Review Extracted BOM
              </DialogTitle>
              <DialogDescription>
                AI has extracted data from your PDF. Please verify and correct any mistakes.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancel}>
              <X size={20} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <CreateBomForm 
              initialData={extractedData}
              onCancel={handleCancel}
              onSuccess={() => {
                onSuccess();
                handleCancel();
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="text-brand" />
            Upload & Extract BOM (PDF/Image)
          </DialogTitle>
          <DialogDescription>
            Upload a PDF or Image of a BOM to automatically extract line items using AI.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              file ? "border-brand bg-brand/5" : "border-muted-foreground/20 hover:border-brand/50"
            }`}
          >
            {file ? (
              <div className="space-y-3">
                <div className="h-12 w-12 bg-brand/10 rounded-full flex items-center justify-center mx-auto text-brand">
                  <FileText size={24} />
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
                  <Upload size={24} />
                </div>
                <div>
                  <p className="font-medium text-sm underline text-brand">Click to upload PDF or Image</p>
                  <p className="text-xs text-muted-foreground mt-1">Accepts .pdf, .jpg, .png</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="bg-brand/5 p-4 rounded-lg border border-brand/10 flex gap-3 items-start">
            <Sparkles className="text-brand shrink-0" size={18} />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-brand uppercase">AI-Powered Extraction</p>
              <p className="text-xs text-muted-foreground">
                Our AI will read the PDF and extract Part Codes, Quantities, and Descriptions automatically. 
                You can review and edit before saving.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel} disabled={isExtracting}>
            Cancel
          </Button>
          <Button 
            className="bg-brand hover:bg-brand-dark" 
            onClick={handleExtract} 
            disabled={!file || isExtracting}
          >
            {isExtracting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Extracting Data...</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Start AI Extraction</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
