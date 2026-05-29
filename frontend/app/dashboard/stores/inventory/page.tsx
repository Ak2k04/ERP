"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Upload, 
  Download,
  AlertTriangle,
  ArrowUpDown,
  MoreVertical,
  ChevronRight,
  RefreshCcw,
  Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import InventoryTable from "@/components/stores/inventory-table";
import CategoryManager from "@/components/stores/category-manager";
import ImportInventoryDialog from "@/components/stores/import-inventory-dialog";
import AdjustStockModal from "@/components/stores/adjust-stock-modal";
import CreateMaterialDialog from "@/components/stores/create-material-dialog";

export default function InventoryMasterPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stores/analytics/overview`, { withCredentials: true });
      setStats(response.data.data);
    } catch (error) {
      console.error("Failed to fetch inventory stats:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/stores/categories`, { withCredentials: true });
      setCategories(response.data.data);
      if (response.data.data.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(response.data.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Master</h1>
          <p className="text-muted-foreground">Manage physical stock, categories, and warehouse locations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsManagingCategories(true)}
          >
            <Tag size={16} />
            Manage Categories
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setIsImporting(true)}
          >
            <Upload size={16} />
            Import Excel
          </Button>
          <Button 
            className="bg-brand hover:bg-brand-dark flex items-center gap-2"
            onClick={() => setIsAddingMaterial(true)}
          >
            <Plus size={16} />
            Add Material
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total SKUs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats.total}</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">₹{(stats.totalValue / 100000).toFixed(2)}L</span>
              <span className="text-[10px] text-muted-foreground">Current Rate</span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-500">{stats.lowStock}</span>
              <AlertTriangle size={14} className="text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-500">{stats.outOfStock}</span>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between bg-card/30 p-1 rounded-lg border border-dashed">
          <TabsList className="bg-transparent border-none">
            <TabsTrigger value="all" className="data-[state=active]:bg-brand data-[state=active]:text-white">All Items</TabsTrigger>
            <TabsTrigger value="category-wise" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Category Wise</TabsTrigger>
            <TabsTrigger value="low" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">Low Stock</TabsTrigger>
            <TabsTrigger value="critical" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">Critical</TabsTrigger>
            <TabsTrigger value="uncategorized" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">Uncategorized</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2 pr-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input 
                placeholder="Search part or product..." 
                className="h-8 w-[250px] pl-8 text-xs bg-background"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Filter size={14} /> Filter
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
              <Download size={14} /> Export
            </Button>
          </div>
        </div>

        <TabsContent value="all" className="mt-4">
          <InventoryTable 
            key={`all-${refreshTrigger}`}
            status={null} 
            onAdjustStock={(material) => {
              setSelectedMaterial(material);
              setIsAdjusting(true);
            }}
          />
        </TabsContent>
        <TabsContent value="category-wise" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Categories</h3>
              <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 pb-3 md:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all shrink-0 md:shrink ${
                      selectedCategoryId === cat.id
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/35 shadow-sm'
                        : 'border-muted-foreground/10 bg-card hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold capitalize max-w-[120px] truncate">{cat.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] py-0.5 px-2 font-bold bg-muted-foreground/10">
                      {cat._count?.materials || 0}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 space-y-4">
              {selectedCategoryId && (
                <div className="p-4 bg-muted/20 border border-dashed rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold capitalize flex items-center gap-2">
                      <span 
                        className="h-3 w-3 rounded-full inline-block" 
                        style={{ backgroundColor: categories.find(c => c.id === selectedCategoryId)?.color }}
                      />
                      {categories.find(c => c.id === selectedCategoryId)?.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Showing all items matching the category {categories.find(c => c.id === selectedCategoryId)?.name}.
                    </p>
                  </div>
                </div>
              )}
              <InventoryTable 
                key={`cat-${selectedCategoryId}-${refreshTrigger}`}
                status={null} 
                categoryId={selectedCategoryId} 
                onAdjustStock={(material) => {
                  setSelectedMaterial(material);
                  setIsAdjusting(true);
                }}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="low" className="mt-4">
          <InventoryTable 
            key={`low-${refreshTrigger}`}
            status="LOW_STOCK" 
            onAdjustStock={(material) => {
              setSelectedMaterial(material);
              setIsAdjusting(true);
            }}
          />
        </TabsContent>
        <TabsContent value="critical" className="mt-4">
          <InventoryTable 
            key={`crit-${refreshTrigger}`}
            status="CRITICAL" 
            onAdjustStock={(material) => {
              setSelectedMaterial(material);
              setIsAdjusting(true);
            }}
          />
        </TabsContent>
        <TabsContent value="uncategorized" className="mt-4">
          <InventoryTable 
            key={`uncat-${refreshTrigger}`}
            status="UNCATEGORIZED" 
            onAdjustStock={(material) => {
              setSelectedMaterial(material);
              setIsAdjusting(true);
            }}
          />
        </TabsContent>
      </Tabs>

      <CategoryManager 
        isOpen={isManagingCategories} 
        onOpenChange={setIsManagingCategories} 
      />

      <ImportInventoryDialog 
        isOpen={isImporting} 
        onOpenChange={setIsImporting} 
        onSuccess={() => {
          fetchStats();
          // Trigger table refresh
        }}
      />

      <AdjustStockModal 
        isOpen={isAdjusting}
        onOpenChange={setIsAdjusting}
        material={selectedMaterial}
        onSuccess={() => {
          fetchStats();
          setRefreshTrigger(prev => prev + 1);
        }}
      />

      <CreateMaterialDialog
        isOpen={isAddingMaterial}
        onOpenChange={setIsAddingMaterial}
        onSuccess={() => {
          fetchStats();
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </div>
  );
}
