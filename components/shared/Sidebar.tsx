"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  BarChart3,
  LayoutDashboard,
  List,
  MapPin,
  PlusCircle,
  Settings,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import countyCrest from "@/public/logo.png";

const sidebarIcons = {
  dashboard: LayoutDashboard,
  requests: ClipboardList,
  list: List,
  analytics: BarChart3,
  settings: Settings,
  location: MapPin,
  create: PlusCircle,
  profile: UserRound,
  community: UsersRound,
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
  className?: string;
  onNavigate?: () => void;
  showBrand?: boolean;
}

export function Sidebar({
  items,
  activePath: activePathProp,
  className,
  onNavigate,
  showBrand = false,
}: SidebarProps) {
  const pathname = usePathname();
  const activePath = activePathProp ?? pathname;

  return (
    <aside className={`h-full w-64 shrink-0 border-r border-slate-200 bg-white ${className ?? ""}`}>
      {showBrand && (
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <Image
            alt="Murang’a County Government crest"
            className="size-10 shrink-0 object-contain"
            height={40}
            priority
            src={countyCrest}
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#0f2c52]">Murang&apos;a County</p>
            <p className="truncate text-xs text-slate-600">Public Service Portal</p>
          </div>
        </div>
      )}
      <nav aria-label="Dashboard navigation" className="p-4">
        <ul className="flex flex-col gap-1">
          {items.map(({ label, href, icon }) => {
            const Icon = sidebarIcons[icon];
            const isActive =
              activePath === href ||
              (href !== "/dashboard" &&
                href !== "/admin" &&
                href !== "/dashboard/requests/new" &&
                activePath.startsWith(`${href}/`) &&
                !(
                  href === "/dashboard/requests" &&
                  (activePath === "/dashboard/requests/new" ||
                    activePath.startsWith("/dashboard/requests/new/"))
                ));

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
                  onClick={onNavigate}
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
