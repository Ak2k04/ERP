"use client";

import React from "react";
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronRight, 
  Sun, 
  Moon,
  LogOut,
  User,
  Settings,
  CreditCard
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { useSession, signOut } from "next-auth/react";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "admin@erp.com",
    role: (session?.user as any)?.role || "DEPARTMENT_ADMIN",
    initials: (session?.user?.name || "U").split(' ').map(n => n[0]).join('').toUpperCase()
  };

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, array) => {
      const href = "/" + array.slice(0, index + 1).join("/");
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      return { title, href };
    });

  return (
    <header className="h-16 bg-header-bg border-b border-header-border px-4 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu size={20} />
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.href}>
              {i > 0 && <ChevronRight size={14} className="text-muted-foreground" />}
              <Link 
                href={crumb.href}
                className={cn(
                  "hover:text-brand transition-colors capitalize",
                  i === breadcrumbs.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {crumb.title}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand">
          <Search size={20} />
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-brand">
            <Bell size={20} />
          </Button>
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-header-bg" />
        </div>

        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-brand"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 ml-2 p-1 rounded-full hover:bg-muted transition-colors outline-none">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold">
                {user.initials}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <div className="mt-1">
                  <span className="px-2 py-0.5 bg-brand-subtle text-brand text-[10px] font-bold uppercase rounded">
                    {user.role}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
