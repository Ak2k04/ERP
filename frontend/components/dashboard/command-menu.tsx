"use client";

import React, { useEffect, useState } from "react";
import { 
  Calculator, 
  Calendar, 
  CreditCard, 
  Settings, 
  Smile, 
  User,
  LayoutDashboard,
  Factory,
  Warehouse,
  ShieldCheck,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { Command } from "cmdk";
import { 
  Dialog, 
  DialogContent 
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl border-none max-w-2xl">
        <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm">No results found.</Command.Empty>
            
            <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/production"))}>
                <Factory className="mr-2 h-4 w-4" />
                <span>Production</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/stores"))}>
                <Warehouse className="mr-2 h-4 w-4" />
                <span>Stores</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/admin"))}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </CommandItem>
            </Command.Group>

            <Command.Separator className="-mx-2 my-2 h-px bg-border" />

            <Command.Group heading="Account" className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/profile"))}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </Command.Group>

            <Command.Separator className="-mx-2 my-2 h-px bg-border" />

            <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <CommandItem onSelect={() => runCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}>
                {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>Toggle Theme</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => console.log("Logout"))}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </CommandItem>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 transition-colors"
    >
      {children}
    </Command.Item>
  );
}
