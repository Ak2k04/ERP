"use client";

import React from "react";
import { Clock, CheckCircle2, XCircle, LogOut, RefreshCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  // Mock data - in real app, fetch from /me or session
  const user = {
    fullName: "John Doe",
    role: "DEPARTMENT_ADMIN",
    department: "PRODUCTION",
    status: "PENDING_APPROVAL"
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <div className="h-2 bg-brand rounded-t-xl" />
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="text-brand" />
          </div>
          <CardTitle>Account Pending</CardTitle>
          <CardDescription>
            Your account is waiting for approval from a SuperAdmin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span className="font-medium">{user.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="font-medium">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-medium">{user.department}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
              <span className="text-muted-foreground">Status:</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase">
                {user.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            We will notify you by email once your account has been reviewed.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" /> Check Status
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
