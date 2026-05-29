"use client";

import React, { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Plus, 
  Upload, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Copy, 
  Archive, 
  Trash2, 
  FileDown,
  ChevronRight,
  MoreVertical,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";
import CreateBomForm from "@/components/production/create-bom-form";
import UploadBomDialog from "@/components/production/upload-bom-dialog";
import DeleteConfirmationDialog from "@/components/production/delete-confirmation-dialog";


interface Bom {
  id: string;
  bomName: string;
  documentRef: string;
  version: string;
  product: string;
  status: string;
  createdAt: string;
  _count: {
    lineItems: number;
  };
}

export default function BomRegistryPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingBomId, setDeletingBomId] = useState<string | null>(null);
  const [deletingBomName, setDeletingBomName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchBoms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/boms`, {
        params: {
          search: searchTerm,
          status: statusFilter === "All" ? undefined : statusFilter,
          page: pagination.page,
          limit: pagination.limit,
        },
        withCredentials: true
      });
      setBoms(response.data.data);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error("Failed to fetch BOMs:", error.message);
      toast.error("Failed to fetch BOMs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isCreating) fetchBoms();
  }, [searchTerm, statusFilter, pagination.page, isCreating]);

  const handleOpenDeleteBom = (id: string, name: string) => {
    setDeletingBomId(id);
    setDeletingBomName(name);
    setIsConfirmingDelete(true);
  };

  const handleDeleteBomConfirm = async () => {
    if (!deletingBomId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/boms/${deletingBomId}`, { withCredentials: true });
      toast.success("BOM deleted successfully");
      setIsConfirmingDelete(false);
      fetchBoms();
    } catch (error: any) {
      console.error("Failed to delete BOM:", error.message);
      toast.error(error.response?.data?.message || "Failed to delete BOM");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isCreating) {
    return (
      <div className="p-6">
        <CreateBomForm 
          onCancel={() => setIsCreating(false)} 
          onSuccess={() => setIsCreating(false)} 
        />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>;
      case "DRAFT":
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Draft</Badge>;
      case "ARCHIVED":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">BOM Registry</h1>
          <p className="text-muted-foreground">Manage and create Bills of Materials (FM/STR/002 format).</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsUploading(true)}
          >
            <Upload size={16} />
            Upload BOM
          </Button>
          <Button 
            className="bg-brand hover:bg-brand-dark flex items-center gap-2"
            onClick={() => setIsCreating(true)}
          >
            <Plus size={16} />
            Create BOM
          </Button>
        </div>
      </div>

      <UploadBomDialog 
        isOpen={isUploading} 
        onOpenChange={setIsUploading} 
        onSuccess={fetchBoms} 
      />

      <Tabs defaultValue="registry" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="registry" className="flex items-center gap-2">
            <ClipboardList size={16} />
            BOM Registry
          </TabsTrigger>
          <TabsTrigger value="drafts" className="flex items-center gap-2">
            <Edit size={16} />
            Drafts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History size={16} />
            Recent Generations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="mt-6 space-y-6">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input 
                    placeholder="Search by BOM name or product..." 
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
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All Status</option>
                      <option value="ACTIVE">Active Only</option>
                      <option value="ARCHIVED">Archived Only</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 font-semibold">BOM Name</th>
                      <th className="px-4 py-3 font-semibold">Document Ref</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold text-center">Version</th>
                      <th className="px-4 py-3 font-semibold text-center">Items</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                      <th className="px-4 py-3 font-semibold">Created Date</th>
                      <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <td key={j} className="px-4 py-4">
                              <div className="h-4 bg-muted rounded w-full"></div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : boms.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardList size={48} className="opacity-20" />
                            <p className="text-lg font-medium">No BOMs found</p>
                            <p>Create your first Bill of Materials to see it here.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      boms.map((bom) => (
                        <tr key={bom.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3 font-medium">{bom.bomName}</td>
                          <td className="px-4 py-3 font-mono text-xs">{bom.documentRef}</td>
                          <td className="px-4 py-3">{bom.product}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="outline">{bom.version}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">{bom._count.lineItems}</td>
                          <td className="px-4 py-3 text-center">{getStatusBadge(bom.status)}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(bom.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical size={16} />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Eye size={14} /> View Document
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Edit size={14} /> Edit BOM
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Copy size={14} /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <Archive size={14} /> Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 text-destructive" onClick={() => handleOpenDeleteBom(bom.id, bom.bomName)}>
                                  <Trash2 size={14} /> Delete
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 text-brand border-t">
                                  <FileDown size={14} /> Download PDF
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DeleteConfirmationDialog 
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete BOM"
        description={`Are you sure you want to permanently delete the Bill of Material "${deletingBomName}"? This action is irreversible.`}
        onConfirm={handleDeleteBomConfirm}
        isProcessing={isDeleting}
      />
    </div>
  );
}
