"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // I'll implement Badge below
import { 
  Check, 
  X, 
  User, 
  Building2, 
  Clock, 
  Info,
  BadgeCheck,
  History
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectingUser, setRejectingUser] = useState<any>(null);

  // Mock data
  const pendingUsers = [
    {
      id: "1",
      name: "Alice Smith",
      email: "alice@production.com",
      role: "DEPARTMENT_ADMIN",
      department: "PRODUCTION",
      employeeId: "PROD-992",
      reason: "I need access to manage the daily production logs and oversee the manufacturing team's efficiency reports.",
      registeredAt: "2 hours ago",
      initials: "AS"
    },
    {
      id: "2",
      name: "Bob Johnson",
      email: "bob@stores.com",
      role: "DEPARTMENT_ADMIN",
      department: "STORES",
      employeeId: "STORE-104",
      reason: "Requesting access to track inventory levels and manage incoming shipments from suppliers.",
      registeredAt: "5 hours ago",
      initials: "BJ"
    }
  ];

  const handleApprove = (id: string) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
      loading: 'Approving user...',
      success: 'User approved successfully!',
      error: 'Failed to approve user.',
    });
  };

  const handleReject = () => {
    setRejectingUser(null);
    toast.error("User request rejected.");
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Approvals Management</h1>
          <p className="text-muted-foreground">Review and manage pending account requests.</p>
        </div>

        <Tabs defaultValue="pending" onValueChange={setActiveTab}>
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <BadgeCheck className="mr-2 h-4 w-4" /> Pending ({pendingUsers.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
              <History className="mr-2 h-4 w-4" /> Review History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingUsers.map((user) => (
                  <Card key={user.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden">
                    <div className="h-1 bg-amber-500 w-full" />
                    <CardHeader className="flex flex-row items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-lg">
                        {user.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{user.name}</CardTitle>
                        <CardDescription className="truncate">{user.email}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 uppercase text-[10px]">
                        Pending
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1.5"><User size={14} /> Role</p>
                          <p className="font-medium text-xs uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1.5"><Building2 size={14} /> Department</p>
                          <p className="font-medium">{user.department}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1.5"><Clock size={14} /> Registered</p>
                          <p className="font-medium">{user.registeredAt}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground flex items-center gap-1.5"><Info size={14} /> Employee ID</p>
                          <p className="font-medium">{user.employeeId}</p>
                        </div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-xl space-y-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reason for Access</p>
                        <p className="text-sm italic leading-relaxed">&quot;{user.reason}&quot;</p>
                      </div>
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-3 border-t bg-muted/20 p-4">
                      <Button 
                        variant="outline" 
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setRejectingUser(user)}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(user.id)}
                      >
                        <Check className="mr-2 h-4 w-4" /> Approve
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                  <BadgeCheck size={40} />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-xl font-bold">All caught up!</h3>
                  <p className="text-muted-foreground">There are no pending account approvals at the moment.</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="border-none shadow-sm">
              <CardContent className="p-0 overflow-hidden rounded-xl">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role / Dept</th>
                      <th className="px-6 py-4">Decision</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">Jane Doe</td>
                      <td className="px-6 py-4">SuperAdmin</td>
                      <td className="px-6 py-4"><span className="text-green-600 font-bold">APPROVED</span></td>
                      <td className="px-6 py-4 text-muted-foreground">Oct 12, 2026</td>
                      <td className="px-6 py-4 text-muted-foreground">Initial SuperAdmin setup</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rejection Modal */}
        <Dialog open={!!rejectingUser} onOpenChange={(o) => !o && setRejectingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Account Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting <span className="font-bold text-foreground">{rejectingUser?.name}</span>. 
                They will receive this reason via email.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <label className="text-sm font-medium">Reason for rejection (optional)</label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-lg border bg-background focus:ring-2 focus:ring-ring outline-none"
                placeholder="e.g. Employee ID not found, wrong department selected..."
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectingUser(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject}>Confirm Rejection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
