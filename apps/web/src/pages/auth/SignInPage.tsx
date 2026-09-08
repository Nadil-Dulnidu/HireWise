import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block transition-transform hover:scale-105 mb-2">
            <img
              src="/main-logo.png"
              alt="HireWise Logo"
              className="h-12 w-auto mx-auto object-contain"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back to HireWise</h1>
          <p className="text-xs text-slate-500">Sign in to your account to continue</p>
        </div>

        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/auth-redirect"
            forceRedirectUrl="/auth-redirect"
            afterSignInUrl="/auth-redirect"
          />
        </div>
      </div>
    </div>
  )
}
