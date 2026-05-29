"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Loader2, 
  UserCog, 
  Building2, 
  Check, 
  X, 
  ArrowRight, 
  ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a special character"),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  department: z.enum(["PRODUCTION", "STORES"]).optional(),
  employeeId: z.string().optional(),
  reason: z.string().optional(),
  adminCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<"SUPER_ADMIN" | "DEPARTMENT_ADMIN" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthText = ["Weak", "Fair", "Strong", "Very Strong"][strength - 1] || "Weak";
  const strengthColor = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"][strength - 1] || "bg-gray-200";

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    // Simulate API call
    console.log({ ...data, role });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="text-green-600" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We sent a verification link to <span className="font-semibold text-foreground">{watch("email")}</span>. 
              Please verify your account to continue.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <div className="h-2 bg-brand rounded-t-xl" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
            <span className="text-sm text-muted-foreground">Step {step} of 2</span>
          </div>
          <CardDescription>
            {step === 1 ? "Choose your account type" : `Complete your ${role === "SUPER_ADMIN" ? "SuperAdmin" : "Department Admin"} profile`}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setRole("SUPER_ADMIN"); setStep(2); }}
              className={cn(
                "flex flex-col items-center p-6 rounded-xl border-2 transition-all hover:border-brand hover:bg-brand-subtle group",
                role === "SUPER_ADMIN" ? "border-brand bg-brand-subtle" : "border-border"
              )}
            >
              <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4 group-hover:bg-brand text-brand group-hover:text-white transition-colors">
                <UserCog size={24} />
              </div>
              <h3 className="font-bold text-lg">SuperAdmin</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Full system access and user management capabilities.
              </p>
            </button>
            <button
              onClick={() => { setRole("DEPARTMENT_ADMIN"); setStep(2); }}
              className={cn(
                "flex flex-col items-center p-6 rounded-xl border-2 transition-all hover:border-brand hover:bg-brand-subtle group",
                role === "DEPARTMENT_ADMIN" ? "border-brand bg-brand-subtle" : "border-border"
              )}
            >
              <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center mb-4 group-hover:bg-brand text-brand group-hover:text-white transition-colors">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold text-lg">Department Admin</h3>
              <p className="text-sm text-muted-foreground text-center mt-2">
                Manage specific departments (Production or Stores).
              </p>
            </button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input placeholder="John Doe" {...register("fullName")} disabled={isLoading} />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input type="email" placeholder="john@example.com" {...register("email")} disabled={isLoading} />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input type="password" {...register("password")} disabled={isLoading} />
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={cn("flex-1 rounded-full", i <= strength ? strengthColor : "bg-gray-200")} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{strengthText}</span></p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <Requirement label="8+ chars" met={password.length >= 8} />
                      <Requirement label="Uppercase" met={/[A-Z]/.test(password)} />
                      <Requirement label="Number" met={/[0-9]/.test(password)} />
                      <Requirement label="Special char" met={/[^A-Za-z0-9]/.test(password)} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input type="password" {...register("confirmPassword")} disabled={isLoading} />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
                </div>
              </div>

              {role === "DEPARTMENT_ADMIN" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Department</label>
                      <select 
                        {...register("department")} 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isLoading}
                      >
                        <option value="">Select Department</option>
                        <option value="PRODUCTION">Production</option>
                        <option value="STORES">Stores</option>
                      </select>
                      {errors.department && <p className="text-sm text-destructive">Department is required</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employee ID (Optional)</label>
                      <Input {...register("employeeId")} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reason for Access</label>
                    <textarea 
                      {...register("reason")} 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Why do you need access to this department?"
                      disabled={isLoading}
                    />
                    {errors.reason && <p className="text-sm text-destructive">Please provide a reason</p>}
                  </div>
                </>
              )}

              {role === "SUPER_ADMIN" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Code</label>
                  <Input type="password" placeholder="Enter invitation code" {...register("adminCode")} disabled={isLoading} />
                  <p className="text-xs text-muted-foreground">This code is required for SuperAdmin registration.</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={isLoading}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Complete Registration
              </Button>
            </CardFooter>
          </form>
        )}

        <CardFooter className="justify-center border-t py-4">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link href="/auth/login" className="font-medium text-brand hover:underline">Login</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

function Requirement({ label, met }: { label: string; met: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-400" />}
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  );
}
