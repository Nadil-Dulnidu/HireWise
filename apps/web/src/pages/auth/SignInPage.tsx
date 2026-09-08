import { SignIn } from '@clerk/clerk-react'
import { dark } from '@clerk/themes'
import { Sparkles } from 'lucide-react'

export function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back to HireWise</h1>
          <p className="text-xs text-slate-400">Sign in to your account to continue</p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/auth-redirect"
            forceRedirectUrl="/auth-redirect"
            afterSignInUrl="/auth-redirect"
            appearance={{
              baseTheme: dark
            }}
          />
        </div>
      </div>
    </div>
  )
}
