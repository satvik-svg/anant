import { getGoals } from "@/lib/actions/goals";
import { GoalsList } from "@/components/goals-list";

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Goals</h1>
        <p className="text-[#a3a3a3] mt-1">Track high-level objectives and their progress</p>
      </div>
      <GoalsList goals={JSON.parse(JSON.stringify(goals))} />
    </div>
  );
}
