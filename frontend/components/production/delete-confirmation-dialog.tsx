"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  isProcessing?: boolean;
}

export default function DeleteConfirmationDialog({ 
  isOpen, 
  onOpenChange, 
  title, 
  description, 
  onConfirm,
  isProcessing = false
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] border border-red-500/10">
        <DialogHeader className="flex flex-col items-center text-center space-y-3 pt-4">
          <div className="h-12 w-12 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-full flex items-center justify-center animate-bounce">
            <AlertTriangle size={24} />
          </div>
          <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed px-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 gap-3 sm:space-x-0 pt-4 pb-2">
          <Button 
            type="button" 
            variant="ghost" 
            className="h-10 text-xs font-bold w-full hover:bg-slate-100"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            className="h-10 text-xs font-bold w-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...</>
            ) : (
              "Permanently Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
