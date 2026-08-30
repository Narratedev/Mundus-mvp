"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/post", label: "Post", icon: PlusCircle },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 glass border-t border-white/10 md:top-0 md:bottom-auto md:border-b md:border-t-0">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2 md:max-w-5xl md:justify-between md:px-4">
        <div className="hidden md:flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-300">
            M
          </div>
          <span className="font-semibold">Mundus</span>
        </div>
        <div className="flex w-full justify-around md:w-auto md:gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-0.5 md:gap-2 rounded-xl px-3 py-2 text-xs md:text-sm transition",
                  active
                    ? "text-indigo-300 bg-indigo-500/10"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
