import { apiClient } from "../api-client";
import type {
  ApiResponse,
  PagedResult,
  TeamMember,
  UserProfile,
  UserRole,
} from "@/types/auth";

// Query parameters for searching and filtering users list
export interface UserFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
  companyId?: string;
}

// Fetch paginated users with optional role, status, and company filters
export async function getUsers(
  params: UserFilterParams = {},
): Promise<PagedResult<UserProfile>> {
  const res = await apiClient.get<ApiResponse<PagedResult<UserProfile>>>(
    "/users",
    { params },
  );
  return (
    res.data.data ?? {
      items: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    }
  );
}

// Fetch single user profile by user ID
export async function getUserById(id: string): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>(`/users/${id}`);
  return res.data.data!;
}

// Update a user's system role
export async function updateUserRole(
  id: string,
  role: UserRole,
): Promise<UserProfile> {
  const res = await apiClient.put<ApiResponse<UserProfile>>(
    `/users/${id}/role`,
    { role },
  );
  return res.data.data!;
}

// Deactivate a user account
export async function deactivateUser(id: string): Promise<boolean> {
  const res = await apiClient.put<ApiResponse<boolean>>(
    `/users/${id}/deactivate`,
  );
  return res.data.data ?? true;
}

// Ban a user account with a reason
export async function banUser(id: string, reason?: string): Promise<boolean> {
  const res = await apiClient.put<ApiResponse<boolean>>(`/users/${id}/ban`, {
    reason: reason || "Violation of terms",
  });
  return res.data.data ?? true;
}

// Fetch company team members and interview statistics
export async function getTeamMembers(
  companyId?: string,
): Promise<TeamMember[]> {
  const params = companyId ? { companyId } : {};
  const res = await apiClient.get<ApiResponse<TeamMember[]>>("/users/team", {
    params,
  });
  return res.data.data ?? [];
}

// Fetch active interviewers available for scheduling
export async function getInterviewers(
  companyId?: string,
): Promise<UserProfile[]> {
  const params = companyId ? { companyId } : {};
  const res = await apiClient.get<ApiResponse<UserProfile[]>>(
    "/users/interviewers",
    { params },
  );
  return res.data.data ?? [];
}

// Fetch profile details for currently logged-in user
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>("/users/me");
  return res.data.data!;
}
