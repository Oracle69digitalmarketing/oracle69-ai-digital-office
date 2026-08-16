import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Join Oracle69</h2>
          <p className="mt-2 text-sm text-gray-600">Start your AI-powered organization</p>
        </div>
        <RegisterForm />
        <div className="text-center">
          <a href="/auth/login" className="text-sm text-indigo-600 hover:text-indigo-500">
            Already have an account? Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
