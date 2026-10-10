import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateEditJobPage } from "../CreateEditJobPage";
import { renderWithProviders } from "@/test/test-utils";
import * as currentUserHook from "@/hooks/useCurrentUser";
import { jobsApi } from "@/lib/api/jobs-api";
import { departmentsApi } from "@/lib/api/companies-api";

vi.mock("@/hooks/useCurrentUser");
vi.mock("@/lib/api/jobs-api", () => ({
  jobsApi: {
    getJobById: vi.fn(),
    createJob: vi.fn(),
    updateJob: vi.fn(),
  },
}));
vi.mock("@/lib/api/companies-api", () => ({
  departmentsApi: {
    getDepartments: vi.fn().mockResolvedValue([]),
  },
}));

describe("CreateEditJobPage - Form Validation and Error Handling", () => {
  const mockUseCurrentUser = vi.spyOn(currentUserHook, "useCurrentUser");

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({
      profile: {
        id: "recruiter-1",
        companyId: "comp-1",
        role: "RECRUITER",
      } as unknown as ReturnType<typeof currentUserHook.useCurrentUser>["profile"],
      clerkUser: null,
      role: "RECRUITER",
      status: "ACTIVE",
      isLoading: false,
      isSignedIn: true,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });
    vi.mocked(departmentsApi.getDepartments).mockResolvedValue([]);
  });

  describe("form validation", () => {
    it("rejects submission when job title is empty", async () => {
      const { container } = renderWithProviders(<CreateEditJobPage />);

      const form = container.querySelector("form")!;
      fireEvent.submit(form);

      expect(screen.getByText("Job title is required.")).toBeInTheDocument();
      expect(jobsApi.createJob).not.toHaveBeenCalled();
    });

    it("rejects submission when job description has fewer than 20 characters", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<CreateEditJobPage />);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Senior Full Stack Engineer/i);
      await user.type(titleInput, "Senior Engineer");

      const descriptionInput = screen.getByPlaceholderText(/Describe team mission/i);
      await user.type(descriptionInput, "Too short");

      const form = container.querySelector("form")!;
      fireEvent.submit(form);

      expect(
        screen.getByText("Job description must be at least 20 characters.")
      ).toBeInTheDocument();
      expect(jobsApi.createJob).not.toHaveBeenCalled();
    });

    it("rejects submission when job requirements field is empty", async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<CreateEditJobPage />);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Senior Full Stack Engineer/i);
      await user.type(titleInput, "Senior Engineer");

      const descriptionInput = screen.getByPlaceholderText(/Describe team mission/i);
      await user.type(descriptionInput, "This is a comprehensive job description with over twenty characters.");

      const form = container.querySelector("form")!;
      fireEvent.submit(form);

      expect(screen.getByText("Job requirements are required.")).toBeInTheDocument();
      expect(jobsApi.createJob).not.toHaveBeenCalled();
    });

    it("rejects submission when max salary is lower than min salary", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CreateEditJobPage />);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Senior Full Stack Engineer/i);
      await user.type(titleInput, "Senior Engineer");

      const descriptionInput = screen.getByPlaceholderText(/Describe team mission/i);
      await user.type(descriptionInput, "This is a comprehensive job description with over twenty characters.");

      const requirementsInput = screen.getByPlaceholderText(/3\+ years building scalable software systems/i);
      await user.type(requirementsInput, "React, TypeScript, Node.js");

      const minSalaryInput = screen.getByDisplayValue("150000");
      const maxSalaryInput = screen.getByDisplayValue("250000");

      await user.clear(minSalaryInput);
      await user.type(minSalaryInput, "300000");

      await user.clear(maxSalaryInput);
      await user.type(maxSalaryInput, "200000");

      const submitButton = screen.getByRole("button", { name: /Publish Job Opening/i });
      await user.click(submitButton);

      expect(
        screen.getByText(
          "Maximum monthly salary must be greater than or equal to minimum monthly salary."
        )
      ).toBeInTheDocument();
      expect(jobsApi.createJob).not.toHaveBeenCalled();
    });
  });

  describe("API submission & error states", () => {
    it("displays error banner when job creation API rejects the payload", async () => {
      const user = userEvent.setup();
      vi.mocked(jobsApi.createJob).mockRejectedValueOnce({
        response: {
          data: { error: "Organization subscription limit exceeded." },
        },
      });

      const { container } = renderWithProviders(<CreateEditJobPage />);

      const titleInput = screen.getByPlaceholderText(/e\.g\. Senior Full Stack Engineer/i);
      await user.type(titleInput, "Senior Engineer");

      const descriptionInput = screen.getByPlaceholderText(/Describe team mission/i);
      await user.type(descriptionInput, "This is a comprehensive job description with over twenty characters.");

      const requirementsInput = screen.getByPlaceholderText(/3\+ years building scalable software systems/i);
      await user.type(requirementsInput, "React, TypeScript, Node.js");

      const form = container.querySelector("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText("Organization subscription limit exceeded.")
        ).toBeInTheDocument();
      });
    });
  });
});
