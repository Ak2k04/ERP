"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import axios from "axios";
import ImportMaterialDialog from "@/components/production/import-material-dialog";
import DeleteConfirmationDialog from "@/components/production/delete-confirmation-dialog";

interface Material {
  id: string;
  storageLocation: string | null;
  partNumber: string;
  productName: string;
  unitRate: number | null;
  unit: string | null;
  currentStock: number | null;
  minimumStock: number | null;
  reorderLevel: number | null;
  maximumStock: number | null;
  category?: string | null;
}

export default function MaterialMasterPage() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [storageFilter, setStorageFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locations, setLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [deletingPartNumber, setDeletingPartNumber] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDeleteMaterial = (id: string, partNumber: string) => {
    setDeletingMaterialId(id);
    setDeletingPartNumber(partNumber);
    setIsConfirmingDelete(true);
  };

  const handleDeleteMaterialConfirm = async () => {
    if (!deletingMaterialId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/materials/${deletingMaterialId}`, { withCredentials: true });
      toast.success("Material deleted successfully");
      setIsConfirmingDelete(false);
      fetchMaterials();
      fetchLocations();
      fetchCategories();
    } catch (error: any) {
      console.error("Failed to delete material:", error.message);
      toast.error(error.response?.data?.message || "Failed to delete material");
    } finally {
      setIsDeleting(false);
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/materials`, {
        params: {
          search: searchTerm,
          storageLocation: storageFilter === "All" ? undefined : storageFilter,
          category: categoryFilter === "All" ? undefined : categoryFilter,
          page: pagination.page,
          limit: pagination.limit,
        },
        withCredentials: true
      });
      setMaterials(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error("Failed to fetch materials:", error.message);
      toast.error("Failed to fetch materials");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/materials/locations`, {
        withCredentials: true
      });
      setLocations(response.data.data);
    } catch (error: any) {
      console.error("Failed to fetch locations:", error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/materials/categories`, {
        withCredentials: true
      });
      setCategories(response.data.data);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error.message);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [searchTerm, storageFilter, categoryFilter, pagination.page]);

  useEffect(() => {
    fetchLocations();
    fetchCategories();
  }, []);

  const getStockBadge = (material: Material) => {
    const { currentStock, minimumStock, reorderLevel } = material;
    if (currentStock === null || reorderLevel === null || minimumStock === null) return null;

    if (currentStock > reorderLevel) {
      return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">Optimal</Badge>;
    } else if (currentStock <= minimumStock) {
      return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Critical</Badge>;
    } else {
      return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">Reorder</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Material Master</h1>
          <p className="text-muted-foreground">Manage your component database and stock levels.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload size={16} />
            Import Excel
          </Button>
          <Button className="bg-brand hover:bg-brand-dark flex items-center gap-2">
            <Plus size={16} />
            Add Material
          </Button>
        </div>
      </div>

      <ImportMaterialDialog 
        isOpen={isImportOpen} 
        onOpenChange={setIsImportOpen}
        onSuccess={fetchMaterials}
      />

      <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search by part number or name..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-muted-foreground" />
                <select 
                  className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select 
                  className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  value={storageFilter}
                  onChange={(e) => setStorageFilter(e.target.value)}
                >
                  <option value="All">All Locations</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <Button variant="ghost" size="icon" title="Export Excel">
                <Download size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Storage Location</th>
                  <th className="px-4 py-3 font-semibold">Part Number</th>
                  <th className="px-4 py-3 font-semibold">Product Name</th>
                  <th className="px-4 py-3 font-semibold text-right">Rate</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold text-center">Stock Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Current Stock</th>
                  <th className="px-4 py-3 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-muted rounded w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : materials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Package size={48} className="opacity-20" />
                        <p className="text-lg font-medium">No materials found</p>
                        <p>Import from Excel or add manually to get started.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  materials.map((material) => (
                    <tr key={material.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        {material.category ? (
                          <Badge variant="secondary" className="font-normal text-[10px]">{material.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Uncategorized</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{material.storageLocation || "-"}</td>
                      <td className="px-4 py-3 font-mono text-brand font-medium">{material.partNumber}</td>
                      <td className="px-4 py-3">{material.productName}</td>
                      <td className="px-4 py-3 text-right">₹{material.unitRate?.toLocaleString() || "0"}</td>
                      <td className="px-4 py-3">{material.unit || "-"}</td>
                      <td className="px-4 py-3 text-center">{getStockBadge(material)}</td>
                      <td className="px-4 py-3 text-right font-medium">{material.currentStock?.toLocaleString() || "0"}</td>
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Edit size={14} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-destructive cursor-pointer"
                              onClick={() => handleOpenDeleteMaterial(material.id, material.partNumber)}
                            >
                              <Trash2 size={14} /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} materials
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, i) => (
                  <Button
                    key={i}
                    variant={pagination.page === i + 1 ? "default" : "outline"}
                    size="sm"
                    className={pagination.page === i + 1 ? "bg-brand hover:bg-brand-dark" : ""}
                    onClick={() => setPagination(prev => ({ ...prev, page: i + 1 }))}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page === pagination.pages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <DeleteConfirmationDialog 
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete Material"
        description={`Are you sure you want to permanently delete the Material with Part Number "${deletingPartNumber}"? This action is irreversible and can only be performed if the material is not linked to any BOMs.`}
        onConfirm={handleDeleteMaterialConfirm}
        isProcessing={isDeleting}
      />
    </div>
  );
}
