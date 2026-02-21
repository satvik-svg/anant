import { getPortfolios } from "@/lib/actions/portfolios";
import { getTeams } from "@/lib/actions/teams";
import { PortfoliosList } from "@/components/portfolios-list";

export default async function PortfoliosPage() {
  const [portfolios, teams] = await Promise.all([getPortfolios(), getTeams()]);

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Portfolios</h1>
        <p className="text-[#a3a3a3] mt-1">Group and monitor multiple projects together</p>
      </div>
      <PortfoliosList
        portfolios={JSON.parse(JSON.stringify(portfolios))}
        teams={JSON.parse(JSON.stringify(teams))}
      />
    </div>
  );
}
