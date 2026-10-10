import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UnauthorizedPage } from "../UnauthorizedPage";
import { renderWithProviders } from "@/test/test-utils";
import * as currentUserHook from "@/hooks/useCurrentUser";

vi.mock("@/hooks/useCurrentUser");

describe("UnauthorizedPage", () => {
  const mockUseCurrentUser = vi.spyOn(currentUserHook, "useCurrentUser");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders access restricted title and active user role", () => {
    mockUseCurrentUser.mockReturnValue({
      role: "CANDIDATE",
      changeRole: vi.fn(),
      clerkUser: null,
      profile: undefined,
      status: "ACTIVE",
      isLoading: false,
      isSignedIn: true,
      refetchProfile: vi.fn(),
      error: null,
    });

    renderWithProviders(<UnauthorizedPage />);

    expect(screen.getByText("Access Restricted")).toBeInTheDocument();
    expect(screen.getByText("CANDIDATE")).toBeInTheDocument();
    expect(
      screen.getByText(/You do not have the required permissions or role/i)
    ).toBeInTheDocument();
  });

  it("links to appropriate dashboard based on user role", () => {
    mockUseCurrentUser.mockReturnValue({
      role: "RECRUITER",
      changeRole: vi.fn(),
      clerkUser: null,
      profile: undefined,
      status: "ACTIVE",
      isLoading: false,
      isSignedIn: true,
      refetchProfile: vi.fn(),
      error: null,
    });

    renderWithProviders(<UnauthorizedPage />);

    const dashboardLink = screen.getByRole("link", { name: /Go to My Dashboard/i });
    expect(dashboardLink).toHaveAttribute("href", "/recruiter/dashboard");

    const homeLink = screen.getByRole("link", { name: /Return Home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("calls changeRole when clicking the switch role button", async () => {
    const user = userEvent.setup();
    const mockChangeRole = vi.fn().mockResolvedValue(undefined);

    mockUseCurrentUser.mockReturnValue({
      role: "CANDIDATE",
      changeRole: mockChangeRole,
      clerkUser: null,
      profile: undefined,
      status: "ACTIVE",
      isLoading: false,
      isSignedIn: true,
      refetchProfile: vi.fn(),
      error: null,
    });

    renderWithProviders(<UnauthorizedPage />);

    const switchButton = screen.getByRole("button", { name: /Switch to Recruiter/i });
    await user.click(switchButton);

    expect(mockChangeRole).toHaveBeenCalledWith("RECRUITER");
  });
});
