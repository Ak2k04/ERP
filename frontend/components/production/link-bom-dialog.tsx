"use client";

import React, { useState, useEffect } from "react";
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
import { Search, Loader2, Link2, Unlink2, ClipboardList, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LinkBomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
  projectName: string | null;
  onSuccess: () => void;
}

export default function LinkBomDialog({ isOpen, onOpenChange, projectId, projectName, onSuccess }: LinkBomDialogProps) {
  const [boms, setBoms] = useState<any[]>([]);
  const [linkedBomIds, setLinkedBomIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const loadData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [allBomsRes, projectRes] = await Promise.all([
        axios.get(`${API_URL}/boms`, { withCredentials: true }),
        axios.get(`${API_URL}/projects/${projectId}`, { withCredentials: true })
      ]);
      
      setBoms(allBomsRes.data.data);
      
      const linkedIds = projectRes.data.data.projectBoms.map((pb: any) => pb.bomId);
      setLinkedBomIds(linkedIds);
    } catch (error) {
      console.error("Failed to load project BOM data:", error);
      toast.error("Failed to load project details and BOM registry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      loadData();
      setSearchTerm("");
    }
  }, [isOpen, projectId]);

  const handleToggleLink = async (bomId: string, isCurrentlyLinked: boolean) => {
    if (!projectId) return;
    setIsProcessing(bomId);
    
    try {
      if (isCurrentlyLinked) {
        // Unlink BOM
        await axios.delete(`${API_URL}/projects/${projectId}/boms/${bomId}`, { withCredentials: true });
        setLinkedBomIds(prev => prev.filter(id => id !== bomId));
        toast.success("BOM unlinked from project successfully");
      } else {
        // Link BOM
        await axios.post(`${API_URL}/projects/${projectId}/boms`, { bomId }, { withCredentials: true });
        setLinkedBomIds(prev => [...prev, bomId]);
        toast.success("BOM linked to project successfully");
      }
      onSuccess();
    } catch (error: any) {
      console.error("Failed to update BOM link status:", error);
      toast.error(error.response?.data?.message || "Failed to update BOM project relationship");
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredBoms = boms.filter(bom => 
    bom.bomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bom.documentRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bom.product && bom.product.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Link2 className="text-brand" size={22} />
            Link BOMs to Project
          </DialogTitle>
          <DialogDescription>
            Manage the Bills of Materials allocated specifically for <span className="font-bold text-foreground">{projectName}</span>. Only linked BOMs will be selectable during generation.
          </DialogDescription>
        </DialogHeader>

        <div className="relative my-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input 
            placeholder="Search BOM by name, code, or product..." 
            className="pl-9 text-xs h-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1 border rounded-lg divide-y bg-muted/10 min-h-[250px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[250px] gap-2 text-muted-foreground text-xs">
              <Loader2 className="animate-spin text-brand" size={24} />
              <span>Fetching Bills of Materials...</span>
            </div>
          ) : filteredBoms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground text-xs italic">
              No matching Bills of Materials found.
            </div>
          ) : (
            filteredBoms.map(bom => {
              const isLinked = linkedBomIds.includes(bom.id);
              const processing = isProcessing === bom.id;
              
              return (
                <div 
                  key={bom.id} 
                  className={`flex items-center justify-between p-3.5 transition-colors hover:bg-muted/30 ${isLinked ? 'bg-brand/5' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 mr-3">
                    <input
                      type="checkbox"
                      id={`bom-${bom.id}`}
                      checked={isLinked}
                      disabled={processing}
                      onChange={() => handleToggleLink(bom.id, isLinked)}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand accent-brand cursor-pointer mt-1"
                    />
                    <label 
                      htmlFor={`bom-${bom.id}`}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs truncate text-foreground">{bom.bomName}</span>
                        {isLinked && (
                          <Badge className="bg-brand/10 text-brand border-brand/20 font-mono text-[9px] scale-90 origin-left py-0">Linked</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{bom.documentRef}</p>
                      <p className="text-[10px] text-muted-foreground/75 mt-0.5">Product: {bom.product} • Ver: {bom.version}</p>
                    </label>
                  </div>
                  
                  <div>
                    {processing ? (
                      <Loader2 className="animate-spin text-muted-foreground" size={16} />
                    ) : isLinked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-500/10 font-bold"
                        onClick={() => handleToggleLink(bom.id, true)}
                      >
                        <Unlink2 size={12} className="mr-1" /> Unlink
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-[10px] text-brand hover:text-brand hover:bg-brand/5 font-bold border-brand/20"
                        onClick={() => handleToggleLink(bom.id, false)}
                      >
                        <Link2 size={12} className="mr-1" /> Link BOM
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="mt-4 pt-4 border-t gap-2 sm:gap-0">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1 mr-auto py-2">
            <CheckCircle2 size={12} className="text-green-500" />
            <span>Changes are saved instantly to the database.</span>
          </div>
          <Button className="bg-brand hover:bg-brand-dark px-6 text-xs h-9 font-bold" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
