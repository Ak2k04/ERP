"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verify = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setStatus("success");
        setMessage("Email verified successfully!");
      } catch (err) {
        setStatus("error");
        setMessage("Verification failed or link expired.");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <div className="h-2 bg-brand rounded-t-xl" />
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-brand" />}
          {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-600" />}
          {status === "error" && <XCircle className="h-12 w-12 text-destructive" />}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {status === "success" && (
            <Button className="w-full" asChild>
              <Link href="/auth/login">Proceed to Login</Link>
            </Button>
          )}
          {status === "error" && (
            <Button className="w-full" variant="outline" asChild>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
