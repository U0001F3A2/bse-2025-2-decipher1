"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PieChart,
  Vault,
  TrendingUp,
  Vote,
  Settings,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Index Fund", href: "/index-fund", icon: PieChart },
  { name: "LP Vault", href: "/lp-vault", icon: Vault },
  { name: "Leverage", href: "/leverage", icon: TrendingUp },
  { name: "Governance", href: "/governance", icon: Vote },
  { name: "Admin", href: "/admin", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64
          border-r border-white/10 bg-bg-primary
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-end p-4 lg:hidden">
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3
                    text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-gradient-to-r from-accent-purple/20 to-accent-blue/20 text-white"
                        : "text-foreground-muted hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-accent-purple" : ""
                    }`}
                  />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-accent-purple" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 p-4">
            <div className="rounded-xl bg-gradient-to-r from-accent-purple/10 to-accent-cyan/10 p-4">
              <p className="text-xs text-foreground-muted">Network</p>
              <p className="mt-1 text-sm font-medium">Base Sepolia</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
