import { apiClient } from "../api-client";
import type { ApiResponse } from "@/types/auth";

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | "APPLICATION_UPDATE"
    | "INTERVIEW_SCHEDULED"
    | "AI_EVALUATION_COMPLETE"
    | "APPROVAL_REQUIRED"
    | "FEEDBACK_SUBMITTED"
    | "GENERAL";
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (limit: number = 20): Promise<AppNotification[]> => {
    const response = await apiClient.get<ApiResponse<AppNotification[]>>(
      "/notifications",
      {
        params: { limit },
      },
    );
    return response.data.data ?? [];
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<number>>(
      "/notifications/unread-count",
    );
    return response.data.data ?? 0;
  },

  markAsRead: async (id: string): Promise<boolean> => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      `/notifications/${id}/read`,
    );
    return response.data.data ?? false;
  },

  markAllAsRead: async (): Promise<boolean> => {
    const response = await apiClient.put<ApiResponse<boolean>>(
      "/notifications/read-all",
    );
    return response.data.data ?? false;
  },
};
