"use client";

import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-950/30 rounded-3xl flex items-center justify-center text-red-600">
          <ShieldAlert size={48} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-xl text-muted-foreground font-medium">403 Forbidden</p>
          <p className="text-muted-foreground pt-2">
            You don&apos;t have permission to view this page. Please contact your system administrator if you believe this is an error.
          </p>
        </div>
        <Button className="bg-brand" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
