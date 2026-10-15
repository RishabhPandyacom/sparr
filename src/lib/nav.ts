import {
  LayoutDashboard,
  FileText,
  Mail,
  MessageSquareCode,
  Briefcase,
  Calculator,
  Bell,
  CreditCard,
  Settings,
  Target,
  KanbanSquare,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Career Plan", href: "/dashboard/career-plan", icon: Target },
  { title: "Applications", href: "/dashboard/applications", icon: KanbanSquare },
  { title: "Résumés & CVs", href: "/dashboard/resumes", icon: FileText },
  { title: "Cover Letters", href: "/dashboard/cover-letters", icon: Mail },
  {
    title: "Mock Interviews",
    href: "/dashboard/interviews",
    icon: MessageSquareCode,
  },
  {
    title: "Job Board",
    href: "/dashboard/job-board",
    icon: Briefcase,
    badge: "Soon",
  },
  {
    title: "Salary Negotiator",
    href: "/dashboard/salary-negotiator",
    icon: Calculator,
  },
  { title: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];
