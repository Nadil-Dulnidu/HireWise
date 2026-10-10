import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastContainer } from "../ToastContainer";
import { renderWithProviders } from "@/test/test-utils";
import * as toastHook from "@/hooks/useToastNotifications";

vi.mock("@/hooks/useToastNotifications");

describe("ToastContainer", () => {
  const mockUseToastNotifications = vi.spyOn(toastHook, "useToastNotifications");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when toast list is empty", () => {
    mockUseToastNotifications.mockReturnValue({
      toasts: [],
      dismiss: vi.fn(),
      addToast: vi.fn(),
      isConnected: true,
    });

    const { container } = renderWithProviders(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it("renders toast notifications with title and message", () => {
    mockUseToastNotifications.mockReturnValue({
      toasts: [
        {
          id: "toast-1",
          title: "Application Submitted",
          message: "Your application has been received.",
          type: "success",
          timestamp: Date.now(),
        },
        {
          id: "toast-2",
          title: "AI Analysis Complete",
          message: "Candidate scoring finished.",
          type: "ai",
          timestamp: Date.now(),
        },
      ],
      dismiss: vi.fn(),
      addToast: vi.fn(),
      isConnected: true,
    });

    renderWithProviders(<ToastContainer />);

    expect(screen.getByText("Application Submitted")).toBeInTheDocument();
    expect(screen.getByText("Your application has been received.")).toBeInTheDocument();
    expect(screen.getByText("AI Analysis Complete")).toBeInTheDocument();
    expect(screen.getByText("Candidate scoring finished.")).toBeInTheDocument();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
  });

  it("triggers dismiss handler when user clicks dismiss button", async () => {
    const user = userEvent.setup();
    const mockDismiss = vi.fn();

    mockUseToastNotifications.mockReturnValue({
      toasts: [
        {
          id: "toast-to-dismiss",
          title: "Action Required",
          message: "Please submit feedback.",
          type: "warning",
          timestamp: Date.now(),
        },
      ],
      dismiss: mockDismiss,
      addToast: vi.fn(),
      isConnected: true,
    });

    renderWithProviders(<ToastContainer />);

    const dismissButton = screen.getByLabelText("Dismiss notification");
    await user.click(dismissButton);

    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(mockDismiss).toHaveBeenCalledWith("toast-to-dismiss");
  });
});
