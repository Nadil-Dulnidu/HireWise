export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";
export type ExperienceLevel = "ENTRY" | "MID" | "SENIOR" | "LEAD";
export type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";

export interface Company {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  createdByUserId?: string | null;
  createdByName?: string | null;
  employeeCount: number;
  departmentCount: number;
  activeJobCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string | null;
  companyId: string;
  companyName?: string | null;
  activeJobCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  status: JobStatus;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyLocation?: string | null;
  departmentId?: string | null;
  departmentName?: string | null;
  createdByUserId: string;
  createdByName?: string | null;
  applicationDeadline?: string | null;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobSummary {
  id: string;
  title: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  status: JobStatus;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string | null;
  departmentName?: string | null;
  applicationDeadline?: string | null;
  createdAt: string;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  status: JobStatus;
  companyId?: string | null;
  departmentId?: string | null;
  applicationDeadline?: string | null;
}

export interface UpdateJobPayload {
  title: string;
  description: string;
  requirements: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency: string;
  departmentId?: string | null;
  applicationDeadline?: string | null;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  companyId?: string;
}

export interface UpdateDepartmentPayload {
  name: string;
  description?: string;
}

export interface CreateCompanyPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

export interface UpdateCompanyPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

export interface JobFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: JobStatus;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  companyId?: string;
  departmentId?: string;
  minSalary?: number;
  maxSalary?: number;
  publicOnly?: boolean;
}
