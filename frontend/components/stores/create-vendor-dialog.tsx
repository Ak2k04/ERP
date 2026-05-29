"use client";

import React, { useState } from "react";
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard,
  Banknote,
  Info,
  Loader2,
  CheckCircle2
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";

interface CreateVendorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateVendorDialog({ isOpen, onOpenChange, onSuccess }: CreateVendorDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    vendorName: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    panNumber: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pinCode: "",
    bankName: "",
    bankAccount: "",
    ifscCode: "",
    paymentTerms: "",
    notes: ""
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const handleSubmit = async () => {
    if (!formData.vendorName || !formData.phone) {
      toast.error("Vendor Name and Phone are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/stores/vendors`, formData, { withCredentials: true });
      toast.success("Vendor registered successfully");
      onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({
        vendorName: "", contactPerson: "", phone: "", email: "",
        gstNumber: "", panNumber: "", address1: "", address2: "",
        city: "", state: "", pinCode: "", bankName: "",
        bankAccount: "", ifscCode: "", paymentTerms: "", notes: ""
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to register vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
        <div className="bg-brand p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 />
              Register New Vendor
            </DialogTitle>
            <DialogDescription className="text-brand-foreground/80">
              Complete the profile to add this supplier to the registry.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          <Tabs defaultValue="basic" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6 bg-muted/50 p-1">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="tax">Tax & Legal</TabsTrigger>
              <TabsTrigger value="bank">Bank Details</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendor Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      className="pl-10"
                      placeholder="Enter company name"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Person</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      className="pl-10"
                      placeholder="Full name"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      className="pl-10"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      className="pl-10"
                      type="email"
                      placeholder="vendor@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-muted-foreground" size={16} />
                  <textarea 
                    className="w-full min-h-[80px] pl-10 pr-3 py-2 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Complete address details..."
                    value={formData.address1}
                    onChange={(e) => setFormData({ ...formData, address1: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tax" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      className="pl-10 font-mono"
                      placeholder="29AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">PAN Number</label>
                  <Input 
                    className="font-mono"
                    placeholder="ABCDE1234F"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Terms</label>
                <Input 
                  placeholder="e.g. Net 30, Advance, Cash on Delivery"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                />
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank Name</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    className="pl-10"
                    placeholder="e.g. HDFC Bank, ICICI Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Number</label>
                  <Input 
                    className="font-mono"
                    placeholder="00001234567890"
                    value={formData.bankAccount}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IFSC Code</label>
                  <Input 
                    className="font-mono"
                    placeholder="HDFC0001234"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-8 border-t pt-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              className="bg-brand hover:bg-brand-dark px-8" 
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</>
              ) : (
                "Save Vendor Profile"
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
