"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  User,
  Shield,
  Building2,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  LogOut,
  Key,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock users
  const users = [
    {
      id: "1",
      name: "John Doe",
      email: "admin@erp.com",
      role: "SUPER_ADMIN",
      department: "SYSTEM",
      status: "ACTIVE",
      joined: "Oct 10, 2026",
      lastLogin: "2 mins ago",
      initials: "JD"
    },
    {
      id: "2",
      name: "Alice Smith",
      email: "alice@production.com",
      role: "DEPT_ADMIN",
      department: "PRODUCTION",
      status: "PENDING_APPROVAL",
      joined: "Oct 12, 2026",
      lastLogin: "Never",
      initials: "AS"
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@stores.com",
      role: "DEPT_ADMIN",
      department: "STORES",
      status: "DEACTIVATED",
      joined: "Oct 08, 2026",
      lastLogin: "2 days ago",
      initials: "BJ"
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return <Badge variant="success" className="uppercase text-[10px]">Active</Badge>;
      case "PENDING_APPROVAL": return <Badge variant="warning" className="uppercase text-[10px]">Pending Approval</Badge>;
      case "DEACTIVATED": return <Badge variant="secondary" className="bg-slate-200 text-slate-700 uppercase text-[10px]">Deactivated</Badge>;
      default: return <Badge variant="outline" className="uppercase text-[10px]">{status}</Badge>;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage roles, departments, and account statuses.</p>
          </div>
          <Button className="bg-brand hover:bg-brand-dark">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Filters Bar */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search users by name or email..." 
                className="pl-9 bg-muted/50 border-none focus-visible:ring-brand"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="h-10 rounded-md border-none bg-muted/50 px-3 text-sm font-medium focus:ring-2 focus:ring-brand outline-none">
                <option>All Roles</option>
                <option>SuperAdmin</option>
                <option>Dept Admin</option>
              </select>
              <select className="h-10 rounded-md border-none bg-muted/50 px-3 text-sm font-medium focus:ring-2 focus:ring-brand outline-none">
                <option>All Depts</option>
                <option>Production</option>
                <option>Stores</option>
              </select>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Filter size={20} />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/50 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Last Login</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
                          {user.initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Shield size={14} className="text-brand" />
                        {user.role === "SUPER_ADMIN" ? "SuperAdmin" : "Dept Admin"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Building2 size={14} />
                        {user.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {user.joined}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:text-brand">
                            <MoreHorizontal size={18} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View Profile
                          </DropdownMenuItem>
                          {user.status === "PENDING_APPROVAL" && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="mr-2 h-4 w-4" /> Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Key className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {user.status === "ACTIVE" ? (
                              <>
                                <LogOut className="mr-2 h-4 w-4 text-slate-500" /> 
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                <span>Reactivate</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:bg-red-50">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Pagination Placeholder */}
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">Showing <span className="font-medium">1</span> to <span className="font-medium">3</span> of <span className="font-medium">128</span> users</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </>
  );
}
