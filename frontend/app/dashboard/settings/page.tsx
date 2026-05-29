"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/layout";
import { 
  Settings, 
  Palette, 
  Bell, 
  ShieldCheck, 
  Globe, 
  Clock, 
  Layout,
  Check,
  Monitor,
  Moon,
  Sun
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const { theme, setTheme } = useTheme();

  const sidebarItems = [
    { id: "general", label: "General", icon: Settings },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
  ];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences and global settings.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sub Navigation */}
          <aside className="lg:w-64 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                  activeSection === item.id 
                    ? "bg-brand text-white shadow-lg shadow-brand/20" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </aside>

          {/* Settings Content */}
          <div className="flex-1 max-w-3xl">
            {activeSection === "general" && (
              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Language & Regional</CardTitle>
                    <CardDescription>Select your preferred language and date format</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Language</label>
                        <select className="w-full h-11 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-2 focus:ring-brand outline-none">
                          <option>English (US)</option>
                          <option disabled>Hindi (Coming Soon)</option>
                          <option disabled>Kannada (Coming Soon)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Timezone</label>
                        <select className="w-full h-11 px-3 rounded-lg border bg-background text-sm font-medium focus:ring-2 focus:ring-brand outline-none">
                          <option>(UTC+05:30) Chennai, Kolkata, Mumbai</option>
                          <option>(UTC+00:00) London</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Theme Preference</CardTitle>
                    <CardDescription>Choose how AdminHub looks to you</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    {[
                      { id: "light", label: "Light", icon: Sun, color: "bg-slate-100" },
                      { id: "dark", label: "Dark", icon: Moon, color: "bg-slate-900" },
                      { id: "system", label: "System", icon: Monitor, color: "bg-gradient-to-br from-slate-100 to-slate-900" }
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all group",
                          theme === t.id ? "border-brand bg-brand-subtle" : "border-border hover:border-brand/30"
                        )}
                      >
                        <div className={cn("w-full h-16 rounded-lg flex items-center justify-center text-white", t.color)}>
                          <t.icon size={24} className={t.id === "light" ? "text-slate-900" : "text-white"} />
                        </div>
                        <span className={cn("text-xs font-bold uppercase tracking-widest", theme === t.id ? "text-brand" : "text-muted-foreground")}>
                          {t.label}
                        </span>
                        {theme === t.id && <div className="absolute top-2 right-2 w-4 h-4 bg-brand rounded-full flex items-center justify-center"><Check size={10} className="text-white" /></div>}
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Layout Configuration</CardTitle>
                    <CardDescription>Customize the sidebar and spacing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Compact Mode</p>
                        <p className="text-xs text-muted-foreground">Reduce padding and font sizes globally.</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Minimal Sidebar</p>
                        <p className="text-xs text-muted-foreground">Use white/dark sidebar instead of Royal Blue.</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Email Notifications</CardTitle>
                    <CardDescription>Configure when you want to be emailed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { title: "Account Security", desc: "Get notified about suspicious logins or password changes." },
                      { title: "Approval Requests", desc: "New users waiting for your review." },
                      { title: "System Updates", desc: "New features and maintenance announcements." },
                      { title: "Weekly Digest", desc: "A summary of activity and stats from the past week." }
                    ].map((notif, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{notif.title}</p>
                          <p className="text-xs text-muted-foreground">{notif.desc}</p>
                        </div>
                        <Switch defaultChecked={i < 2} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
