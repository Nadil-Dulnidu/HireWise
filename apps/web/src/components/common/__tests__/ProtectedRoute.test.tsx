import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "../ProtectedRoute";
import { renderWithProviders } from "@/test/test-utils";
import * as currentUserHook from "@/hooks/useCurrentUser";

vi.mock("@/hooks/useCurrentUser");

describe("ProtectedRoute", () => {
  const mockUseCurrentUser = vi.spyOn(currentUserHook, "useCurrentUser");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderProtectedRoute = (
    allowedRoles?: ("ADMIN" | "RECRUITER" | "INTERVIEWER" | "CANDIDATE")[],
    initialEntry = "/protected"
  ) => {
    return renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
          <Route path="/protected" element={<div>Protected Resource Content</div>} />
        </Route>
        <Route path="/sign-in" element={<div>Sign In Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route path="/recruiter/onboarding" element={<div>Recruiter Onboarding Page</div>} />
      </Routes>,
      {
        routerProps: { initialEntries: [initialEntry] },
      }
    );
  };

  it("renders loading spinner while session authentication is resolving", () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: true,
      isSignedIn: false,
      role: "CANDIDATE",
      status: "ACTIVE",
      clerkUser: null,
      profile: undefined,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });

    renderProtectedRoute(["CANDIDATE"]);

    expect(screen.getByText("Authenticating session...")).toBeInTheDocument();
    expect(screen.queryByText("Protected Resource Content")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated users to /sign-in", () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      isSignedIn: false,
      role: "CANDIDATE",
      status: "ACTIVE",
      clerkUser: null,
      profile: undefined,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });

    renderProtectedRoute(["CANDIDATE"]);

    expect(screen.getByText("Sign In Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Resource Content")).not.toBeInTheDocument();
  });

  it("displays deactivated account screen when user status is INACTIVE", () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      role: "CANDIDATE",
      status: "INACTIVE",
      clerkUser: null,
      profile: undefined,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });

    renderProtectedRoute(["CANDIDATE"]);

    expect(screen.getByText("Account Deactivated")).toBeInTheDocument();
    expect(
      screen.getByText("Your account has been deactivated or suspended by platform administrators.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Protected Resource Content")).not.toBeInTheDocument();
  });

  it("redirects recruiters in onboarding status without an organization to onboarding page", () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      role: "RECRUITER",
      status: "ONBOARDING",
      clerkUser: { organizationMemberships: [] } as unknown as ReturnType<
        typeof currentUserHook.useCurrentUser
      >["clerkUser"],
      profile: undefined,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });

    renderProtectedRoute(["RECRUITER"]);

    expect(screen.getByText("Recruiter Onboarding Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Resource Content")).not.toBeInTheDocument();
  });

  it("redirects to /unauthorized when user role does not match allowedRoles", () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      role: "CANDIDATE",
      status: "ACTIVE",
      clerkUser: null,
      profile: undefined,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });

    renderProtectedRoute(["ADMIN", "RECRUITER"]);

    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
    expect(screen.queryByText("Protected Resource Content")).not.toBeInTheDocument();
  });

  it("renders protected content when user is signed in and role matches allowedRoles", () => {
    mockUseCurrentUser.mockReturnValue({
      isLoading: false,
      isSignedIn: true,
      role: "RECRUITER",
      status: "ACTIVE",
      clerkUser: { organizationMemberships: [{ id: "org_123" }] } as unknown as ReturnType<
        typeof currentUserHook.useCurrentUser
      >["clerkUser"],
      profile: undefined,
      refetchProfile: vi.fn(),
      changeRole: vi.fn(),
      error: null,
    });

    renderProtectedRoute(["RECRUITER"]);

    expect(screen.getByText("Protected Resource Content")).toBeInTheDocument();
    expect(screen.queryByText("Sign In Page")).not.toBeInTheDocument();
    expect(screen.queryByText("Unauthorized Page")).not.toBeInTheDocument();
  });
});
