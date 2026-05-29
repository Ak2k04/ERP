"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderKanban, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Link as LinkIcon, 
  MoreVertical,
  ExternalLink,
  Clock,
  User,
  Edit2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import Link from "next/link";
import CreateProjectDialog from "@/components/production/create-project-dialog";
import LinkBomDialog from "@/components/production/link-bom-dialog";
import EditProjectDialog from "@/components/production/edit-project-dialog";
import DeleteConfirmationDialog from "@/components/production/delete-confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Project {
  id: string;
  projectName: string;
  projectCode: string | null;
  customerName: string;
  productName: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  _count: {
    projectBoms: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingProjectId, setLinkingProjectId] = useState<string | null>(null);
  const [linkingProjectName, setLinkingProjectName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isEditing, setIsEditing] = useState(false);
  const [selectedEditProject, setSelectedEditProject] = useState<any>(null);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [deletingProjectName, setDeletingProjectName] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenLinkBom = (projectId: string, projectName: string) => {
    setLinkingProjectId(projectId);
    setLinkingProjectName(projectName);
    setIsLinking(true);
  };

  const handleOpenEditProject = (project: any) => {
    setSelectedEditProject(project);
    setIsEditing(true);
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
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  };


  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/projects`, {
        params: {
          search: searchTerm,
          status: statusFilter === "All" ? undefined : statusFilter,
        },
        withCredentials: true
      });
      setProjects(response.data.data);
    } catch (error: any) {
      console.error("Failed to fetch projects:", error.message);
      toast.error("Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "ON_HOLD": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "COMPLETED": return "bg-brand/10 text-brand border-brand/20";
      case "CANCELLED": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Registry</h1>
          <p className="text-muted-foreground">Manage and track manufacturing projects and their linked BOMs.</p>
        </div>
        <Button 
          className="bg-brand hover:bg-brand-dark flex items-center gap-2"
          onClick={() => setIsCreating(true)}
        >
          <Plus size={16} />
          Create Project
        </Button>
      </div>

      <CreateProjectDialog 
        isOpen={isCreating} 
        onOpenChange={setIsCreating} 
        onSuccess={fetchProjects} 
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-dashed">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            placeholder="Search projects or customers..." 
            className="w-full bg-background border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Filter size={18} className="text-muted-foreground" />
          <select 
            className="bg-background border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse border-none shadow-sm">
              <div className="h-48 bg-muted rounded-xl"></div>
            </Card>
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full py-20 text-center space-y-4">
            <FolderKanban size={64} className="mx-auto opacity-10" />
            <div className="space-y-1">
              <p className="text-xl font-semibold">No projects found</p>
              <p className="text-muted-foreground">Start by creating your first manufacturing project.</p>
            </div>
            <Button className="bg-brand hover:bg-brand-dark">Create Project</Button>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="group border-none shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
              <div className="h-1.5 bg-brand opacity-20 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl group-hover:text-brand transition-colors">
                        {project.projectName}
                      </CardTitle>
                      {project.projectCode && (
                        <Badge variant="outline" className="font-mono text-[10px] uppercase">
                          {project.projectCode}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">{project.customerName}</p>
                  </div>
                  <Badge className={getStatusColor(project.status)}>
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Product</p>
                  <p className="text-sm font-semibold">{project.productName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                      <LinkIcon size={10} /> Linked BOMs
                    </p>
                    <p className="text-sm font-medium">{project._count.projectBoms} BOMs</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                      <Calendar size={10} /> Start Date
                    </p>
                    <p className="text-sm font-medium">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 px-6 mt-auto">
                <div className="flex items-center justify-between w-full border-t pt-4">
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full bg-brand/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-brand">
                      AM
                    </div>
                    <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-muted-foreground">
                      <User size={12} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs flex items-center gap-1 border-brand/20 text-brand hover:bg-brand/5 font-bold"
                      onClick={() => handleOpenLinkBom(project.id, project.projectName)}
                    >
                      <LinkIcon size={12} /> Link BOM
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem 
                          className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          onClick={() => handleOpenEditProject(project)}
                        >
                          <Edit2 size={12} className="text-slate-500" /> Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          onClick={() => handleOpenLinkBom(project.id, project.projectName)}
                        >
                          <LinkIcon size={12} className="text-slate-500" /> Link BOM
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                          onClick={() => handleOpenDeleteProject(project.id, project.projectName)}
                        >
                          <Trash2 size={12} /> Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      <LinkBomDialog 
        isOpen={isLinking}
        onOpenChange={setIsLinking}
        projectId={linkingProjectId}
        projectName={linkingProjectName}
        onSuccess={fetchProjects}
      />

      <EditProjectDialog 
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        project={selectedEditProject}
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
