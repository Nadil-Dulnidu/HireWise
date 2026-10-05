// Defines the available employment types
export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERNSHIP";

// Defines the available experience levels
export type ExperienceLevel = "ENTRY" | "MID" | "SENIOR" | "LEAD";
// Defines the possible job statuses
export type JobStatus = "DRAFT" | "OPEN" | "PAUSED" | "CLOSED";

// Represents company information returned by the API
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

// Represents department information returned by the API
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

// Represents complete job information returned by the API
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

// Represents the main job fields used in job listings
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

// Defines the data needed to create a new job
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

// Defines the data that can be updated for a job
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

// Defines the data needed to create a new department
export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  companyId?: string;
}

// Defines the data that can be updated for a department
export interface UpdateDepartmentPayload {
  name: string;
  description?: string;
}

// Defines the data needed to create a new company
export interface CreateCompanyPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

// Defines the data that can be updated for a company
export interface UpdateCompanyPayload {
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

// Defines the available filters for job searches
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
