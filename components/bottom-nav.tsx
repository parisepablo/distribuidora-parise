"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/historial", label: "Historial", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <ul className="mx-auto flex max-w-md items-center justify-around">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex h-16 min-h-[48px] flex-col items-center justify-center gap-1 text-sm transition-colors",
                  isActive
                    ? "font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-6",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
