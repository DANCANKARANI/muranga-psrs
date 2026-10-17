"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  LayoutDashboard,
  MapPin,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";

const sidebarIcons = {
  dashboard: LayoutDashboard,
  requests: ClipboardList,
  location: MapPin,
  create: PlusCircle,
} satisfies Record<string, LucideIcon>;

export type SidebarIconName = keyof typeof sidebarIcons;

export interface SidebarItem {
  label: string;
  href: string;
  icon: SidebarIconName;
}

interface SidebarProps {
  items: SidebarItem[];
  activePath?: string;
}

export function Sidebar({ items, activePath: activePathProp }: SidebarProps) {
  const pathname = usePathname();
  const activePath = activePathProp ?? pathname;

  return (
    <aside className="w-full shrink-0 border-b border-slate-200 bg-white md:min-h-[calc(100vh-4rem)] md:w-64 md:border-r md:border-b-0">
      <nav aria-label="Dashboard navigation" className="p-3 md:sticky md:top-16 md:p-4">
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {items.map(({ label, href, icon }) => {
            const Icon = sidebarIcons[icon];
            const isActive =
              activePath === href ||
              (activePath.startsWith(`${href}/`) &&
                !(href.endsWith("/requests") &&
                  activePath.startsWith(`${href}/new`)));

            return (
              <li className="shrink-0 md:shrink" key={href}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-[#0f2c52] bg-blue-50 text-[#0f2c52]"
                      : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-[#0f2c52]"
                  }`}
                  href={href}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}