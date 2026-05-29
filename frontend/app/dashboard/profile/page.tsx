"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Shield, 
  CheckCircle, 
  Camera,
  Trash2,
  Lock,
  Smartphone,
  History,
  Bell,
  Save,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // I'll implement Switch below
import { Separator } from "@/components/ui/separator"; // I'll implement Separator below
import { toast } from "sonner";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  
  // Mock User
  const user = {
    name: "John Doe",
    email: "admin@erp.com",
    phone: "+1 234 567 8900",
    role: "SUPER_ADMIN",
    department: "SYSTEM ADMINISTRATION",
    employeeId: "SA-001",
    bio: "Senior systems administrator with 10 years of experience in ERP implementation.",
    joined: "January 2026",
    lastSeen: "2 hours ago",
    isEmailVerified: true
  };

  const handleSave = () => {
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and security settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Header Card */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="h-24 bg-brand" />
              <CardContent className="pt-0 flex flex-col items-center text-center -mt-12">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-brand-light border-4 border-card flex items-center justify-center text-brand text-3xl font-bold">
                    JD
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-brand text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} />
                  </button>
                </div>
                <div className="mt-4 space-y-1">
                  <h2 className="text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge className="bg-brand text-white uppercase text-[10px] tracking-widest">{user.role}</Badge>
                  <Badge variant="outline" className="uppercase text-[10px]">{user.department}</Badge>
                </div>
                <div className="mt-6 w-full pt-6 border-t space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Member since</span>
                    <span className="text-foreground font-medium">{user.joined}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Last seen</span>
                    <span className="text-foreground font-medium">{user.lastSeen}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><History size={18} /> Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="w-1 h-8 bg-brand rounded-full shrink-0" />
                  <div>
                    <p className="font-medium">Password changed</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-8 bg-brand rounded-full shrink-0 opacity-30" />
                  <div>
                    <p className="font-medium">Logged in from Chrome (Windows)</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-6">
                <div>
                  <CardTitle className="text-xl">Personal Information</CardTitle>
                  <CardDescription>Manage your public profile details</CardDescription>
                </div>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button className="bg-brand" size="sm" onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save</Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue={user.name} disabled={!isEditing} className="pl-10 disabled:opacity-100 disabled:bg-muted/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Email Address</label>
                      {user.isEmailVerified && <span className="flex items-center text-[10px] text-green-600 font-bold uppercase"><CheckCircle size={10} className="mr-1" /> Verified</span>}
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue={user.email} disabled className="pl-10 bg-muted/30 opacity-100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue={user.phone} disabled={!isEditing} className="pl-10 disabled:opacity-100 disabled:bg-muted/30" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Employee ID</label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input defaultValue={user.employeeId} disabled className="pl-10 bg-muted/30 opacity-100" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Bio / About</label>
                  <textarea 
                    defaultValue={user.bio} 
                    disabled={!isEditing} 
                    className="w-full min-h-[100px] p-3 rounded-lg border bg-background disabled:bg-muted/30 focus:ring-2 focus:ring-brand outline-none text-sm transition-all"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="border-b pb-6">
                <CardTitle className="text-xl flex items-center gap-2"><Lock size={20} /> Security Settings</CardTitle>
                <CardDescription>Secure your account with multi-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground max-w-sm">Add an extra layer of security to your account by requiring a code from your phone.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">Coming Soon</Badge>
                    <Switch disabled />
                  </div>
                </div>
                
                <Separator />

                <div className="space-y-4">
                  <p className="font-bold text-sm">Update Password</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input type="password" placeholder="Current Password" />
                    <Input type="password" placeholder="New Password" />
                    <Button className="bg-brand">Update</Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <p className="font-bold text-sm">Active Sessions</p>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-4">
                      <Smartphone size={24} className="text-brand" />
                      <div>
                        <p className="text-sm font-bold">Chrome on Windows</p>
                        <p className="text-xs text-muted-foreground">IP: 192.168.1.1 • Location: Bangalore, IN</p>
                      </div>
                    </div>
                    <Badge variant="success" className="text-[10px] font-bold uppercase">Active Now</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    Logout from all other devices
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-100 bg-red-50/30 dark:bg-red-950/10">
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions for your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Once you delete your account, there is no going back. Please be certain.</p>
                  </div>
                  <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
