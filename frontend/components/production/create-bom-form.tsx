"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  X,
  Search,
  Loader2,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { motion, Reorder } from "framer-motion";

interface BomLineItem {
  id: string; // temp id for reordering
  partCode: string;
  acHead: string;
  itemsComponents: string;
  qty: number;
  qtyReqd: number;
  qtyIssd: number;
  balance: number;
}

interface CreateBomFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  initialData?: any;
}

export default function CreateBomForm({ onCancel, onSuccess, initialData }: CreateBomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [header, setHeader] = useState({
    bomName: initialData?.bomName || "",
    documentRef: initialData?.documentRef || "FM/STR/002/Ver 0",
    version: initialData?.version || "Ver 0",
    product: initialData?.product || "",
    productCode: initialData?.productCode || "",
    description: initialData?.description || "",
    defaultAcHead: initialData?.defaultAcHead || "14",
    imageUrl: initialData?.imageUrl || "",
  });

  const [lineItems, setLineItems] = useState<BomLineItem[]>(
    initialData?.lineItems?.map((item: any) => ({
      ...item,
      id: Math.random().toString(),
    })) || [
      { id: "1", partCode: "", acHead: "14", itemsComponents: "", qty: 0, qtyReqd: 0, qtyIssd: 0, balance: 0 }
    ]
  );

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const [materials, setMaterials] = useState<any[]>([]);
  const [isSearchingMaterial, setIsSearchingMaterial] = useState(false);

  useEffect(() => {
    if (initialData) {
      setHeader({
        bomName: initialData.bomName || "",
        documentRef: initialData.documentRef || "FM/STR/002/Ver 0",
        version: initialData.version || "Ver 0",
        product: initialData.product || "",
        productCode: initialData.productCode || "",
        description: initialData.description || "",
        defaultAcHead: initialData.defaultAcHead || "14",
        imageUrl: initialData.imageUrl || "",
      });
      if (initialData.lineItems) {
        setLineItems(initialData.lineItems.map((item: any) => ({
          ...item,
          id: Math.random().toString(),
        })));
      }
    }
  }, [initialData]);

  const addRow = () => {
    setLineItems([
      ...lineItems,
      { id: Math.random().toString(), partCode: "", acHead: header.defaultAcHead, itemsComponents: "", qty: 0, qtyReqd: 0, qtyIssd: 0, balance: 0 }
    ]);
  };

  const removeRow = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof BomLineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === "qty" || field === "qtyReqd" || field === "qtyIssd") {
          updated.balance = (updated.qtyReqd || 0) - (updated.qtyIssd || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const handlePartCodeSearch = async (id: string, term: string) => {
    if (term.length < 2) return;
    setIsSearchingMaterial(true);
    try {
      const response = await axios.get(`${API_URL}/materials`, {
        params: { search: term, limit: 5 },
        withCredentials: true
      });
      setMaterials(response.data.data);
    } catch (error) {
      console.error("Search failed");
    } finally {
      setIsSearchingMaterial(false);
    }
  };

  const selectMaterial = (id: string, material: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        return {
          ...item,
          partCode: material.partNumber,
          itemsComponents: material.productName,
          acHead: item.acHead || header.defaultAcHead
        };
      }
      return item;
    }));
    setMaterials([]);
  };

  const handleSubmit = async (status: "DRAFT" | "ACTIVE") => {
    if (!header.bomName || !header.product) {
      toast.error("Please fill in the BOM Name and Product Name");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/boms`, {
        ...header,
        status,
        lineItems,
        signatures: {
          indentedBy: "Current User", // Replace with real session data
        }
      }, { withCredentials: true });
      
      toast.success(status === "ACTIVE" ? "BOM saved to registry" : "BOM saved as draft");
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save BOM");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create New BOM</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSubmit("DRAFT")} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save as Draft"}
          </Button>
          <Button className="bg-brand hover:bg-brand-dark" onClick={() => handleSubmit("ACTIVE")} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save to Registry"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Header */}
        <Card className="lg:col-span-1 border-none shadow-sm h-fit">
          <CardHeader>
            <CardTitle className="text-lg">BOM Header Details</CardTitle>
            <CardDescription>Document reference: FM/STR/002</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">BOM Name</label>
              <Input 
                placeholder="e.g. T050 Toilet Switch BOM" 
                value={header.bomName}
                onChange={(e) => setHeader({ ...header, bomName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Code</label>
                <Input 
                  placeholder="e.g. T050" 
                  value={header.productCode}
                  onChange={(e) => setHeader({ ...header, productCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Version</label>
                <Input 
                  value={header.version}
                  onChange={(e) => setHeader({ ...header, version: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name</label>
              <Input 
                placeholder="Full product description" 
                value={header.product}
                onChange={(e) => setHeader({ ...header, product: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Default A/C Head</label>
              <Input 
                type="number"
                value={header.defaultAcHead}
                onChange={(e) => setHeader({ ...header, defaultAcHead: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL (Optional)</label>
              <Input 
                placeholder="https://example.com/image.jpg" 
                value={header.imageUrl}
                onChange={(e) => setHeader({ ...header, imageUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="Enter any additional notes..."
                value={header.description}
                onChange={(e) => setHeader({ ...header, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Line Items */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Line Items</CardTitle>
              <CardDescription>Components and materials for this BOM</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addRow} className="flex items-center gap-2">
              <Plus size={14} /> Add Row
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="p-2 w-10"></th>
                    <th className="p-2 text-left">Part Code #</th>
                    <th className="p-2 text-left">A/C Head</th>
                    <th className="p-2 text-left">Items/Components</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Qty Reqd</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-muted/10 transition-colors">
                      <td className="p-2 text-muted-foreground cursor-grab">
                        <GripVertical size={16} />
                      </td>
                      <td className="p-2 min-w-[150px] relative">
                        <Input 
                          className="h-8 text-xs font-mono"
                          value={item.partCode}
                          placeholder="Search..."
                          onChange={(e) => {
                            updateLineItem(item.id, "partCode", e.target.value);
                            handlePartCodeSearch(item.id, e.target.value);
                          }}
                        />
                        {/* Search Results Dropdown */}
                        {item.partCode.length >= 2 && materials.length > 0 && (
                          <div className="absolute left-2 top-full z-10 w-64 bg-background border rounded-md shadow-xl p-1 mt-1">
                            {materials.map(m => (
                              <button
                                key={m.id}
                                className="w-full text-left p-2 hover:bg-muted rounded text-xs flex flex-col"
                                onClick={() => selectMaterial(item.id, m)}
                              >
                                <span className="font-bold text-brand">{m.partNumber}</span>
                                <span className="text-muted-foreground truncate">{m.productName}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-2 w-20">
                        <Input 
                          className="h-8 text-xs"
                          value={item.acHead}
                          onChange={(e) => updateLineItem(item.id, "acHead", e.target.value)}
                        />
                      </td>
                      <td className="p-2 min-w-[200px]">
                        <Input 
                          className="h-8 text-xs"
                          value={item.itemsComponents}
                          onChange={(e) => updateLineItem(item.id, "itemsComponents", e.target.value)}
                        />
                      </td>
                      <td className="p-2 w-20">
                        <Input 
                          type="number"
                          className="h-8 text-xs text-right"
                          value={item.qty}
                          onChange={(e) => updateLineItem(item.id, "qty", parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="p-2 w-24">
                        <Input 
                          type="number"
                          className="h-8 text-xs text-right"
                          value={item.qtyReqd}
                          onChange={(e) => updateLineItem(item.id, "qtyReqd", parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="p-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeRow(item.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
