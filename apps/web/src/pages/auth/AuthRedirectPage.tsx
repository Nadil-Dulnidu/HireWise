import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/types/auth";

export function AuthRedirectPage() {
  const navigate = useNavigate();
  const {
    isSignedIn,
    isLoading,
    role,
    status,
    clerkUser,
    profile,
    refetchProfile,
  } = useCurrentUser();
  const syncAttempted = useRef(false);

  useEffect(() => {
    if (isLoading) return;

    if (!isSignedIn) {
      navigate("/sign-in", { replace: true });
      return;
    }

    const processRedirect = async () => {
      const storedRole = localStorage.getItem(
        "hirewise_selected_role",
      ) as UserRole | null;

      const metadataRole =
        (clerkUser?.publicMetadata?.role as UserRole | undefined) ||
        (clerkUser?.unsafeMetadata?.role as UserRole | undefined);
      const existingRole = profile?.role || metadataRole;

      // CRITICAL GUARD: Never allow a transient signup role in localStorage to overwrite an established user's role!
      if (existingRole && existingRole !== "CANDIDATE") {
        localStorage.removeItem("hirewise_selected_role");
      } else if (storedRole && !syncAttempted.current) {
        syncAttempted.current = true;


        try {
          if (clerkUser && clerkUser.unsafeMetadata?.role !== storedRole) {
            await clerkUser.update({
              unsafeMetadata: {
                ...clerkUser.unsafeMetadata,
                role: storedRole,
              },
            });
          }

          // Always ensure the backend DB is updated to the chosen role
          await apiClient.put("/users/me/role", { role: storedRole });
          await refetchProfile();
        } catch (err) {
          console.error("Role sync error during redirect:", err);
        } finally {
          localStorage.removeItem("hirewise_selected_role");
        }

        if (storedRole === "CANDIDATE") {
          navigate("/candidate/dashboard", { replace: true });
          return;
        }
        if (storedRole === "RECRUITER") {
          const hasClerkOrg =
            clerkUser?.organizationMemberships &&
            clerkUser.organizationMemberships.length > 0;
          const hasDbCompany = !!profile?.companyId;
          if (!hasClerkOrg && !hasDbCompany) {
            navigate("/recruiter/onboarding", { replace: true });
          } else {
            navigate("/recruiter/dashboard", { replace: true });
          }
          return;
        }
        if (storedRole === "INTERVIEWER") {
          navigate("/interviewer/dashboard", { replace: true });
          return;
        }
      }

      // Existing user role-based redirection
      const effectiveRole = profile?.role || metadataRole || role;

      // Candidates NEVER go to recruiter onboarding — send directly to candidate dashboard
      if (effectiveRole === "CANDIDATE") {
        navigate("/candidate/dashboard", { replace: true });
        return;
      }

      if (effectiveRole === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (effectiveRole === "RECRUITER") {
        const hasClerkOrg =
          clerkUser?.organizationMemberships &&
          clerkUser.organizationMemberships.length > 0;
        const hasDbCompany = !!profile?.companyId;

        if (status === "ONBOARDING" && !hasClerkOrg && !hasDbCompany) {
          navigate("/recruiter/onboarding", { replace: true });
        } else {
          navigate("/recruiter/dashboard", { replace: true });
        }
        return;
      }

      if (effectiveRole === "INTERVIEWER") {
        navigate("/interviewer/dashboard", { replace: true });
        return;
      }

      // Fallback: Default to candidate dashboard
      navigate("/candidate/dashboard", { replace: true });
    };

    processRedirect();
  }, [
    isLoading,
    isSignedIn,
    role,
    status,
    clerkUser,
    profile,
    refetchProfile,
    navigate,
  ]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">
          Directing to your workspace...
        </p>
      </div>
    </div>
  );
}
