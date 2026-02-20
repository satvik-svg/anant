import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  CheckCircle,
  LayoutDashboard,
  Users,
  Calendar,
  ArrowRight,
} from "lucide-react";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Anant</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <CheckCircle className="w-4 h-4" />
          Work management for modern teams
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Manage work,{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            not chaos
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Break down goals into tasks, assign them with clear deadlines, and
          visualize progress through Kanban boards and list views. Keep your team
          aligned and accountable.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition shadow-lg shadow-indigo-200"
        >
          Start for free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: LayoutDashboard,
              title: "Kanban & List views",
              desc: "Visualize work your way — drag tasks across columns or sort them in a list.",
            },
            {
              icon: Users,
              title: "Team collaboration",
              desc: "Assign tasks, leave comments, and attach files — all in one place.",
            },
            {
              icon: Calendar,
              title: "Deadlines & priorities",
              desc: "Set due dates and priorities so nothing slips through the cracks.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
