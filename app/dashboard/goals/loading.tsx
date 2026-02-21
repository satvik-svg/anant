function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 space-y-2.5">
      <div className="h-4 w-40 bg-[#2e2e2e] rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-[#262626] rounded" style={{ width: `${70 + i * 10}%` }} />
      ))}
    </div>
  );
}

export default function GenericLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="h-6 w-28 bg-[#2a2a2a] rounded-lg mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} lines={i % 2 === 0 ? 2 : 3} />)}
      </div>
    </div>
  );
}
