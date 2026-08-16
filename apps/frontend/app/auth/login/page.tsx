import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Sign in to Oracle69</h2>
          <p className="mt-2 text-sm text-gray-600">AI Business Operating System</p>
        </div>
        <LoginForm />
        <div className="text-center">
          <a href="/auth/register" className="text-sm text-indigo-600 hover:text-indigo-500">
            Don't have an account? Register
          </a>
        </div>
      </div>
    </div>
  );
}
