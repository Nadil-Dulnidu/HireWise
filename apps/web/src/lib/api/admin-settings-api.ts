import { apiClient } from "../api-client";
import type { ApiResponse } from "@/types/auth";

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

export async function getPlatformSettings(): Promise<PlatformSetting[]> {
  const res =
    await apiClient.get<ApiResponse<PlatformSetting[]>>("/platform-settings");
  return res.data.data ?? [];
}

export async function updatePlatformSettings(
  settings: Record<string, string>,
): Promise<PlatformSetting[]> {
  const res = await apiClient.put<ApiResponse<PlatformSetting[]>>(
    "/platform-settings",
    { settings },
  );
  return res.data.data ?? [];
}
