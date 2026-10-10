import { describe, it, expect, vi, beforeEach } from "vitest";
import { jobsApi } from "../jobs-api";
import { apiClient } from "../../api-client";
import type { CreateJobPayload } from "@/types/jobs";

vi.mock("../../api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("jobsApi integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicJobs", () => {
    it("fetches public jobs with publicOnly flag and query parameters", async () => {
      const mockResult = {
        items: [{ id: "job-1", title: "Software Engineer", status: "OPEN" }],
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockResult,
          timestamp: new Date().toISOString(),
        },
      });

      const params = { search: "Software", location: "Remote" };
      const result = await jobsApi.getPublicJobs(params);

      expect(apiClient.get).toHaveBeenCalledWith("/jobs", {
        params: {
          search: "Software",
          location: "Remote",
          publicOnly: true,
        },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe("createJob", () => {
    it("sends job payload and returns created job response data", async () => {
      const mockCreatedJob = {
        id: "new-job-123",
        title: "Senior React Developer",
        description: "Looking for expert React dev.",
        status: "OPEN",
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockCreatedJob,
          timestamp: new Date().toISOString(),
        },
      });

      const payload: CreateJobPayload = {
        title: "Senior React Developer",
        location: "Colombo",
        employmentType: "FULL_TIME",
        experienceLevel: "SENIOR",
        description: "Looking for expert React dev.",
        requirements: "5+ years experience",
        status: "OPEN",
        salaryCurrency: "USD",
      };

      const result = await jobsApi.createJob(payload);

      expect(apiClient.post).toHaveBeenCalledWith("/jobs", payload);
      expect(result).toEqual(mockCreatedJob);
    });

    it("propagates error when createJob API request fails", async () => {
      const apiError = new Error("Failed to create job - validation error");
      vi.mocked(apiClient.post).mockRejectedValueOnce(apiError);

      const payload: CreateJobPayload = {
        title: "Senior React Developer",
        location: "Colombo",
        employmentType: "FULL_TIME",
        experienceLevel: "SENIOR",
        description: "Short",
        requirements: "None",
        status: "OPEN",
        salaryCurrency: "USD",
      };

      await expect(jobsApi.createJob(payload)).rejects.toThrow(
        "Failed to create job - validation error"
      );
    });
  });

  describe("getJobById", () => {
    it("fetches single job details by id", async () => {
      const mockJob = { id: "job-99", title: "DevOps Engineer" };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: {
          success: true,
          data: mockJob,
          timestamp: new Date().toISOString(),
        },
      });

      const result = await jobsApi.getJobById("job-99");

      expect(apiClient.get).toHaveBeenCalledWith("/jobs/job-99");
      expect(result).toEqual(mockJob);
    });
  });
});
