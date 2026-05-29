"use client";

import React, { useState, useEffect } from "react";
import { 
  MoreVertical, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  History,
  Edit2,
  Trash2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

interface InventoryTableProps {
  status: string | null;
  categoryId?: string | null;
  onAdjustStock?: (material: any) => void;
}

export default function InventoryTable({ status, categoryId = null, onAdjustStock }: InventoryTableProps) {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stores/materials`, {
        params: { status, categoryId, page, limit: 10 },
        withCredentials: true
      });
      setMaterials(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch inventory");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [status, categoryId, page]);

  const getStatusBadge = (available: number, reorder: number, min: number) => {
    if (available === 0) return <Badge className="bg-red-500 text-white border-none">Out of Stock</Badge>;
    if (available <= min) return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Critical</Badge>;
    if (available <= reorder) return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Low Stock</Badge>;
    return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">In Stock</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Storage Loc</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Part Number</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Product Name</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Category</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Available</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Unit</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="animate-pulse">
                  <TableCell colSpan={8} className="h-12 bg-muted/20"></TableCell>
                </TableRow>
              ))
            ) : materials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  No materials found in this category.
                </TableCell>
              </TableRow>
            ) : (
              materials.map((material) => (
                <TableRow key={material.id} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-[10px] text-muted-foreground">
                    {material.storageLocation || "—"}
                  </TableCell>
                  <TableCell className="font-bold text-brand">{material.partNumber}</TableCell>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {material.productName}
                  </TableCell>
                  <TableCell>
                    {material.category ? (
                      <Badge 
                        style={{ backgroundColor: `${material.category.color}10`, color: material.category.color, borderColor: `${material.category.color}20` }}
                        variant="outline"
                      >
                        {material.category.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] uppercase opacity-50">Uncategorized</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {material.closingStock - material.reservedStock}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{material.unit || "pcs"}</TableCell>
                  <TableCell>
                    {getStatusBadge(material.closingStock, material.reorderLevel, material.minimumStock)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem className="gap-2">
                          <ExternalLink size={14} /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <History size={14} /> Movement History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-brand font-medium" onClick={() => onAdjustStock?.(material)}>
                          <Edit2 size={14} /> Adjust Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10">
                          <Trash2 size={14} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <p className="text-sm text-muted-foreground">
            Showing {materials.length} of {pagination.total} items
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
