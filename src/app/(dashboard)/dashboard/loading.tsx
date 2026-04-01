export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-72 bg-gray-200" />
        <div className="h-4 w-48 bg-gray-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 border border-gray-200 bg-white p-4">
            <div className="h-3 w-20 bg-gray-100" />
            <div className="mt-4 h-6 w-16 bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
