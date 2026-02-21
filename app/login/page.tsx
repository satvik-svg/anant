"use client";

import { useState, Suspense } from "react";
import { loginUser } from "@/lib/actions/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";

function LoginForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    formData.set("callbackUrl", callbackUrl);
    const result = await loginUser(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] bg-dot-pattern">
      <div className="w-full max-w-md px-4">
        <div className="bg-[#141414] rounded-2xl shadow-2xl border border-[#262626] p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#6B7A45] mb-4">
              <LogIn className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#f5f5f5]">Welcome back</h1>
            <p className="text-[#737373] mt-1">Sign in to your workspace</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 text-red-400 text-sm rounded-lg p-3 mb-6 border border-red-900">
              {error}
            </div>
          )}

          {/* Form */}
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#262626] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none transition text-sm text-[#f5f5f5] placeholder-[#525252]"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#262626] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none transition text-sm text-[#f5f5f5] placeholder-[#525252]"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#6B7A45] text-white font-medium rounded-xl hover:bg-[#4e5a31] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#737373] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#6B7A45] hover:text-[#8a9a5b] font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
