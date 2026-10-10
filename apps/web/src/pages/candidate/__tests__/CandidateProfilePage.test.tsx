import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateProfilePage } from "../CandidateProfilePage";
import { renderWithProviders } from "@/test/test-utils";
import * as currentUserHook from "@/hooks/useCurrentUser";
import { apiClient } from "@/lib/api-client";

vi.mock("@/hooks/useCurrentUser");
vi.mock("@/lib/api-client", () => ({
  apiClient: {
    put: vi.fn(),
  },
}));

describe("CandidateProfilePage - Form Validation and Error Handling", () => {
  const mockUseCurrentUser = vi.spyOn(currentUserHook, "useCurrentUser");
  const mockRefetchProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentUser.mockReturnValue({
      profile: {
        id: "usr-1",
        clerkUserId: "user_test_clerk",
        firstName: "Jane",
        lastName: "Doe",
        fullName: "Jane Doe",
        email: "jane@example.com",
        phone: "+94771234567",
        role: "CANDIDATE",
        status: "ACTIVE",
        createdAt: "2026-01-01",
      },
      refetchProfile: mockRefetchProfile,
      clerkUser: null,
      role: "CANDIDATE",
      status: "ACTIVE",
      isLoading: false,
      isSignedIn: true,
      changeRole: vi.fn(),
      error: null,
    });
  });

  it("renders pre-populated form fields from candidate profile", () => {
    renderWithProviders(<CandidateProfilePage />);

    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+94771234567")).toBeInTheDocument();
  });

  describe("form validation", () => {
    it("displays error when required first name or last name is missing", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CandidateProfilePage />);

      const firstNameInput = screen.getByDisplayValue("Jane");
      await user.clear(firstNameInput);

      const submitButton = screen.getByRole("button", {
        name: /Save Profile Changes/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("First name and last name are required.")
      ).toBeInTheDocument();
      expect(apiClient.put).not.toHaveBeenCalled();
    });

    it("displays error when fields only contain whitespace", async () => {
      const user = userEvent.setup();
      renderWithProviders(<CandidateProfilePage />);

      const lastNameInput = screen.getByDisplayValue("Doe");
      await user.clear(lastNameInput);
      await user.type(lastNameInput, "   ");

      const submitButton = screen.getByRole("button", {
        name: /Save Profile Changes/i,
      });
      await user.click(submitButton);

      expect(
        screen.getByText("First name and last name are required.")
      ).toBeInTheDocument();
      expect(apiClient.put).not.toHaveBeenCalled();
    });
  });

  describe("API integration & state transitions", () => {
    it("successfully submits updated profile and displays success alert", async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.put).mockResolvedValueOnce({
        data: {
          success: true,
          data: { firstName: "Janet", lastName: "Smith" },
        },
      });

      renderWithProviders(<CandidateProfilePage />);

      const firstNameInput = screen.getByDisplayValue("Jane");
      await user.clear(firstNameInput);
      await user.type(firstNameInput, "Janet");

      const submitButton = screen.getByRole("button", {
        name: /Save Profile Changes/i,
      });
      await user.click(submitButton);

      expect(apiClient.put).toHaveBeenCalledWith("/users/me", {
        firstName: "Janet",
        lastName: "Doe",
        phone: "+94771234567",
      });

      await waitFor(() => {
        expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
      });
      expect(mockRefetchProfile).toHaveBeenCalled();
    });

    it("displays server error message when API rejects the update request", async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.put).mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: "Invalid telephone number format." },
        },
      });

      renderWithProviders(<CandidateProfilePage />);

      const submitButton = screen.getByRole("button", {
        name: /Save Profile Changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Invalid telephone number format.")
        ).toBeInTheDocument();
      });
    });

    it("falls back to generic error message when network request fails completely", async () => {
      const user = userEvent.setup();
      vi.mocked(apiClient.put).mockRejectedValueOnce(new Error("Network Error"));

      renderWithProviders(<CandidateProfilePage />);

      const submitButton = screen.getByRole("button", {
        name: /Save Profile Changes/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Network Error")).toBeInTheDocument();
      });
    });
  });
});
