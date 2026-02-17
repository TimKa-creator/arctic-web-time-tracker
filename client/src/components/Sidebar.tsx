import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, BarChart3, Clock, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Tracker", icon: Clock, href: "/" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Reports", icon: BarChart3, href: "/reports" },
];

export function Sidebar() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const NavContent = () => (
    <div className="flex flex-col h-full py-8">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-display">
          Chrono
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Professional Time Tracking</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <button
                onClick={() => setOpen(false)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "animate-pulse" : "group-hover:scale-110 transition-transform")} />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 mt-auto">
        <div className="bg-card border p-4 rounded-xl shadow-sm">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Pro Tip</p>
          <p className="text-sm text-card-foreground">Use project colors to organize your dashboard instantly.</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shadow-lg">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-80">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 border-r bg-background/50 backdrop-blur-xl z-30">
        <NavContent />
      </aside>
    </>
  );
}
