import { DashboardLayout, type NavItem } from "./DashboardLayout";
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  Users,
  UserCheck,
  FileSpreadsheet,
  Activity,
} from "lucide-react";

const recruiterNav: NavItem[] = [
  { label: "Dashboard", href: "/recruiter/dashboard", icon: LayoutDashboard },
  { label: "Company Profile", href: "/recruiter/companies", icon: Building2 },
  { label: "Team & Interviewers", href: "/recruiter/team", icon: UserCheck },
  { label: "Job Postings", href: "/recruiter/jobs", icon: Briefcase },
  {
    label: "Applications",
    href: "/recruiter/applications",
    icon: FileSpreadsheet,
  },
  { label: "Interviews", href: "/recruiter/interviews", icon: Users },
  {
    label: "AI Workflow Monitor",
    href: "/recruiter/ai-workflows",
    icon: Activity,
  },
];

export function RecruiterLayout() {
  return (
    <DashboardLayout
      navItems={recruiterNav}
      roleTitle="Recruiter Workspace"
      roleColor="text-indigo-600"
    />
  );
}
