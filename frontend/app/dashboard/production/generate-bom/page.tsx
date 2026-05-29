"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileOutput, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  FolderKanban, 
  ClipboardList, 
  FileText, 
  Download,
  Loader2,
  AlertCircle,
  Printer,
  RefreshCw,
  Edit2,
  Trash2,
  MoreVertical,
  Plus,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import BOMDocumentPreview from "@/components/production/bom-document-preview";
import CreateProjectDialog from "@/components/production/create-project-dialog";
import EditProjectDialog from "@/components/production/edit-project-dialog";
import LinkBomDialog from "@/components/production/link-bom-dialog";
import DeleteConfirmationDialog from "@/components/production/delete-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export default function GenerateBomPage() {
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedBoms, setSelectedBoms] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0.72);

  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any>(null);
  const [isLinkingProject, setIsLinkingProject] = useState(false);
  const [linkingProjId, setLinkingProjId] = useState<string | null>(null);
  const [linkingProjName, setLinkingProjName] = useState<string | null>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deletingProjectName, setDeletingProjectName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenEditProject = (project: any) => {
    setProjectToEdit(project);
    setIsEditingProject(true);
  };

  const handleOpenLinkBom = (projectId: string, projectName: string) => {
    setLinkingProjId(projectId);
    setLinkingProjName(projectName);
    setIsLinkingProject(true);
  };

  const handleOpenDeleteProject = (projectId: string, name: string) => {
    setDeletingProjectId(projectId);
    setDeletingProjectName(name);
    setIsConfirmingDelete(true);
  };

  const handleDeleteProjectConfirm = async () => {
    if (!deletingProjectId) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/projects/${deletingProjectId}`, { withCredentials: true });
      toast.success("Project deleted successfully!");
      setIsConfirmingDelete(false);
      fetchProjects();
      if (selectedProject?.id === deletingProjectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };
  
  // State for line items to support live updates/overrides
  const [lineItemRows, setLineItemRows] = useState<any[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  const [issueDetails, setIssueDetails] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    batchSize: 15, // matches reference image default batch size
    projectName: "",
    customerName: "",
    productName: "",
    costCode: "12.15.XX.1418",
    startDate: "",
    signatures: {
      indentedBy: "Harshit", // matches reference image
      receivedBy: "Yashwanth", // matches reference image
      issuedBy: "Shantanu", // matches reference image
      reviewedBy: "Admin",
      issuedDate: new Date().toISOString().split('T')[0],
    }
  });

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API_URL}/projects?status=ACTIVE`, { withCredentials: true });
      setProjects(response.data.data);
    } catch (error: any) {
      console.error("Failed to fetch projects:", error.message);
      toast.error("Failed to fetch projects");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSelectProject = async (project: any) => {
    setSelectedProject(project);
    try {
      const response = await axios.get(`${API_URL}/projects/${project.id}`, { withCredentials: true });
      const fullProject = response.data.data;
      setSelectedProject(fullProject);
      setIssueDetails((prev: any) => ({
        ...prev,
        projectName: fullProject.projectName || "",
        customerName: fullProject.customerName || "",
        productName: fullProject.productName || "",
        costCode: fullProject.costCode || "12.15.XX.1418",
        startDate: fullProject.startDate ? new Date(fullProject.startDate).toISOString().split('T')[0] : "",
      }));
      setStep(2); // Auto-advance to Step 2
    } catch (error) {
      console.error("Failed to fetch full project details:", error);
      toast.error("Failed to load project details");
    }
  };

  const handleSelectBom = async (bomId: string) => {
    setSelectedBoms([bomId]);
    setIsLoadingItems(true);
    try {
      const res = await axios.get(`${API_URL}/boms/${bomId}`, { withCredentials: true });
      if (res.data.data && res.data.data.lineItems) {
        const itemsList = res.data.data.lineItems;
        
        // Initialize row items with default values and calculations
        setLineItemRows(itemsList.map((item: any) => {
          const qtyReqd = item.qty * issueDetails.batchSize;
          return {
            ...item,
            bomItemId: item.id,
            qtyReqd,
            qtyIssd: qtyReqd, // Default to fully issued as seen in reference image
            balance: 0
          };
        }));

        setStep(3); // Auto-advance to Step 3
      } else {
        toast.error("BOM has no line items");
      }
    } catch (error) {
      console.error("Failed to load BOM line items:", error);
      toast.error("Failed to load line items for the selected BOM");
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Keep fallback function in case needed or for manual bypass
  const handleProceedToStep3 = async () => {
    if (selectedBoms.length === 0) {
      toast.error("Please select at least one BOM");
      return;
    }
    setIsLoadingItems(true);
    try {
      const itemsList: any[] = [];
      for (const bomId of selectedBoms) {
        const res = await axios.get(`${API_URL}/boms/${bomId}`, { withCredentials: true });
        if (res.data.data && res.data.data.lineItems) {
          itemsList.push(...res.data.data.lineItems);
        }
      }
      
      // Initialize row items with default values and calculations
      setLineItemRows(itemsList.map((item: any) => {
        const qtyReqd = item.qty * issueDetails.batchSize;
        return {
          ...item,
          bomItemId: item.id,
          qtyReqd,
          qtyIssd: qtyReqd,
          balance: 0
        };
      }));

      setStep(3);
    } catch (error) {
      console.error("Failed to load BOM line items:", error);
      toast.error("Failed to load line items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Dynamic calculations on form grid edits
  const handleRowChange = (index: number, field: string, value: any) => {
    setLineItemRows((prev: any[]) => {
      const updated = [...prev];
      let sanitizedValue = value;
      if (field === "qty" || field === "qtyReqd" || field === "qtyIssd") {
        sanitizedValue = Math.max(0, parseFloat(value) || 0);
      }
      updated[index] = { ...updated[index], [field]: sanitizedValue };
      
      if (field === "qty" || field === "qtyReqd" || field === "qtyIssd") {
        const qty = field === "qty" ? sanitizedValue : updated[index].qty;
        const qtyReqd = field === "qtyReqd" ? sanitizedValue : (field === "qty" ? qty * issueDetails.batchSize : updated[index].qtyReqd);
        const qtyIssd = field === "qtyIssd" ? sanitizedValue : updated[index].qtyIssd;
        
        updated[index].qty = qty;
        updated[index].qtyReqd = qtyReqd;
        updated[index].balance = Math.max(0, qtyReqd - qtyIssd);
      }
      return updated;
    });
  };

  const handleBatchSizeChange = (size: number) => {
    const sanitizedSize = Math.max(1, size || 1);
    setIssueDetails((prev: any) => ({ ...prev, batchSize: sanitizedSize }));
    setLineItemRows((prev: any[]) => prev.map((item: any) => {
      const qtyReqd = item.qty * sanitizedSize;
      return {
        ...item,
        qtyReqd,
        qtyIssd: qtyReqd, // keep default aligned
        balance: 0
      };
    }));
  };

  const handleRecalculateAll = () => {
    setLineItemRows((prev: any[]) => prev.map((item: any) => {
      const qtyReqd = item.qty * issueDetails.batchSize;
      return {
        ...item,
        qtyReqd,
        balance: qtyReqd - item.qtyIssd
      };
    }));
    toast.success("Recalculated all required quantities based on batch size!");
  };

  // Actions
  const handleDownloadPdf = async (saveToHistory = false) => {
    setIsDownloadingPdf(true);
    setDownloadProgress("Rendering document...");
    try {
      setTimeout(() => setDownloadProgress("Creating PDF..."), 1000);
      setTimeout(() => setDownloadProgress("Almost done..."), 2200);

      const response = await axios.post(`${API_URL}/generate-bom`, {
        projectId: selectedProject.id,
        bomIds: selectedBoms,
        projectName: issueDetails.projectName,
        customerName: issueDetails.customerName,
        productName: issueDetails.productName,
        costCode: issueDetails.costCode,
        startDate: issueDetails.startDate,
        date: issueDetails.date,
        batchSize: issueDetails.batchSize,
        signatures: issueDetails.signatures,
        lineItemOverrides: lineItemRows.map(row => ({
          bomItemId: row.id,
          qty: row.qty,
          qtyReqd: row.qtyReqd,
          qtyIssd: row.qtyIssd
        })),
        saveRecord: saveToHistory
      }, { 
        responseType: 'blob',
        withCredentials: true 
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeProjCode = selectedProject.projectCode || "PROJ";
      const safeProdCode = selectedProject.productCode || "PROD";
      const safeDate = issueDetails.date.replace(/[\/\.]/g, "-");
      
      link.setAttribute('download', `${safeProjCode}_${safeProdCode}_BOM_${safeDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(saveToHistory ? "Record saved to history & PDF exported!" : "PDF downloaded successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate and download portrait PDF");
    } finally {
      setIsDownloadingPdf(false);
      setDownloadProgress("");
    }
  };

  const handleDownloadExcel = async () => {
    setIsDownloadingExcel(true);
    try {
      const response = await axios.post(`${API_URL}/generate-bom/excel`, {
        projectId: selectedProject.id,
        bomIds: selectedBoms,
        projectName: issueDetails.projectName,
        customerName: issueDetails.customerName,
        productName: issueDetails.productName,
        costCode: issueDetails.costCode,
        startDate: issueDetails.startDate,
        date: issueDetails.date,
        batchSize: issueDetails.batchSize,
        lineItemOverrides: lineItemRows.map(row => ({
          bomItemId: row.id,
          qty: row.qty,
          qtyReqd: row.qtyReqd,
          qtyIssd: row.qtyIssd
        }))
      }, { 
        responseType: 'blob',
        withCredentials: true 
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const safeProjCode = selectedProject.projectCode || "PROJ";
      const safeProdCode = selectedProject.productCode || "PROD";
      const safeDate = issueDetails.date.replace(/[\/\.]/g, "-");

      link.setAttribute('download', `${safeProjCode}_${safeProdCode}_BOM_${safeDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel sheet exported successfully!");
    } catch (error) {
      console.error("Excel generation failed:", error);
      toast.error("Failed to generate and download Excel sheet");
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto print:p-0 print:space-y-0">
      
      {/* Global CSS style overrides for printing */}
      <style jsx global>{`
        @media print {
          header, sidebar, nav, aside, footer, button, .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          body, main, #root, .print-container {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: auto !important;
            height: auto !important;
          }
          .print-target {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            transform: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            visibility: visible !important;
          }
          .print-target * {
            visibility: visible !important;
          }
        }
      `}</style>

      <div className="space-y-1 no-print">
        <h1 className="text-3xl font-bold tracking-tight">Generate BOM</h1>
        <p className="text-muted-foreground">Create a portrait A4 landscape-mirrored Material Request & Issue Register.</p>
      </div>

      {/* 3-Step Stepper */}
      <div className="flex items-center justify-between relative max-w-lg mx-auto no-print">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0" />
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors text-xs font-bold ${
              step >= s ? "bg-brand border-brand text-white" : "bg-background border-muted text-muted-foreground"
            }`}>
              {step > s ? <Check size={14} /> : s}
            </div>
            <span className={`text-[10px] font-medium ${step >= s ? "text-brand" : "text-muted-foreground"}`}>
              {s === 1 ? "Select Project" : s === 2 ? "Select BOM" : "Fill Details & Preview"}
            </span>
          </div>
        ))}
      </div>

      <div className="min-h-[450px]">
        {/* Step 1: Select Project */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 no-print">
            <div className="flex justify-between items-center bg-card/30 p-3 rounded-lg border border-dashed">
              <span className="text-xs text-muted-foreground font-semibold">Select an active client project below or create a new one instantly:</span>
              <Button 
                size="sm" 
                className="h-8 bg-brand hover:bg-brand-dark font-bold text-xs flex items-center gap-1"
                onClick={() => setIsCreatingProject(true)}
              >
                <Plus size={13} /> Create Project
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <Card 
                  key={p.id} 
                  className={`cursor-pointer transition-all border-2 flex flex-col justify-between ${selectedProject?.id === p.id ? "border-brand bg-brand/5 shadow-md" : "border-transparent hover:border-brand/30"}`}
                  onClick={() => handleSelectProject(p)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="text-brand" size={18} />
                        {p.projectCode && <Badge variant="outline" className="text-[10px] uppercase font-mono">{p.projectCode}</Badge>}
                      </div>
                      
                      {/* Action Dropdown Menu */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 p-0 hover:bg-muted">
                              <MoreVertical size={13} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem 
                              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              onClick={() => handleOpenEditProject(p)}
                            >
                              <Edit2 size={12} className="text-slate-500" /> Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                              onClick={() => handleOpenLinkBom(p.id, p.projectName)}
                            >
                              <LinkIcon size={12} className="text-slate-500" /> Link BOM
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                              onClick={() => handleOpenDeleteProject(p.id, p.projectName)}
                            >
                              <Trash2 size={12} /> Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{p.projectName}</CardTitle>
                    <CardDescription>{p.customerName}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm font-medium">Product: {p.productName}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p._count?.projectBoms || 0} BOMs Linked</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select BOM */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(!selectedProject?.projectBoms || selectedProject.projectBoms.length === 0) ? (
                <div className="col-span-full py-16 text-center text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                  <AlertCircle className="text-amber-500" size={32} />
                  <p className="text-sm font-semibold">No BOMs linked to this project.</p>
                  <p className="text-xs">Go to the Project Registry to link Bills of Materials first.</p>
                  <Link href="/dashboard/production/projects" passHref>
                    <Button variant="outline" size="sm" className="mt-3 text-xs border-brand/20 text-brand font-bold hover:bg-brand/5">
                      Go to Project Registry
                    </Button>
                  </Link>
                </div>
              ) : (
                selectedProject.projectBoms.map((pb: any) => {
                  const bom = pb.bom;
                  if (!bom) return null;
                  return (
                    <Card 
                      key={bom.id}
                      className={`cursor-pointer transition-all border-2 ${selectedBoms.includes(bom.id) ? "border-brand bg-brand/5 shadow-md" : "border-transparent hover:border-brand/30"}`}
                      onClick={() => handleSelectBom(bom.id)}
                    >
                      <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                          <CardTitle className="text-md">{bom.bomName}</CardTitle>
                          <CardDescription className="font-mono text-xs mt-0.5">{bom.documentRef}</CardDescription>
                        </div>
                        <ClipboardList className="text-muted-foreground" size={18} />
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">Product: {bom.product}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Version: {bom.version} • {bom._count?.lineItems || 0} items</p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Step 3: Combined Form (Left) and Live Preview (Right) */}
        {step === 3 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            
            {/* Left Panel: Form Control Panel */}
            <div className="space-y-5 bg-card/60 border rounded-xl p-5 shadow-sm no-print">
              <div className="flex items-center justify-between border-b pb-3 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                  ✏️ Document Control Board
                </h2>
                <Badge variant="secondary" className="text-[10px] font-mono">FM/STR/002 Editor</Badge>
              </div>

              {/* Section A: Document Header metadata overrides */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Section A: Document Metadata</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Issue Date</label>
                    <input 
                      type="date"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.date}
                      onChange={(e) => setIssueDetails({ ...issueDetails, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Project Name</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.projectName}
                      onChange={(e) => setIssueDetails({ ...issueDetails, projectName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Contractor (Customer)</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.customerName}
                      onChange={(e) => setIssueDetails({ ...issueDetails, customerName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Product</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.productName}
                      onChange={(e) => setIssueDetails({ ...issueDetails, productName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Cost Code #</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.costCode}
                      onChange={(e) => setIssueDetails({ ...issueDetails, costCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Project Start</label>
                    <input 
                      type="date"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.startDate}
                      onChange={(e) => setIssueDetails({ ...issueDetails, startDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Section B: Batch & Scale overrides */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Section B: Batch Settings</h3>
                <div className="flex items-end gap-3">
                  <div className="space-y-0.5 flex-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Batch Size (Units to Produce)</label>
                    <input 
                      type="number"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.batchSize}
                      onChange={(e) => handleBatchSizeChange(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    className="h-8.5 text-[10px] flex items-center gap-1 border-brand/20 text-brand font-bold"
                    onClick={handleRecalculateAll}
                  >
                    <RefreshCw size={12} /> Recalculate
                  </Button>
                </div>
              </div>

              {/* Section C: Interactive line items grid with overrides */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Section C: Line Item Overrides</h3>
                  <span className="text-[10px] text-muted-foreground">{lineItemRows.length} Materials loaded</span>
                </div>
                <div className="overflow-x-auto border rounded-lg max-h-[280px] bg-background/50">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/70 sticky top-0 backdrop-blur-sm">
                      <tr className="border-b">
                        <th className="p-2 font-bold text-[10px]">Part Code</th>
                        <th className="p-2 font-bold text-[10px]">Component</th>
                        <th className="p-2 font-bold w-12 text-center text-[10px]">Qty</th>
                        <th className="p-2 font-bold w-18 text-center text-[10px]">Reqd</th>
                        <th className="p-2 font-bold w-18 text-center text-[10px]">Issd</th>
                        <th className="p-2 font-bold w-14 text-center text-[10px]">Bal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lineItemRows.map((row, idx) => {
                        const isFullyIssued = row.qtyIssd >= row.qtyReqd && row.qtyIssd > 0;
                        const isOverIssued = row.qtyIssd > row.qtyReqd;
                        const isPartial = row.qtyIssd > 0 && row.qtyIssd < row.qtyReqd;

                        let bgClass = "bg-background";
                        if (isOverIssued) bgClass = "bg-red-500/5 text-red-700 dark:text-red-400";
                        else if (isFullyIssued) bgClass = "bg-green-500/5 text-green-700 dark:text-green-400";
                        else if (isPartial) bgClass = "bg-amber-500/5 text-amber-700 dark:text-amber-400";

                        return (
                          <tr key={idx} className={`${bgClass} transition-colors`}>
                            <td className="p-2 font-mono text-[10px]">{row.partCode}</td>
                            <td className="p-2 truncate max-w-[130px]" title={row.itemsComponents}>
                              {row.itemsComponents}
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={row.qty}
                                onChange={(e) => handleRowChange(idx, "qty", parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border rounded p-1 text-center font-semibold text-[10px]"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={row.qtyReqd}
                                onChange={(e) => handleRowChange(idx, "qtyReqd", parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border rounded p-1 text-center font-semibold text-[10px]"
                              />
                            </td>
                            <td className="p-1">
                              <input
                                type="number"
                                value={row.qtyIssd}
                                onChange={(e) => handleRowChange(idx, "qtyIssd", parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent border rounded p-1 text-center font-semibold text-[10px] focus:ring-1 focus:ring-brand"
                                placeholder="0"
                              />
                            </td>
                            <td className="p-2 text-center font-bold text-[10px]">
                              {isFullyIssued ? "✓ 0" : row.balance}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section D: Signatures text overrides */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider">Section D: Signatures Block</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Indented By</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.signatures.indentedBy}
                      onChange={(e) => setIssueDetails({ 
                        ...issueDetails, 
                        signatures: { ...issueDetails.signatures, indentedBy: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Received By</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.signatures.receivedBy}
                      onChange={(e) => setIssueDetails({ 
                        ...issueDetails, 
                        signatures: { ...issueDetails.signatures, receivedBy: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Issued By</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.signatures.issuedBy}
                      onChange={(e) => setIssueDetails({ 
                        ...issueDetails, 
                        signatures: { ...issueDetails.signatures, issuedBy: e.target.value } 
                      })}
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] font-semibold text-muted-foreground">Reviewed By</label>
                    <input 
                      type="text"
                      className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                      value={issueDetails.signatures.reviewedBy}
                      onChange={(e) => setIssueDetails({ 
                        ...issueDetails, 
                        signatures: { ...issueDetails.signatures, reviewedBy: e.target.value } 
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <label className="text-[10px] font-semibold text-muted-foreground">Issued Date (Signed)</label>
                  <input 
                    type="date"
                    className="w-full bg-background border rounded p-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand font-medium"
                    value={issueDetails.signatures.issuedDate}
                    onChange={(e) => setIssueDetails({ 
                      ...issueDetails, 
                      signatures: { ...issueDetails.signatures, issuedDate: e.target.value } 
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Right Panel: Live A4 Portrait Preview Container with PDF Viewer Chrome */}
            <div className="flex flex-col border rounded-xl shadow-lg overflow-hidden relative max-h-[85vh] h-full flex-1 w-full bg-slate-800 text-slate-200">
              
              {/* PDF Download Progress overlay */}
              {isDownloadingPdf && (
                <div className="absolute inset-0 bg-background/80 z-50 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="animate-spin text-brand" size={40} />
                  <p className="font-bold text-sm text-foreground">{downloadProgress}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Running portrait Puppeteer engine...</p>
                </div>
              )}

              {/* PDF Viewer Top Toolbar */}
              <div className="bg-slate-900 border-b border-slate-700 px-4 py-2 flex items-center justify-between no-print select-none">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    Live Document Sync
                  </span>
                </div>

                {/* PDF Viewer Zoom Controls */}
                <div className="flex items-center gap-1.5 bg-slate-800 rounded px-2 py-0.5 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.max(0.4, z - 0.05))}
                    className="text-xs hover:text-white font-bold px-1 transition-colors"
                    title="Zoom Out"
                  >
                    －
                  </button>
                  <span className="text-[10px] font-mono w-9 text-center font-bold text-slate-300">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.min(1.5, z + 0.05))}
                    className="text-xs hover:text-white font-bold px-1 transition-colors"
                    title="Zoom In"
                  >
                    ＋
                  </button>
                  <div className="h-3 w-px bg-slate-700 mx-1" />
                  <button
                    type="button"
                    onClick={() => setZoom(0.72)}
                    className="text-[9px] hover:text-white font-bold uppercase tracking-wider text-slate-400 transition-colors"
                    title="Fit to Screen"
                  >
                    Fit
                  </button>
                </div>

                <span className="text-[10px] font-mono text-slate-400">FM/STR/002/Ver 0</span>
              </div>

              {/* Scrollable Document Canvas Viewport */}
              <div className="print-target overflow-y-auto w-full flex-1 p-6 flex justify-center bg-slate-700/80 custom-scrollbar relative">
                <BOMDocumentPreview
                  project={selectedProject}
                  bom={selectedProject?.projectBoms?.find((pb: any) => selectedBoms.includes(pb.bomId))?.bom}
                  lineItems={lineItemRows}
                  issueDate={issueDetails.date}
                  batchSize={issueDetails.batchSize}
                  signatures={issueDetails.signatures}
                  scale={zoom}
                />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Navigation & Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t no-print">
        <Button 
          variant="ghost" 
          onClick={() => {
            if (step === 3) {
              setStep(2);
            } else {
              setStep(step - 1);
            }
          }} 
          disabled={step === 1 || isDownloadingPdf || isDownloadingExcel}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={18} /> Back
        </Button>
        
        {step === 1 ? (
          <Button 
            className="bg-brand hover:bg-brand-dark flex items-center gap-2 font-bold text-xs"
            disabled={!selectedProject}
            onClick={() => setStep(2)}
          >
            Select BOM <ChevronRight size={18} />
          </Button>
        ) : step === 2 ? (
          <Button 
            className="bg-brand hover:bg-brand-dark flex items-center gap-2 font-bold text-xs"
            disabled={selectedBoms.length === 0 || isLoadingItems}
            onClick={handleProceedToStep3}
          >
            {isLoadingItems ? <Loader2 className="animate-spin mr-1" size={16} /> : null}
            Generate Preview <ChevronRight size={18} />
          </Button>
        ) : (
          // Action Buttons under Step 3 combined preview
          <div className="flex flex-wrap items-center gap-2.5">
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 text-xs font-bold border-brand/20 text-brand hover:bg-brand/5 h-9"
              onClick={handlePrint}
            >
              <Printer size={15} /> Print
            </Button>
            <Button 
              variant="outline"
              className="flex items-center gap-1.5 text-xs font-bold border-green-600/20 text-green-600 hover:bg-green-600/5 h-9"
              disabled={isDownloadingExcel}
              onClick={handleDownloadExcel}
            >
              {isDownloadingExcel ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />} Excel
            </Button>
            <Button 
              className="bg-brand hover:bg-brand-dark flex items-center gap-1.5 text-xs font-bold h-9"
              disabled={isDownloadingPdf}
              onClick={() => handleDownloadPdf(false)}
            >
              {isDownloadingPdf ? <Loader2 className="animate-spin" size={15} /> : <FileOutput size={15} />} Download PDF
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 text-xs font-bold h-9"
              disabled={isDownloadingPdf}
              onClick={() => handleDownloadPdf(true)}
            >
              {isDownloadingPdf ? <Loader2 className="animate-spin" size={15} /> : <Check size={15} />} Save &amp; Download
            </Button>
          </div>
        )}
      </div>

      <CreateProjectDialog
        isOpen={isCreatingProject}
        onOpenChange={setIsCreatingProject}
        onSuccess={fetchProjects}
      />

      <EditProjectDialog
        isOpen={isEditingProject}
        onOpenChange={setIsEditingProject}
        project={projectToEdit}
        onSuccess={fetchProjects}
      />

      <LinkBomDialog
        isOpen={isLinkingProject}
        onOpenChange={setIsLinkingProject}
        projectId={linkingProjId}
        projectName={linkingProjName}
        onSuccess={fetchProjects}
      />

      <DeleteConfirmationDialog 
        isOpen={isConfirmingDelete}
        onOpenChange={setIsConfirmingDelete}
        title="Delete Project"
        description={`Are you sure you want to permanently delete project "${deletingProjectName}"? This will permanently delete all its linked BOM mappings and generation history.`}
        onConfirm={handleDeleteProjectConfirm}
        isProcessing={isDeleting}
      />
    </div>
  );
}
