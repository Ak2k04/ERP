"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Factory, 
  Warehouse, 
  ShieldCheck, 
  Users, 
  BadgeCheck, 
  UserCircle, 
  Settings, 
  HelpCircle, 
  Bug, 
  ChevronLeft,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Package,
  ClipboardList,
  FolderKanban,
  FileOutput,
  BookOpen,
  FileText,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  section: string;
  adminOnly?: boolean;
  subItems?: { title: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "MAIN" },
  { 
    title: "Production", 
    href: "/dashboard/production", 
    icon: Factory, 
    section: "DEPARTMENTS",
    subItems: [
      { title: "Overview", href: "/dashboard/production", icon: LayoutDashboard },
      { title: "Material Master", href: "/dashboard/production/material-master", icon: Package },
      { title: "BOM Registry", href: "/dashboard/production/bom-registry", icon: ClipboardList },
      { title: "Projects", href: "/dashboard/production/projects", icon: FolderKanban },
      { title: "Generate BOM", href: "/dashboard/production/generate-bom", icon: FileOutput },
    ]
  },
  { 
    title: "Stores", 
    href: "/dashboard/stores", 
    icon: Warehouse, 
    section: "DEPARTMENTS",
    subItems: [
      { title: "Overview", href: "/dashboard/stores", icon: LayoutDashboard },
      { title: "Inventory Master", href: "/dashboard/stores/inventory", icon: Package },
      { title: "Issue Materials", href: "/dashboard/stores/issues", icon: ClipboardList },
      { title: "Stock Analytics", href: "/dashboard/stores/analytics", icon: LayoutDashboard },
      { title: "Daily Ledger", href: "/dashboard/stores/ledger", icon: BookOpen },
      { title: "Vendor Registry", href: "/dashboard/stores/vendors", icon: Users },
      { title: "Purchase Order", href: "/dashboard/stores/purchase-orders", icon: FileText },
      { title: "Alerts", href: "/dashboard/stores/alerts", icon: AlertTriangle },
    ]
  },
  { title: "Admin Panel", href: "/dashboard/admin", icon: ShieldCheck, section: "MANAGEMENT", adminOnly: true },
  { title: "User Management", href: "/dashboard/admin/users", icon: Users, section: "MANAGEMENT", adminOnly: true },
  { title: "Approvals", href: "/dashboard/admin/approvals", icon: BadgeCheck, section: "MANAGEMENT", adminOnly: true },
  { title: "My Profile", href: "/dashboard/profile", icon: UserCircle, section: "ACCOUNT" },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, section: "ACCOUNT" },
  { title: "Help & Docs", href: "/dashboard/help", icon: HelpCircle, section: "SUPPORT" },
  { title: "Report a Bug", href: "/dashboard/bug", icon: Bug, section: "SUPPORT" },
];

import { useSession, signOut } from "next-auth/react";

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }: { 
  isOpen: boolean; 
  setIsOpen: (v: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Production", "Stores"]);

  const toggleExpand = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const user = {
    name: session?.user?.name || "User",
    role: (session?.user as any)?.role || "DEPARTMENT_ADMIN",
    initials: (session?.user?.name || "U").split(' ').map(n => n[0]).join('').toUpperCase()
  };

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const sections = ["MAIN", "DEPARTMENTS", "MANAGEMENT", "ACCOUNT", "SUPPORT"];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-sidebar-bg text-sidebar-foreground sidebar-transition flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="min-w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14H11V21L20 10H13Z" />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="font-bold text-lg tracking-tight whitespace-nowrap">AdminHub</span>
            )}
          </Link>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className={cn("sidebar-transition", isCollapsed && "rotate-180")} size={20} />
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <TooltipProvider delayDuration={0}>
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6">
            {sections.map((section) => {
              const items = navItems.filter(item => item.section === section);
              if (items.length === 0) return null;

              return (
                <div key={section} className="space-y-1">
                  {!isCollapsed && (
                    <h4 className="px-3 text-[10px] font-bold tracking-widest text-sidebar-section uppercase mb-2">
                      {section}
                    </h4>
                  )}
                  {items.map((item) => {
                    const isExpanded = expandedItems.includes(item.title);
                    const active = pathname === item.href || (item.subItems?.some(s => pathname === s.href));
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="space-y-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {item.subItems && !isCollapsed ? (
                              <button
                                onClick={() => toggleExpand(item.title)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                                  active 
                                    ? "bg-sidebar-active-bg/20 text-white" 
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-hover-bg hover:text-sidebar-foreground"
                                )}
                              >
                                <Icon size={20} className={cn(active ? "text-white" : "text-sidebar-icon group-hover:text-sidebar-foreground")} />
                                <span className="text-sm font-medium flex-1 text-left">{item.title}</span>
                                <ChevronDown size={14} className={cn("transition-transform", isExpanded && "rotate-180")} />
                              </button>
                            ) : (
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group",
                                  active 
                                    ? "bg-sidebar-active-bg text-sidebar-active-foreground" 
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-hover-bg hover:text-sidebar-foreground",
                                  isCollapsed && "justify-center px-0"
                                )}
                              >
                                {active && (
                                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-white rounded-r-full" />
                                )}
                                <Icon size={20} className={cn(active ? "text-sidebar-active-foreground" : "text-sidebar-icon group-hover:text-sidebar-foreground")} />
                                {!isCollapsed && <span className="text-sm font-medium">{item.title}</span>}
                              </Link>
                            )}
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right" className="bg-brand text-white border-none">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>

                        {/* Sub Items */}
                        {item.subItems && isExpanded && !isCollapsed && (
                          <div className="ml-4 pl-4 border-l border-white/10 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                            {item.subItems.map((sub) => {
                              const subActive = pathname === sub.href;
                              const SubIcon = sub.icon;
                              return (
                                <Link
                                  key={sub.href}
                                  href={sub.href}
                                  className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all",
                                    subActive 
                                      ? "text-white bg-white/10" 
                                      : "text-sidebar-foreground/50 hover:text-white hover:bg-white/5"
                                  )}
                                >
                                  <SubIcon size={16} />
                                  <span className="text-xs font-medium">{sub.title}</span>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-white/10 bg-black/5">
          <div className={cn(
            "flex items-center gap-3",
            isCollapsed && "flex-col gap-4"
          )}>
            <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold shrink-0 border-2 border-white/20">
              {user.initials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                  {user.role}
                </span>
              </div>
            )}
            <button 
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-red-500/20 text-sidebar-icon hover:text-red-400 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
