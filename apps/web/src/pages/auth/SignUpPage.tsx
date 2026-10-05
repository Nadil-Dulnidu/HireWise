import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SignUp, useClerk } from "@clerk/clerk-react";
import { User, Building, LogOut, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { UserRole } from "@/types/auth";

export function SignUpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clerk = useClerk();
  const {
    isSignedIn,
    clerkUser,
    role: currentRole,
    changeRole,
  } = useCurrentUser();
  const [isSwitching, setIsSwitching] = useState(false);

  const initialRoleFromParam = searchParams.get("role")?.toUpperCase() as
    | UserRole
    | undefined;
  const validRoles: UserRole[] = ["CANDIDATE", "RECRUITER"];

  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (initialRoleFromParam && validRoles.includes(initialRoleFromParam)) {
      return initialRoleFromParam;
    }
    return "CANDIDATE";
  });

  useEffect(() => {
    if (!isSignedIn) {
      localStorage.setItem("hirewise_selected_role", selectedRole);
    } else {
      localStorage.removeItem("hirewise_selected_role");
    }
  }, [selectedRole, isSignedIn]);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (!isSignedIn) {
      localStorage.setItem("hirewise_selected_role", role);
    }
  };


  const handleSwitchToCandidate = async () => {
    setIsSwitching(true);
    try {
      await changeRole("CANDIDATE");
      navigate("/candidate/dashboard", { replace: true });
    } catch (err) {
      console.error("Failed to switch role:", err);
      setIsSwitching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link
            to="/"
            className="inline-block transition-transform hover:scale-105 mb-2"
          >
            <img
              src="/main-logo.png"
              alt="HireWise Logo"
              className="h-12 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your HireWise Account
          </h1>
          <p className="text-xs text-slate-500">
            Choose your account role to get started
          </p>
        </div>

        {/* Already Signed In Alert / Switcher */}
        {isSignedIn && clerkUser && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="text-xs text-slate-700">
                You are currently signed in as{" "}
                <span className="font-semibold text-slate-900">
                  {clerkUser.primaryEmailAddress?.emailAddress}
                </span>{" "}
                with role{" "}
                <span className="font-semibold text-blue-600">
                  {currentRole}
                </span>
                .
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const path =
                    currentRole === "ADMIN"
                      ? "/admin/dashboard"
                      : currentRole === "RECRUITER"
                        ? "/recruiter/dashboard"
                        : currentRole === "INTERVIEWER"
                          ? "/interviewer/dashboard"
                          : "/candidate/dashboard";
                  navigate(path);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
              >
                Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
              </button>

              {currentRole !== "CANDIDATE" && (
                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={handleSwitchToCandidate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition shadow-xs"
                >
                  {isSwitching
                    ? "Switching..."
                    : "Switch this Account to Candidate"}
                </button>
              )}

              <button
                type="button"
                onClick={() => clerk.signOut()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition ml-auto"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        )}

        {/* Role Selector Tabs (Candidate / Recruiter) */}
        <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={() => handleRoleChange("CANDIDATE")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition text-xs font-medium ${
              selectedRole === "CANDIDATE"
                ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <User className="h-5 w-5" />
            <span className="font-semibold">Candidate</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Job Seeker
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange("RECRUITER")}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition text-xs font-medium ${
              selectedRole === "RECRUITER"
                ? "bg-purple-50 text-purple-700 border border-purple-200 shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Building className="h-5 w-5" />
            <span className="font-semibold">Recruiter</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Hiring & Teams
            </span>
          </button>
        </div>

        <div className="flex justify-center">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/auth-redirect"
            fallbackRedirectUrl="/auth-redirect"
            forceRedirectUrl="/auth-redirect"
            unsafeMetadata={{ role: selectedRole }}
          />
        </div>
      </div>
    </div>
  );
}
