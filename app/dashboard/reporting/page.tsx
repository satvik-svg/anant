import { getAnalytics } from "@/lib/actions/analytics";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function ReportingPage() {
  const analytics = await getAnalytics();

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
        <p className="text-gray-500 mt-1">Analytics and insights across your projects</p>
      </div>
      <AnalyticsDashboard data={analytics} />
    </div>
  );
}
