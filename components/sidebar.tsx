"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Profile, ROLE_LABELS } from "@/lib/types";
import { signOut } from "@/app/(auth)/actions";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  GraduationCap,
  Plus,
  LogOut,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

function getNavForRole(role: Profile["role"]): NavItem[] {
  const base: NavItem[] = [
    { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={18} /> },
    { href: "/cases", label: "전체 케이스", icon: <ClipboardList size={18} /> },
  ];

  if (role === "agent") {
    return [
      { href: "/dashboard", label: "내 케이스", icon: <LayoutDashboard size={18} /> },
      { href: "/cases/new", label: "신규 신청", icon: <Plus size={18} /> },
      { href: "/cases", label: "전체 보기", icon: <ClipboardList size={18} /> },
    ];
  }

  if (role === "teacher") {
    return [
      { href: "/dashboard", label: "내 수업", icon: <LayoutDashboard size={18} /> },
      { href: "/cases", label: "전체 보기", icon: <ClipboardList size={18} /> },
    ];
  }

  return [
    ...base,
    { href: "/cases/new", label: "신규 등록", icon: <Plus size={18} /> },
    { href: "/team", label: "팀 관리", icon: <Users size={18} /> },
  ];
}

export function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const nav = getNavForRole(profile.role);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="h-16 flex items-center gap-2 border-b border-gray-200 px-6">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
          L
        </div>
        <span className="font-semibold text-lg">Lidia</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
            {profile.full_name.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">
              {profile.full_name}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {ROLE_LABELS[profile.role]}
            </div>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileHeader({ profile }: { profile: Profile }) {
  return (
    <header className="md:hidden h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">
          L
        </div>
        <span className="font-semibold">Lidia</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{profile.full_name}</span>
        <form action={signOut}>
          <button type="submit" className="text-sm text-gray-500">
            로그아웃
          </button>
        </form>
      </div>
    </header>
  );
}

export function MobileNav({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const nav = getNavForRole(profile.role);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="grid grid-cols-4">
        {nav.slice(0, 4).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs",
                active ? "text-brand-600" : "text-gray-600"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
