import Link from "next/link";
import { Activity, BarChart3, Columns3, FileText, Inbox, Moon } from "lucide-react";
import { LogoutButton } from "@/components/forms/logout-button";
import { requireAdmin } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-svh bg-muted/35">
      <aside className="border-b bg-card print:hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-2 px-5 font-semibold">
          <Moon className="size-5 text-primary" />
          MoonGift CRM
        </div>
        <nav className="flex gap-2 overflow-auto px-4 pb-4 text-sm lg:grid lg:overflow-visible">
          <NavItem href="/dashboard" icon={<BarChart3 className="size-4" />} label="Overview" />
          <NavItem href="/dashboard/leads" icon={<Inbox className="size-4" />} label="Leads" />
          <NavItem href="/dashboard/pipeline" icon={<Columns3 className="size-4" />} label="Pipeline" />
          <NavItem href="/dashboard/quotes" icon={<FileText className="size-4" />} label="Quotes" />
          <NavItem href="/dashboard/revenue" icon={<BarChart3 className="size-4" />} label="Revenue" />
          <NavItem href="/dashboard/activity" icon={<Activity className="size-4" />} label="Activity" />
        </nav>
        <div className="px-4 pb-4 lg:absolute lg:bottom-0 lg:left-0 lg:right-0">
          <LogoutButton />
        </div>
      </aside>
      <main className="container-page py-8 print:ml-0 print:w-full print:px-0 print:py-0 lg:ml-64 lg:w-auto lg:px-8">{children}</main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
      {icon}
      {label}
    </Link>
  );
}
