"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCompany } from "@/lib/company-context";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  BarChart3,
  Settings,
  GitBranch,
  FolderKanban,
  Building2,
} from "lucide-react";

const navigation = [
  { name: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { name: "직원 관리", href: "/employees", icon: Users },
  { name: "업무 목록", href: "/tasks", icon: ClipboardList },
  { name: "Git 활동", href: "/git-activities", icon: GitBranch },
  { name: "카테고리", href: "/categories", icon: FolderKanban },
  { name: "리포트", href: "/reports", icon: BarChart3 },
  { name: "설정", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentCompany } = useCompany();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold">Work Monitor</span>
          </Link>
        </div>

        {/* Current Company */}
        {currentCompany && (
          <div className="px-2 py-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentCompany.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentCompany.role === "OWNER" && "소유자"}
                  {currentCompany.role === "ADMIN" && "관리자"}
                  {currentCompany.role === "MANAGER" && "매니저"}
                  {currentCompany.role === "MEMBER" && "멤버"}
                </p>
              </div>
              {currentCompany.isDemo && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                  Demo
                </span>
              )}
            </div>
          </div>
        )}

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
