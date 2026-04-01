export default function LeadsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 bg-gray-200" />
        <div className="h-9 w-28 bg-gray-200" />
      </div>
      <div className="border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="h-4 w-full bg-gray-100" />
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-b-0"
          >
            <div className="h-4 w-40 bg-gray-100" />
            <div className="h-4 w-48 bg-gray-50" />
            <div className="h-4 w-24 bg-gray-100" />
            <div className="ml-auto h-4 w-20 bg-gray-50" />
          </div>
        ))}
      </div>
    </div>
  );
}
